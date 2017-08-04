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

        console.log(sparseFields);

        if (sparseFields === null) {
            return null;
        }

        for (let i in sparseFields) {

            sparseFields[i] = sparseFields[i].split(',');

            sparseFields[i].forEach((pointer) => {
                if (!this.mapper.isValidPointer(i, pointer)) {
                    throw new Error(i + ':' + pointer);
                }
            });
        }

        return sparseFields;

    }
}
