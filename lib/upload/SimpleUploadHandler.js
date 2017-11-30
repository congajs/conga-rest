const path = require('path');

const bodyParser = require('body-parser');
const mime = require('mime-types');

/**
 * Generate a unique id
 *
 * @return {String}
 */
const generateId = () => {

    let text = '';
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 16; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

module.exports = function SimpleUploadHandler(
    container,
    name,
    uri,
    controller,
    controllerAnnotation,
    annotation,
    controllerObj,
    routes) {

    const service = container.get(annotation.service);

    if (typeof service.onUploadComplete === 'undefined') {
        container.get('logger').error('Your upload service "' + annotation.service + '" is missing the onUploadComplete method.');
        process.exit();
    }

    const parser = function(req, res, next) {
        bodyParser.raw({
            type: annotation.allowedMimeTypes,
            limit: annotation.maxSize,
        })(req, res, next);
    }

    /**
     * The upload controller action
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {void}
     */
     controllerObj.upload = function(req, res) {

        // get the bass manager
        const session = this.container.get('bass').createSession();
        const manager = this.getManagerForCurrentResource(session);

        const filename = generateId();
        let tmpDirectory = '/tmp';

        if (typeof service.getTempDirectory !== 'undefined') {
            tmpDirectory = service.getTempDirectory();
        }

        const destination = path.join(tmpDirectory, filename);
        const writeable = require('fs').createWriteStream(destination);

        writeable.on('finish', () => {

            const data = {
                relationships: {
                    one: {},
                    many: {}
                }
            };

            const file = {
                mimeType: req.headers['content-type'],
                tmp: destination,
                filename: filename,
                extension: mime.extension(req.headers['content-type']),
                size: req.headers['content-length'],
                stream: req.body
            };

            this.createSingle(req, res, data, session, manager).then((resource) => {

                service.onUploadComplete(req, res, resource, file).then(() => {

                    manager.flush().then(() => {

                        return this.sendSuccessResponse(
                            req,
                            res,
                            resource,
                            null,
                            201
                        );

                    }).catch((error) => {
                        return this.sendInternalServerError(res, error);
                    });

                });

            });

        });

        writeable.end(req.body);

    }.bind(controllerObj);

    routes.push({
        name: name,
        controller: controller.serviceId,
        controllerInfo: controller,
        action: 'upload',
        method: 'POST',
        path: uri,
        resource: controllerAnnotation.resource,
        bodyParser: parser
    });

}
