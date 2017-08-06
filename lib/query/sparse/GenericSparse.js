const RestError = require('../../rest/RestError');
const QueryError = require('../QueryError');
const QueryParser = require('../QueryParser');

/**
 * The GenericSparseQueryParser handles parsing sparse field information
 *
 * This parser will return an OffsetPager instance
 *
 * Example querystring:
 *
 *     ?fields[article]=title,body&fields[user]=email,created_at
 *
 * Example body query:
 *
 *     {
 *         query: {
 *             fields: {
 *                 article: ["title", "body"]
 *                 user: ["email", "created_at"]
 *             }
 *         }
 *     }
 */
module.exports = class GenericSparse extends QueryParser {

    /**
     * Get the name of the query parameter
     *
     * @return {String}
     */
    getName() {
        return 'fields';
    }

    parse(req, type) {

        let sparseFields = this.getValueFromRequest(req);

        if (sparseFields === null) {
            return null;
        }

        const errors = [];

        for (let i in sparseFields) {

            if (!this.mapper.isValidType(i)) {

                errors.push({
                    type: RestError.QUERY_SPARSE_INVALID_RESOURCE,
                    source: { parameter: this.getName() },
                    value: sparseFields[i],
                    resource: i
                });

            } else {

                if (sparseFields[i] === '') {

                    errors.push({
                        type: RestError.QUERY_SPARSE_MISSING_PATH,
                        source: { parameter: this.getName() },
                        value: null,
                        resource: i
                    });          

                } else {

                    sparseFields[i] = sparseFields[i].split(',');

                    sparseFields[i].forEach((pointer) => {

                        if (!this.mapper.isValidPointer(i, pointer)) {
                            errors.push({
                                type: RestError.QUERY_SPARSE_INVALID_PATH,
                                source: { parameter: this.getName() },
                                value: pointer,
                                resource: i
                            });
                        }
                    });

                }

            }
        }

        if (errors.length > 0) {
            throw new QueryError(errors);
        }

        return sparseFields;

    }
}
