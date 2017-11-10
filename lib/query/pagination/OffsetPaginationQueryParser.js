const Pager = require('./OffsetPager');
const RestError = require('../../rest/RestError');
const QueryError = require('../QueryError');
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
     * Get an example of using a querystring
     *
     * @return {String}
     */
    getQuerystringExample() {
        return `?page[offset]=200&page[limit]=100`;
    }

    /**
     * Get an example of using a body query
     *
     * @return {Object}
     */
    getBodyQueryExample() {
        return {
            query: {
                page: {
                    offset: 200,
                    limit: 100
                }
            }
        };
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

        const errors = [];

        if (typeof page !== 'undefined' && page !== null) {

            if (typeof page.offset !== 'undefined') {
                exists = true;
                offset = parseInt(page.offset);

                if (isNaN(offset)) {
                    errors.push({
                        type: RestError.QUERY_PAGINATION_INVALID_OFFSET,
                        source: { parameter: this.getName() },
                        value: page.offset
                    });
                }
            }

            if (typeof page.limit !== 'undefined') {
                limit = parseInt(page.limit);

                if (isNaN(limit)) {
                    errors.push({
                        type: RestError.QUERY_PAGINATION_INVALID_LIMIT,
                        source: { parameter: this.getName() },
                        value: page.limit
                    });
                }

            }
        }

        if (errors.length > 0) {
            throw new QueryError(errors);
        }

        return new Pager(exists, limit, offset);

    }
}
