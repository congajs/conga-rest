const RestError = require('../../rest/RestError');
const QueryError = require('../QueryError');
const QueryParser = require('../QueryParser');

/**
 * The GenericSortQueryParser handles parsing sorting information.
 *
 * Example querystring:
 *
 *     ?sort=id,-name,created_at
 *
 * Example body query:
 *
 *     {
 *         query: {
 *             sort: ['id', '-name', 'created_at']
 *         }
 *     }
 */
module.exports = class GenericSorting extends QueryParser {

    /**
     * Get the name of the query parameter
     *
     * @return {String}
     */
    getName() {
        return 'sort';
    }

    /**
     * Get an example of using a querystring
     *
     * @return {String}
     */
    getQuerystringExample() {
        return `?sort=id,-name,created_at`;
    }

    /**
     * Get an example of using a body query
     *
     * @return {Object}
     */
    getBodyQueryExample() {
        return {
            query: {
                sort: ['id', '-name', 'created_at']
            }
        };
    }

    parse(req, type, defaultSort) {

        // get sort param from query (?sort=id,-name,created-at)
        let sortParam = this.getValueFromRequest(req);

        if (typeof sortParam === 'undefined' || sortParam === null) {
            return defaultSort;
        }

        let splits;

        if (this.source === 'query') {
            splits = sortParam.split(',');
        } else {
            splits = sortParam;
        }

        const errors = [];
        const sort = {};

        splits.forEach((split) => {

            let attribute = this.mapper.convertAttributeToProperty(type, split.replace(/-/, ''));

            if (!this.mapper.isValidPointer(type, split.replace(/-/, ''))) {

                errors.push({
                    type: RestError.QUERY_SORT_INVALID_PATH,
                    source: { parameter: this.getName() },
                    value: split,
                    resource: type
                });

            } else {

                if (split[0] === '-') {
                    sort[attribute] = -1;
                } else {
                    sort[attribute] = 1;
                }

            }

        });

        if (errors.length > 0) {
            throw new QueryError(errors);
        }

        return sort;
    }
}
