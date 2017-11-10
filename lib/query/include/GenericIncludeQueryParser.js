const RestError = require('../../rest/RestError');
const QueryError = require('../QueryError');
const QueryParser = require('../QueryParser');

/**
 * The GenericIncludesQueryParser handles parsing a query which contains the paths of
 * resources to include in the response.
 *
 * This parser will return an array of related resource paths
 *
 * Example querystring:
 *
 *     ?include=comments,author
 *
 * Example body query:
 *
 *     {
 *         query: {
 *             include: [
 *                  "comments",
 *                  "author"
 *             ]
 *         }
 *     }
 */
module.exports = class GenericIncludes extends QueryParser {

    /**
     * Get the name of the query parameter
     *
     * @return {String}
     */
    getName() {
        return 'include';
    }

    /**
     * Get an example of using a querystring
     *
     * @return {String}
     */
    getQuerystringExample() {
        return `?include=comments,author`;
    }

    /**
     * Get an example of using a body query
     *
     * @return {Object}
     */
    getBodyQueryExample() {
        return {
            query: {
                include: [
                    "comments",
                    "author"
                ]
            }
        };
    }

    /**
     * Parse the query
     *
     * @param  {HttpRequest} req  the request object
     * @param  {String}      type the resource type
     * @return {Array}
     */
    parse(req, type) {

        let includes = this.getValueFromRequest(req);

        if (typeof includes === 'undefined' || includes === null) {
            return [];
        }

        if (this.source === 'query') {
            includes = includes.split(',');
        }

        const errors = [];

        includes.forEach((include) => {

            if (!this.mapper.isValidPointer(type, include)) {
                errors.push({
                    type: RestError.QUERY_INCLUDE_INVALID_PATH,
                    source: { parameter: this.getName() },
                    value: include,
                    resource: type
                });
            }

        });

        if (errors.length > 0) {
            throw new QueryError(errors);
        }

        return includes;

    }
}
