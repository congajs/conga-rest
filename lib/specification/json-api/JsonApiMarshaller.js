const util = require('util');

module.exports = class JsonApiMarshaller {

    constructor(mapper) {
        this.mapper = mapper;
    }

    marshal(req, normalized, data) {

        const obj = {};

        obj.jsonapi = {
            version: "1.0"
        };

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

    marshalSingle(normalized, includes, included) {

        // make sure id is a string
        normalized.id = normalized.id + '';

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
     * Serialize the included data
     *
     * @param  {Object} data          the input data
     * @param  {Array}  includes      the array of types to include
     * @return {Object}
     */
    serializeIncluded(data, includes) {

        const included = [];
        const cache = [];

        /**
         * Recursively walk through the object tree to find included elements
         * and serialize them
         *
         * @param  {Object} obj  the current node in the tree
         * @param  {Array}  path the remaining attribute path to walk
         * @return {void}
         */
        const walk = (obj, path) => {

            const prop = path.shift();

            obj = obj[prop];

            if (util.isArray(obj)) {

                for (let i = 0, j = obj.length; i < j; i++) {

                    const tmp = obj[i];
                    const key = tmp.type + ':' + tmp.id;

                    if (cache.indexOf(key) === -1){
                        included.push(tmp);
                        cache.push(key);
                    }

                    if (path.length > 0){
                        walk(tmp, path.slice(0));
                    }
                };

            } else {

                if (obj !== null && typeof obj !== 'undefined') {

                    const key = obj.type + ':' + obj.id;

                    if (cache.indexOf(key) === -1){
                        included.push(obj);
                        cache.push(key);
                    }

                    if (path.length > 0){
                        walk(obj, path);
                    }
                }
            }
        };

        // loop through all data and recursively serialize includes
        if (util.isArray(data)) {
            for (let i = 0, j = data.length; i < j; i++) {
                for (let k = 0, l = includes.length; k < l; k++) {
                    walk(data[i], includes[k].slice(0)); // <-- cloning array here
                }
            }
        } else {
            for (let k = 0, l = includes.length; k < l; k++) {
                walk(data, includes[k].slice(0)); // <-- cloning array here
            }
        }

        return included;
    }

    /**
     * Deserialize a request body in to a given object
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

        for (attribute in data.attributes) {

            map = mapping.attributesToProperties[attribute];

            if (typeof map === 'undefined' ||
                map.update === false ||
                (typeof map.group !== 'undefined' && !map.group.write.includes(group))
            ) {

            } else {
                object.attributes[map.target] = data.attributes[map.attribute];
            }
        }

        // mapping.properties.forEach((property) => {
        //     if (typeof data.attributes[property.attribute] !== 'undefined') {
        //         object[property.target] = data.attributes[property.attribute];
        //     }
        // });

        return object;
            // var allMapping = this.mapping;
            // var mapping = this.mapping[type];
            //
            // mapping.properties.forEach(function(property){
            //
            //     if (typeof data.data.attributes[property.attribute] !== 'undefined') {
            //         object[property.target] = data.data.attributes[property.attribute];
            //     }
            // });
            //
            // // relationships
            // mapping.relationships.forEach(function(relationship) {
            //
            //     if (relationship.type == 'one'){
            //
            //         // check if relationship exists in request
            //         if (typeof data.data.relationships !== 'undefined' && typeof data.data.relationships[relationship.attribute] !== 'undefined') {
            //
            //             // make sure mapped type exists
            //             if (typeof allMapping[relationship.relatedType] === 'undefined') {
            //                 throw new Error("REST resource type '" + relationship.relatedType + "' doesn't exist (mapped in: " + type + ":" + relationship.target + ")");
            //             }
            //
            //             var rel = new allMapping[relationship.relatedType].proto;
            //             rel.id = data.data.relationships[relationship.attribute].data.id;
            //             object[relationship.target] = rel;
            //         }
            //     }
            //
            //     if (relationship.type == 'many') {
            //
            //     }
            //
            // });
            //
            //
            //
            //
            //
            //
            // return object;

    }
}
