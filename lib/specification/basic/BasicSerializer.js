
const Serializer = require('../Serializer');

/**
 * This is the Serializer for a generic specification
 */
module.exports = class BasicSerializer extends Serializer {

    /**
     * Deserialize a request body in to a given object
     *
     * @param  {Request} data   the request
     * @param  {Object}  object the newly created object to deserialize in to
     * @return {Object}         the final object
     */
    deserializeRequestInToObject(req, object) {

        const mapping = this.getMappingFromObject(object);
        const data = req.body;

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
		// 	if (typeof data.data.attributes[property.attribute] !== 'undefined') {
		// 		object[property.target] = data.data.attributes[property.attribute];
		// 	}
		// });
        //
		// // relationships
		// mapping.relationships.forEach(function(relationship) {
        //
		// 	if (relationship.type == 'one'){
        //
		// 		// check if relationship exists in request
		// 		if (typeof data.data.relationships !== 'undefined' && typeof data.data.relationships[relationship.attribute] !== 'undefined') {
        //
		// 			// make sure mapped type exists
		// 			if (typeof allMapping[relationship.relatedType] === 'undefined') {
		// 				throw new Error("REST resource type '" + relationship.relatedType + "' doesn't exist (mapped in: " + type + ":" + relationship.target + ")");
		// 			}
        //
		// 			var rel = new allMapping[relationship.relatedType].proto;
		// 			rel.id = data.data.relationships[relationship.attribute].data.id;
		// 			object[relationship.target] = rel;
		// 		}
		// 	}
        //
		// 	if (relationship.type == 'many') {
        //
		// 	}
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
