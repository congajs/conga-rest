
const Serializer = require('../Serializer');

/**
 * This is the Serializer for the JsonApi specification
 *
 * http://http://jsonapi.org/
 */
module.exports = class JsonApiSerializer extends Serializer {


    /**
     * Deserialize a request body in to a given object
     *
     * @param  {Request} data   the request
     * @param  {Object}  object the newly created object to deserialize in to
     * @return {Object}         the final object
     */
    deserializeRequestInToObject(req, object) {

        const mapping = this.getMappingFromObject(object);
        const data = req.body.data;

        mapping.properties.forEach((property) => {
            if (typeof data.attributes[property.attribute] !== 'undefined') {
                object[property.target] = data.attributes[property.attribute];
            }
        });

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

    /**
     * Serialize a single response type (get one, create one, etc.)
     *
     * @param  {Request} req   the original request
     * @param  {Object}  data  the response data
     * @return {Object}
     */
    serializeSingleResponse(req, data) {

        const obj = {};

        obj.jsonapi = {
            version: "1.0"
        };

        obj.data = this.serializeData(req, data.data, data.sparseFields);

        if (typeof data.includes !== 'undefined' && data.includes !== null) {
            obj.included = this.serializeIncluded(req, data.data, data.includes, data.sparseFields);
        }

        return obj;
    }


    /**
     * Serialize the included data
     *
     * @param  {Object} data          the input data
     * @param  {Array}  includes      the array of types to include
     * @param  {Object} sparseFields  the object of sparse fields to use
     * @return {Object}
     */
    serializeIncluded(req, data, includes, sparseFields) {

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

            const currentProp = path.shift();
            const prop = this.convertAttributeToPropertyForObject(obj, currentProp);

            obj = obj[prop];

            if (this.isArray(obj)) {

                for (let i = 0, j = obj.length; i < j; i++) {

                    const tmp = obj[i];
                    const key = this.getMappingFromObject(tmp).type + ':' + tmp.id;

                    if (cache.indexOf(key) === -1){
                        included.push(this.serializeObject(req, tmp, sparseFields));
                        cache.push(key);
                    }

                    if (path.length > 0){
                        walk(tmp, path.slice(0));
                    }
                };

            } else {

                if (obj !== null && typeof obj !== 'undefined') {

                    const key = this.getMappingFromObject(obj).type + ':' + obj.id;

                    if (cache.indexOf(key) === -1){
                        included.push(this.serializeObject(req, obj, sparseFields));
                        cache.push(key);
                    }

                    if (path.length > 0){
                        walk(obj, path);
                    }
                }
            }
        };

        // loop through all data and recursively serialize includes
        if (this.isArray(data)) {
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

}
