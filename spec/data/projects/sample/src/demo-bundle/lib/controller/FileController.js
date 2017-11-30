const fs = require('fs');
const path = require('path');

const Controller = require('../../../../../../../../lib/index').BassRestController;

/**
 * @Route("/api/files")
 *
 * @Rest:Controller(
 *     resource="file"
 * )
 *
 * @Rest:Upload(
 *     uploadType="resumable",
 *     allowedMimeTypes=["image/jpeg", "image/png", "image/jpg"],
 *     maxSize="1024kb",
 *     uriPrefix="/upload",
 *     service="demo.resumable.upload.service"
 * )
 */
module.exports = class FileController extends Controller {

    /**
     * Handle the initial resumable upload POST request
     *
     * @param  {Object} req      the request
     * @param  {Object} res      the response
     * @param  {Object} meta     the upload meta data
     * @param  {Number} size     the file size in bytes
     * @param  {String} mimeType the file mime type
     * @return {Promise}
     */
    onCreateResumableUpload(req, res, meta, size, mimeType) {

        return new Promise((resolve, reject) => {

            const session = this.container.get('bass').createSession();
            const manager = this.getManagerForCurrentResource(session);

            const upload = manager.createDocument('Upload');
            upload.meta = meta;
            upload.size = size;
            upload.mimeType = mimeType;

            manager.persist(upload);
            manager.flush().then(() => {
                resolve(upload);
            });

        });
    }

    /**
     * Store a chunk of data for a resumable upload
     *
     * @param  {Object} req      the request
     * @param  {Object} res      the response
     * @param  {String} uploadId the upload id
     * @param  {Buffer} buffer   the buffer of data
     * @return {Promise}
     */
    onResumableUploadChunk(req, res, uploadId, buffer) {

        return new Promise((resolve, reject) => {

            const session = this.container.get('bass').createSession();
            const manager = this.getManagerForCurrentResource(session);

            manager.getRepository('Upload').find(uploadId).then((upload) => {

                if (upload.data === null) {
                    upload.data = [];
                }

                upload.data = upload.data.concat(Array.prototype.slice.call(buffer, 0));
                upload.currentSize = upload.data.length;

                manager.persist(upload);
                manager.flush().then(() => {
                    resolve(upload);
                });

            });
        });

    }

    /**
     * Finish handling a resumable upload and create the final resource
     * once all chunks have been received
     *
     * @param  {Object} req      the request
     * @param  {Object} res      the response
     * @param  {String} uploadId the upload id
     * @return {Promise}
     */
    onFinshResumableUpload(req, res, uploadId) {

        return new Promise((resolve, reject) => {

            manager.getRepository('Upload').find(uploadId).then((upload) => {

                this.createSingle(req, res, upload.meta, session, manager).then((resource) => {

                    manager.persist(resource);
                    manager.flush().then(() => {

                        const publicPath = path.join(this.container.getParameter('kernel.app_public_path'), 'uploads', uploadId + '.jpg');

                        fs.writeFile(publicPath, new Buffer(upload.data, 'binary'), 'binary', () => {
                            resolve(resource);
                        });

                    });
                });
            });
        });

    }
}
