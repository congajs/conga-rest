const fs = require('fs');
const path = require('path');

/**
 * This service handles "simple" file uploads
 */
module.exports = class SimpleUploadService {

    constructor(container) {
        this.container = container;
    }

    /**
     * Get the temp directory to use
     *
     * @return {String}
     */
    getTempDirectory() {
        return '/tmp';
    }

    /**
     * Handle a file once it has been uploaded and before resource is saved
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Object} resource
     * @param  {Object} file
     * @return {Promise}
     */
    onUploadComplete(req, res, resource, file) {

        return new Promise((resolve, reject) => {

            const filename = file.filename + '.' + file.extension;

            const url = req.protocol + '://' + req.get('host') + '/uploads/' + filename;
            const publicPath = path.join(
                this.container.getParameter('kernel.app_public_path'),
                'uploads',
                filename
            );

            fs.rename(file.tmp, publicPath, (err) => {

                resource.url = url;
                resource.data = {
                    mimeType: file.mimeType,
                    size: file.size,
                    path: publicPath
                };

                resolve(resource);
            });

        });

    }
}
