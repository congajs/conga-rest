const fs = require('fs');
const path = require('path');

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
 *     maxSize="1024kb",
 *     uriPrefix="/upload",
 *     service="demo.simple.upload.service"
 * )
 */
module.exports = class AvatarController extends Controller {


}
