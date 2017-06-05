const Controller = require('../../../../../../../../lib/index').BassRestController;

/**
 * @Route("/api/articles")
 * @Rest:Controller(
 *     model="Article",
 *     isPaginationEnabled=true,
 *     defaultLimit=1000,
 *     isIncludeRelatedSupported=true
 * )
 */
module.exports = class ArticleController extends Controller {

}
