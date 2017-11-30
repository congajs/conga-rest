const fs = require('fs');
const path = require('path');

module.exports = class ResumableUploadService {

    constructor(container) {
        this.container = container;
    }

    /**
     * Handle the initial resumable upload POST request
     *
     * @param  {Object} req      the request
     * @param  {Object} res      the response
     * @param  {Object} meta     the upload meta data
     * @param  {Object} file     the file info
     * @return {Promise}
     */
    onCreateUpload(req, res, meta, file) {

        return new Promise((resolve, reject) => {

            const session = this.container.get('bass').createSession();
            const manager = session.getManagerForModelName('Upload');

            const upload = manager.createDocument('Upload');
            upload.meta = meta;
            upload.size = file.size;
            upload.mimeType = file.mimeType;
            upload.extension = file.extension;

            manager.persist(upload);
            manager.flush().then(() => {
                resolve(upload.id);
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
    onUploadChunk(req, res, uploadId, buffer) {

        return new Promise((resolve, reject) => {

            const session = this.container.get('bass').createSession();
            const manager = session.getManagerForModelName('Upload');

            manager.getRepository('Upload').find(uploadId).then((upload) => {

                if (upload.data === null) {
                    upload.data = [];
                }

                upload.data = upload.data.concat(Array.prototype.slice.call(buffer, 0));
                upload.currentSize = upload.data.length;

                manager.persist(upload);
                manager.flush().then(() => {
                    resolve(upload.id);
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
    onFinshUpload(req, res, uploadId) {

        return new Promise((resolve, reject) => {

            const session = this.container.get('bass').createSession();
            const manager = session.getManagerForModelName('Upload');

            manager.getRepository('Upload').find(uploadId).then((upload) => {

                const filename = uploadId + '.' + upload.extension;

                const publicPath = path.join(
                    this.container.getParameter('kernel.app_public_path'),
                    'uploads',
                    filename
                );

                upload.meta.attributes.url = req.protocol + '://' + req.get('host') + '/uploads/' + filename;

                fs.writeFile(publicPath, new Buffer(upload.data, 'binary'), 'binary', () => {

                    manager.remove(upload);
                    manager.flush().then(() => {
                        resolve(upload.meta);
                    });

                });

            });
        });

    }
}
