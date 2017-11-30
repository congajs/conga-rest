const bytes = require('bytes');
const bodyParser = require('body-parser');
const mime = require('mime-types');

module.exports = function ResumableUploadHandler(
    container,
    name,
    uri,
    controller,
    controllerAnnotation,
    annotation,
    controllerObj,
    routes) {

    /**
     * The upload controller action
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {void}
     */
    controllerObj.upload = function(req, res) {

        const meta = this.specification.deserializeRequestData(
            req,
            this.resourceType,
            this.getGroupContext()
        );

        const file = {
            mimeType: req.headers['x-upload-content-type'],
            extension: mime.extension(req.headers['x-upload-content-type']),
            size: parseInt(req.headers['x-upload-content-length']),
        };

        if (file.size > bytes.parse(annotation.maxSize)) {
            return res.status(413).send('PayloadTooLargeError: request entity too large');
        }

        const service = container.get(annotation.service);

        service.onCreateUpload(req, res, meta, file).then((uploadId) => {

            res.set('Location', container.get('router').generateUrl(
                req,
                name,
                { upload_id: uploadId},
                true)
            );

            res.send();

        });

    }.bind(controllerObj);


    controllerObj.uploadChunk = function(req, res) {

        let isChunk = false;
        let isLast = false;
        let total = 0;
        let rangeStart = 0;
        let rangeEnd = 0;

        if (typeof req.headers['content-range'] !== 'undefined') {
            isChunk = true;

            let parts = req.headers['content-range'].trim().replace('bytes ', '').split('/');
            total = parseInt(parts[1]);
            parts = parts[0].split('-');
            rangeStart = parseInt(parts[0]);
            rangeEnd = parseInt(parts[1]);

            if (rangeEnd === total) {
                isLast = true;
            }

        } else {
            isLast = true;
        }

        const service = container.get(annotation.service);

        service.onUploadChunk(req, res, req.query.upload_id, req.body).then(() => {

            if (isLast) {

                service.onFinshUpload(req, res, req.query.upload_id).then((metaData) => {

                    const session = this.container.get('bass').createSession();
                    const manager = this.getManagerForCurrentResource(session);

                    this.createSingle(req, res, metaData, session, manager).then((resource) => {

                        manager.persist(resource);
                        manager.flush().then(() => {

                            return this.sendSuccessResponse(
                                req,
                                res,
                                resource,
                                null,
                                201
                            );

                        });

                    });

                });

            } else {

                res.set('Location', container.get('router').generateUrl(
                    req,
                    name,
                    { upload_id: req.query.upload_id},
                    true)
                );

                res.send();
            }

        });

    }.bind(controllerObj);

    // post
    routes.push({
        name: name,
        controller: controller.serviceId,
        controllerInfo: controller,
        action: 'upload',
        method: 'POST',
        path: uri,
        resource: controllerAnnotation.resource,
        bodyParser: 'json'
    });

    // put
    routes.push({
        name: name + '.put',
        controller: controller.serviceId,
        controllerInfo: controller,
        action: 'uploadChunk',
        method: 'PUT',
        path: uri,
        resource: controllerAnnotation.resource,
        bodyParser: (req, res, next) => {
            bodyParser.raw({
                type: annotation.allowedMimeTypes,
                limit: annotation.maxSize,
            })(req, res, next);
        }
    });

}
