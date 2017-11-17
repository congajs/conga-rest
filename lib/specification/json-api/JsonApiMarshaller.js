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

        if (!normalized.isRelationship) {
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

            this.marshalSingle(normalized.data, data.includes, included, normalized.isRelationship)
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

        const mapping = this.mapper.getMappingForType(type);
        const data = req.body.data;

        if (req.conga.route.action === 'updateRelationship') {
            const attribute = req.params.attribute;

            //console.log(mapping.relationships);process.exit();
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

        for (attribute in data.attributes) {

            map = mapping.attributesToProperties[attribute];

            if (typeof map === 'undefined' ||
                map.update === false ||
                (typeof map.group !== 'undefined' && !map.group.write.includes(group))
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

    // get rid of this?
    // /**
    //  * Serialize the included data
    //  *
    //  * @param  {Object} data          the input data
    //  * @param  {Array}  includes      the array of types to include
    //  * @return {Object}
    //  */
    // serializeIncluded(data, includes) {
    //
    //     const included = [];
    //     const cache = [];
    //
    //     /**
    //      * Recursively walk through the object tree to find included elements
    //      * and serialize them
    //      *
    //      * @param  {Object} obj  the current node in the tree
    //      * @param  {Array}  path the remaining attribute path to walk
    //      * @return {void}
    //      */
    //     const walk = (obj, path) => {
    //
    //         const prop = path.shift();
    //
    //         obj = obj[prop];
    //
    //         if (util.isArray(obj)) {
    //
    //             for (let i = 0, j = obj.length; i < j; i++) {
    //
    //                 const tmp = obj[i];
    //                 const key = tmp.type + ':' + tmp.id;
    //
    //                 if (cache.indexOf(key) === -1){
    //                     included.push(tmp);
    //                     cache.push(key);
    //                 }
    //
    //                 if (path.length > 0){
    //                     walk(tmp, path.slice(0));
    //                 }
    //             };
    //
    //         } else {
    //
    //             if (obj !== null && typeof obj !== 'undefined') {
    //
    //                 const key = obj.type + ':' + obj.id;
    //
    //                 if (cache.indexOf(key) === -1){
    //                     included.push(obj);
    //                     cache.push(key);
    //                 }
    //
    //                 if (path.length > 0){
    //                     walk(obj, path);
    //                 }
    //             }
    //         }
    //     };
    //
    //     // loop through all data and recursively serialize includes
    //     if (util.isArray(data)) {
    //         for (let i = 0, j = data.length; i < j; i++) {
    //             for (let k = 0, l = includes.length; k < l; k++) {
    //                 walk(data[i], includes[k].slice(0)); // <-- cloning array here
    //             }
    //         }
    //     } else {
    //         for (let k = 0, l = includes.length; k < l; k++) {
    //             walk(data, includes[k].slice(0)); // <-- cloning array here
    //         }
    //     }
    //
    //     return included;
    // }


}
