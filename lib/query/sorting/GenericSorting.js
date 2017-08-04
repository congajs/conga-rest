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
module.exports = class GenericSorting {

    constructor(source, mapper) {
        this.source = source;
        this.mapper = mapper;
    }

    parse(req, type, defaultSort) {

        // get sort param from query (?sort=id,-name,created-at)
        let sortParam = req.query.sort;

        if (typeof sortParam === 'undefined') {
            return defaultSort;
        }

        let splits;

        if (this.source === 'query') {
            splits = sortParam.split(',');
        } else {
            splits = sortParam;
        }
        
        const sort = {};

        splits.forEach((split) => {

            let attribute;

            if (split[0] === '-') {

                attribute = this.mapper.convertAttributeToProperty(type, split.replace(/-/, ''));

                if (attribute === null) {
                    throw new Error("Invalid attribute: " + split.replace(/-/, ''));
                }

                sort[attribute] = -1;

            } else {

                attribute = this.mapper.convertAttributeToProperty(type, split);

                if (attribute === null) {
                    throw new Error("Invalid attribute: " + splits[i]);
                }

                sort[attribute] = 1;
            }

        });

        return sort;
    }
}
