const Controller = require('../../../../../../../../lib/index').BassRestController;

/**
 * @Rest:Doc:Description('This is the endpoint to work with articles')
 *
 * @Route("/api/articles")
 *
 * @Rest:Controller(
 *     resource="article",
 *     isPaginationEnabled=true,
 *     defaultLimit=1000,
 *     defaultSort={referenceId: 1},
 *     isIncludeRelatedSupported=true
 * )
 *
 * @Rest:Upload(
 *     allowedTypes=['image/jpg'],
 *     maxSize=1024,
 *     type="chunked",
 *     processor="my.avatar.processor",
 *     method="resumable"
 * )
 */
module.exports = class ArticleController extends Controller {

}
