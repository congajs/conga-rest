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
 */
module.exports = class ArticleController extends Controller {

    /**
     * @Rest:Doc:Description('List all of the articles')
     * @Rest:Doc:Example('GET /api/articles')
     *
     * @Rest:Doc:QueryParams([
     *     ['filter', 'the query filters'],
     *     ['fields', 'sparse fields to include in response']
     * ])
     */
    list(req, res) {
        return super.list(req, res);
    }

    /**
     * @Route("/custom-action", methods=["GET"])
     */
    customAction(req, res) {

    }

    /**
     * Modify the bass query for the list action
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Query}    query
     * @return {Promise}
     */
    modifyListQuery(req, res, query) {

        // hardcoding so that only articles with accountId = 1 are allowed to be retrieved
        query.where('accountId').equals(1);
        return Promise.resolve();
    }

    /**
     * Modify the bass conditions for the find/update/etc. actions
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   conditions
     * @return {Promise}
     */
    modifyFindConditions(req, res, conditions) {

        // hardcoding so that only articles with accountId = 1 are allowed to be retrieved
        conditions.accountId = 1;
        return Promise.resolve();
    }

    /**
     * Override this method to modify a new resource before it is persisted
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @return {Promise}
     */
    onCreate(req, res, resource) {

        // hardcoding so that new resources are in a specific account
        resource.accountId = 1;
        return Promise.resolve();
    }

    getContext() {
        return 'ADMIN';
    }

}
