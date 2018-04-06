const util = require('util');

/**
 * The BasicMarshaller serializes and unserializes requests/responses
 * using a basic generic format
 */
module.exports = class BasicMarshaller {

    /**
     * Construct the marshaller
     *
     * @param  {RestMapper}
     */
    constructor(mapper) {
        this.mapper = mapper;
    }

    /**
     * Marshal the normalized data in to the final response format
     *
     * @param  {Request} req        the request
     * @param  {Object}  normalized the normalized data
     * @param  {Object}  data       the data from a controller (includes pagination, sparse, etc.)
     * @return {Object}             the serialized response
     */
    marshal(req, normalized, data) {

        const obj = {};

        if ('pagination' in normalized) {
            obj.meta = normalized.pagination.meta;
            obj.links = normalized.pagination.links;
        }

        obj.data = normalized.data;

        let included = null;

        if (typeof data.includes !== 'undefined' && data.includes !== null) {
            included = this.marshalIncluded(normalized.included);
        } else {
            data.includes = null;
        }

        if (util.isArray(normalized.data)) {

            normalized.data.forEach((item) => {
                this.marshalSingle(item, data.includes, included);
            });

        } else {

            this.marshalSingle(normalized.data, data.includes, included)
        }

        if (included !== null) {
            obj.included = included;
        }

        return obj;
    }

    /**
     * Marshal a single resource
     *
     * @param  {Object} normalized  the normalized data
     * @param  {Array}  includes    the array of related resource fields to include
     * @param  {Array}  included    the array of included resources
     * @return {Object}
     */
    marshalSingle(normalized, includes, included) {

        Object.assign(normalized, normalized.attributes);
        delete normalized.attributes;
        delete normalized.type;

        // one
        if (normalized.relationships && Object.keys(normalized.relationships['one']).length > 0) {

            let attribute;

            for (attribute in normalized.relationships['one']) {

                let data = null;

                if (normalized.relationships['one'][attribute].data !== null) {
                    data = {
                        type: normalized.relationships['one'][attribute].data.type,
                        id: normalized.relationships['one'][attribute].data.id + ''
                    }
                }

                normalized.relationships[attribute] = {

                    links: normalized.relationships['one'][attribute].links,
                    data: data

                };

            }

        }

        // many
        if (normalized.relationships && Object.keys(normalized.relationships['many']).length > 0) {

            let attribute;

            for (attribute in normalized.relationships['many']) {

                normalized.relationships[attribute] = {
                    links: normalized.relationships['many'][attribute].links,
                    data: []
                };

                normalized.relationships['many'][attribute].data.forEach((obj) => {

                    normalized.relationships[attribute].data.push({
                        type: obj.type,
                        id: obj.id + ''
                    });

                });
            }
        }

        // remove relationship keys
        if (normalized.relationships) {
            delete normalized.relationships['one'];
            delete normalized.relationships['many'];
        }

        return normalized;
    }

    /**
     * Serialize the final included relationships array
     *
     * @param  {Object} included
     * @return {Array}
     */
    marshalIncluded(included) {

        const result = [];

        let i, j;

        for (i in included) {

            for (j in included[i]) {

                result.push(Object.assign({}, this.marshalSingle(included[i][j])));
            }
        }

        return result;
    }

    /**
     * Deserialize a request body in to a normalized object
     *
     * @param  {Request} data   the request
     * @param  {String}  type   the resource type
     * @return {Object}         the final object
     */
    unmarshal(req, type, group) {

        const mapping = this.mapper.getMappingForType(type);
        const data = req.body.data;

        const object = {
            id: null,
            attributes: {},
            relationships: {
                one: {},
                many: {}
            }
        };

        // {
        //     id: '123',
        //     attributes: {
        //         title: 'title',
        //         body: 'body'
        //     },
        //     relationships: {
        //         one: {
        //             author: { type: 'user', id: '999' },
        //         },
        //
        //         many: {
        //             comments: [
        //                 { type: 'comment', id: '222' },
        //                 { type: 'comment', id: '333' }
        //             ]
        //         }
        //     }
        // }

        let attribute;
        let map;

        const isFnGroup = (typeof group === 'function');
        const attrGroup = !isFnGroup ? group :
            group(req, Object.assign({id: data.id}, data.attributes));

        for (attribute in data.attributes) {

            map = mapping.attributesToProperties[attribute];

            if (typeof map === 'undefined' ||
                map.update === false ||
                (typeof map.group !== 'undefined' && !map.group.write.includes(attrGroup))
            ) {

            } else {

                object.attributes[map.target] = this.mapper.convertAttributeValueToPropertyValue(
                    type,
                    map.attribute,
                    data.attributes[map.attribute]
                );
            }

        }

        return object;

    }

}
