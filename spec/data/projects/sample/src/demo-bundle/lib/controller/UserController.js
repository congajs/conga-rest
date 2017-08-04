const Controller = require('../../../../../../../../lib/index').BassRestController;

/**
 * @Route("/api/users")
 * @Rest:Controller(
 *     resource="user",
 *     isPaginationEnabled=true,
 *     defaultLimit=1000,
 *     isIncludeRelatedSupported=true
 * )
 */
module.exports = class UserController extends Controller {

}
