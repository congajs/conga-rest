const fs = require('fs');
const path = require('path');

const Controller = require('../../../../../../../../lib/index').BassRestController;

/**
 * @Route("/api/pictures")
 *
 * @Rest:Controller(
 *     resource="picture"
 * )
 *
 * @-Rest:Upload(
 *     uploadType="multipart",
 *     allowedMimeTypes=["image/jpeg", "image/png", "image/jpg"],
 *     maxSize="1024kb",
 *     uriPrefix="/upload"
 * )
 */
module.exports = class PictureController extends Controller {

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

            const url = req.protocol + '://' + req.get('host') + '/uploads/' + file.filename;
            const publicPath = path.join(this.container.getParameter('kernel.app_public_path'), 'uploads', file.filename);

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
