const Controller = require('../../../../../../../../lib/index').BassRestController;

/**
 * @Route("/api/comments")
 * @Rest:Controller(
 *     model="Comment",
 *     isPaginationEnabled=true,
 *     defaultLimit=1000,
 *     isIncludeRelatedSupported=true
 * )
 */
module.exports = class CommentController extends Controller {

}
