
const Serializer = require('../Serializer');

/**
 * This is the Serializer for the JsonApi specification
 *
 * http://http://jsonapi.org/
 *
 * @author Marc Roulias <marc@lampjunkie.com>
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
			version: "1.0"//this.jsonApiVersion
		};

		obj.data = this.serializeData(data.data, data.sparseFields);

		if (typeof data.includes !== 'undefined' && data.includes !== null) {
			obj.included = this.serializeIncluded(data.data, data.includes, data.sparseFields);
		}

		return obj;
    }

    /**
     * Recursively serialize the given data
     *
     * @param  {Object} object       the input data
     * @param  {Object} sparseFields the sparse field information
     * @return {Object}
     */
    serializeData(object, sparseFields) {

		let data = null;

		if (this.isArray(object)) {

			data = [];

			for (let i = 0, j = object.length; i < j; i++) {
				data.push(this.serializeData(object[i], sparseFields));
			}

		} else {
			data = this.serializeObject(object, sparseFields);
		}

		return data;
	}

	serializeObject(object, sparseFields) {

		if (!object) {
			return object;
		}

		let i;
		let obj = {};
		let mapping = null;

		mapping = this.getMappingFromObject(object);

		if (typeof mapping === 'undefined' || mapping === null) {

			if (object instanceof Object &&
				!(object instanceof String) &&
				!(object instanceof Number) &&
				!(object instanceof Date) &&
				!(object instanceof Boolean)) {

				// if we don't find a matching class, go through each field of the object and try to map recursively
				var isClass = object.constructor.name !== 'Object';
				for (var idx in object) {
					if (typeof object[idx] !== 'function' &&
						(!isClass || object.hasOwnProperty(idx))) {

						obj[idx] = this.serializeData(object[idx], sparseFields);
					}
				}

				// return the newly hydrated object
				return obj;
			}

			// just return the object we were given
			return object;

		} else {

			obj.type = mapping.type;
			obj.id = object[mapping.id.target];

			obj.attributes = {};

			var typeSparseFields = null;

			if (typeof sparseFields !== 'undefined' && sparseFields !== null && typeof sparseFields[mapping.type] !== 'undefined') {
				typeSparseFields = sparseFields[mapping.type];
			}

			// map each attribute
			for (let i = 0, j = mapping.properties.length; i < j; i++) {

				var property = mapping.properties[i];

				if (typeSparseFields == null || (typeSparseFields !== null && typeSparseFields.indexOf(property.attribute)) > -1) {
					if (!property.isSetter && property.expose){
						if (property.targetType === 'method'){
							obj.attributes[property.attribute] = this.serializeData(object[property.target]() );
						} else {
							obj.attributes[property.attribute] = this.serializeData(object[property.target]);
						}
					}
				}
			}

			// map relationships
			if (mapping.relationships.length > 0){

				obj.relationships = {};

				for (let i = 0, j = mapping.relationships.length; i < j; i++) {

					var relationship = mapping.relationships[i];

					if (relationship.type == 'one'){
						obj.relationships[relationship.attribute] = {
							links: {
								//self: this.router.generateUrl(mapping.type + '.relationships.self', {id: object.id, attribute: relationship.attribute}, true),
								//related: this.router.generateUrl(mapping.type + '.relationships.related', {id: object.id, attribute: relationship.attribute}, true)
							}
						};

						if (object[relationship.target] !== null && typeof object[relationship.target] !== 'undefined') {
							obj.relationships[relationship.attribute].data = {
								type: relationship.relatedType,
								id: object[relationship.target].id
							}
						} else {
							obj.relationships[relationship.attribute].data = null;
						}
					}

					if (relationship.type == 'many'){
						obj.relationships[relationship.attribute] = {
							links: {
								//self: this.router.generateUrl(mapping.type + '.relationships.self', {id: object.id, attribute: relationship.attribute}, true),
								//related: this.router.generateUrl(mapping.type + '.relationships.related', {id: object.id, attribute: relationship.attribute}, true)
							},
							data: []
						}

						if (typeof object[relationship.attribute] !== 'undefined') {
							object[relationship.attribute].forEach(function(rel){
								obj.relationships[relationship.attribute].data.push({
									type: relationship.relatedType,
									id: rel.id
								});
							}, this);
						}
					}
				}
			}

			// add links to the object
			obj.links = {

				'self': '' //this.router.generateUrl(mapping.type + '.find.one', {id: object.id}, true),
			}

		}

		return obj;

	}



}
