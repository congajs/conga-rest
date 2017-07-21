module.exports = class GenericSorting {

    constructor(source, serializer) {
        this.source = source;
        this.serializer = serializer;
    }

    parse(req, type, defaultSort) {

        // get sort param from query (?sort=id,-name,created-at)
        let sortParam = req.query.sort;

        if (typeof sortParam === 'undefined') {
            return defaultSort;
        }

        const splits = sortParam.split(',');
        const sort = {};

        splits.forEach((split) => {

            let attribute;

            if (split[0] === '-') {

                attribute = this.serializer.convertAttributeToProperty(type, split.replace(/-/, ''));

                if (attribute === null) {
                    throw new Error("Invalid attribute: " + split.replace(/-/, ''));
                }

                sort[attribute] = -1;

            } else {

                attribute = this.serializer.convertAttributeToProperty(type, split);

                if (attribute === null) {
                    throw new Error("Invalid attribute: " + splits[i]);
                }

                sort[attribute] = 1;
            }

        });

        return sort;
    }
}
