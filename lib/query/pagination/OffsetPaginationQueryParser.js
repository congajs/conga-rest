const Pager = require('./OffsetPager');
const QueryParser = require('../QueryParser');

/**
 * The OffsetPaginationQueryParser handles parsing offset based pagination.
 *
 * This parser will return an OffsetPager instance
 *
 * Example querystring:
 *
 *     ?page[offset]=200&page[limit]=100
 *
 * Example body query:
 *
 *     {
 *         query: {
 *             page: {
 *                 offset: 200,
 *                 limit: 100
 *             }
 *         }
 *     }
 */
module.exports = class OffsetPaginationQueryParser extends QueryParser {

    /**
     * Get the name of the query parameter
     *
     * @return {String}
     */
    getName() {
        return 'page';
    }

    /**
     * Parse the pagination info from the request and return a Pager instance
     *
     * @param  {Object} req          the request object
     * @param  {Number} defaultLimit the default limit to use when one wasn't passed in query
     * @return {Pager}
     */
    parse(req, defaultLimit) {

        let exists = false;
        let offset = 0;
        let limit = defaultLimit;
        let page = this.getValueFromRequest(req);

        if (typeof page !== 'undefined' && page !== null) {

            if (typeof page.offset !== 'undefined') {
                exists = true;
                offset = parseInt(page.offset);
            }

            if (typeof page.limit !== 'undefined') {
                limit = parseInt(page.limit);
            }
        }

        return new Pager(exists, limit, offset);

    }
}
