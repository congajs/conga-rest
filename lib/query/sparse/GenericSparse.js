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
module.exports = class GenericSparse {

    constructor(source) {
        this.source = source;
    }

    parse(req) {

        let sparseFields = req.query.fields;

        if (typeof sparseFields !== 'undefined') {
            for (let i in sparseFields) {
                sparseFields[i] = sparseFields[i].split(',');
            }
        } else {
            sparseFields = null;
        }

        return sparseFields;

    }
}
