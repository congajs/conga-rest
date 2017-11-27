const Controller = require('../../../../../../../../lib/index').BassRestController;

/**
 * @Route("/api/avatars")
 *
 * @Rest:Controller(
 *     resource="avatar"
 * )
 *
 * @Rest:Upload(
 *     uploadType="simple",
 *     allowedMimeTypes=["image/jpeg", "image/png"],
 *     maxSize=1024,
 *     chunked=false,
 *     storageEngine="filesystem",
 *     storageOptions={directory: "/tmp"},
 *     uriPrefix="/upload"
 * )
 */
module.exports = class AvatarController extends Controller {


    // upload(req, res) {
    //
    //     //console.log(req.body);
    //     console.log(req.headers);
    //
    //     const path = require('path');
    //
    //     var writeable = require('fs').createWriteStream(
    //         path.join(this.container.getParameter('kernel.var_path'), 'uploaded.jpg')
    //     );
    //
    //     writeable.on('finish', function(){
    //         res.return('ok');
    //     });
    //
    //     writeable.end(req.body);
    //
    // }

    onUploadStart(req, res, resource, file) {

    }

    onUploadProgress(req, res, resource, file) {

    }

    onUploadComplete(req, res, resource, file) {

    }
}
