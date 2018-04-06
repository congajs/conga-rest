const util = require('util');

/**
 * The JsonApiMarshaller serializes and unserializes requests according
 * to the JsonAPI 1.0 spec: http://jsonapi.org/format/1.0/
 *
 */
module.exports = class JsonApiMarshaller {

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

        obj.jsonapi = {
            version: "1.0"
        };

        if ('pagination' in normalized) {
            obj.meta = normalized.pagination.meta;
            obj.links = normalized.pagination.links;
        }

        if (!normalized.isRelationship || normalized.data === null) {
            obj.data = normalized.data;
        } else {
            obj.links = normalized.data.links;
            obj.data = normalized.data.data;
        }

        let included = null;

        if (typeof data.includes !== 'undefined' && data.includes !== null) {
            included = this.marshalIncluded(normalized.included);
        } else {
            data.includes = null;
        }

        if (util.isArray(normalized.data)) {

            normalized.data.forEach((item) => {
                this.marshalSingle(item, data.includes, included, normalized.isRelationship);
            });

        } else {

            try {

            this.marshalSingle(normalized.data, data.includes, included, normalized.isRelationship)

        } catch (e) {
            console.log(e);
        }

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
    marshalSingle(normalized, includes, included, isRelationship = false) {

        if (normalized === null) {
            return;
        }

        if (!isRelationship) {
            // make sure id is a string
            normalized.id = normalized.id + '';
        }

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

        try {

            const data = req.body.data;

            if (req.conga.route.name.includes('.relationship')) {
                return this.unmarshalRelationshipUpdate(req, type, group, data);
            }

            if (util.isArray(data)) {
                return this.unmarshalMultiple(req, type, group, data);
            } else {
                return this.unmarshalSingle(req, type, group, data);
            }

        } catch (e) {

            console.log(e);

            return null;

        }

    }

    /**
     * Unmarshal a single resource
     *
     * @param  {Object} data
     * @return {Object}
     */
    unmarshalSingle(req, type, group, data) {

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
        const mapping = this.mapper.getMappingForType(type);

        const object = {
            id: null,
            attributes: {},
            relationships: {
                one: {},
                many: {}
            }
        };

        let attribute;
        let map;

        if (typeof data.id !== 'undefined' && data.id !== null) {
            object.id = data.id;
        }

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

        if ('relationships' in data) {

            // relationships
            mapping.relationships.forEach((relationship) => {

                if ((relationship.attribute in data.relationships)) {

                    if (relationship.type === 'many') {

                        object.relationships.many[relationship.target] = {
                            mapping: relationship,
                            data: data.relationships[relationship.attribute].data
                        }

                    }

                    if (relationship.type === 'one') {

                        object.relationships.one[relationship.target] = {
                            mapping: relationship,
                            data: data.relationships[relationship.attribute].data
                        }

                    }

                }

            });

        }

        return object;
    }

    unmarshalMultiple(req, type, group, data) {

        const result = [];

        data.forEach((resource) => {
            result.push(this.unmarshalSingle(req, type, group, resource));
        });

        return result;
    }

    unmarshalRelationshipUpdate(req, type, group, data) {

        const mapping = this.mapper.getMappingForType(type);
        const attribute = req.params.attribute;

        const object = {
            relationships: {}
        };

        mapping.relationships.forEach((relationship) => {

            if (relationship.attribute === attribute) {

                object.relationships[relationship.type] = {};
                object.relationships[relationship.type][relationship.target] = {
                    mapping: relationship,
                    data: data
                };
            }
        });

        return object;
    }

}
