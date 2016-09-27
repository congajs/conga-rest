const BaseSerializer = require('./base-serializer');

const util = require('util');

module.exports = class JsonApiSerializer extends BaseSerializer {
	
	constructor() {
		super();
		this.jsonApiVersion = "1.0";
	}

	/**
	 * Serialize a single resource response
	 * 
	 * @param  {String} type
	 * @param  {Object} data
	 * @param  {Object} includes
	 * @param  {Object} sparseFields
	 * @param  {Object} req
	 * @return {Object}
	 */
	serializeSingleResponse(type, data, includes, sparseFields, req) {

		var obj = {};

		obj.jsonapi = {
			version: this.jsonApiVersion
		};

		obj.data = this.serializeData(data, sparseFields);

		if (includes !== null) {
			obj.included = this.serializeIncluded(data, includes, sparseFields);
		}

		return obj;
	}

	/**
	 * Serialize the list response
	 * 
	 * @param  {String} type
	 * @param  {Array}  data
	 * @param  {Object} pagination
	 * @param  {Object} includes
	 * @param  {Object} sparseFields
	 * @param  {Object} req
	 * @return {Object}
	 */
	serializeListResponse(type, data, pagination, includes, sparseFields, req) {

		var obj = {};

		obj.jsonapi = {
			version: this.jsonApiVersion
		};

		obj.links = {
			self: pagination.currentPage,
			first: pagination.firstPage,
			last: pagination.lastPage,
			prev: pagination.previousPage,
			next: pagination.nextPage
		};

		obj.data = this.serializeData(data, sparseFields);

		if (includes !== null) {
			obj.included = this.serializeIncluded(data, includes, sparseFields);
		}

		return obj;
	}

	/**
	 * Serialize the included data
	 * 
	 * @param  {Object} data
	 * @param  {Object} includes
	 * @param  {Object} sparseFields
	 * @return {Object}
	 */
	serializeIncluded(data, includes, sparseFields) {

		var included = [];
		var cache = [];
		var that = this;

		var walk = function(obj, path){

			var prop = path.shift();

			prop = that.convertAttributeToPropertyForObject(obj, prop);

			obj = obj[prop];

			if (util.isArray(obj)) {

				for (var i=0, j=obj.length; i<j; i++) {
					var tmp = obj[i];
					var key = that.getMappingForObject(tmp).type + ':' + tmp.id;

					if (cache.indexOf(key) === -1){
						included.push(that.serializeObject(tmp, sparseFields));
						cache.push(key);
					}

					if (path.length > 0){
						walk(tmp, path);
					}
				};

			} else {

				if (obj !== null) {

					var key = that.getMappingForObject(obj).type + ':' + obj.id;

					if (cache.indexOf(key) === -1){
						included.push(that.serializeObject(obj, sparseFields));
						cache.push(key);							
					}

					if (path.length > 0){
						walk(obj, path);
					}
				}
			}
		};

		// loop through all data and recursively serialize includes
		for (var i = 0, j = data.length; i < j; i++) {
			for (var k = 0, l = includes.length; k < l; k++) {
				walk(data[i], includes[k].slice(0)); // <-- cloning array here
			}
		}

		return included;
	}

	serialize(object) {

		if (object === null) {
			return null;
		}

		var obj = {};

		obj.jsonapi = {
			version: this.jsonApiVersion
		};

		obj.links = {
			self: this.config['linking.root.url'] + "/users"
		};

		obj.data = this.serializeData(object);

		return obj;
	}

	serializeData(object, sparseFields) {
		var data = null;

		if (util.isArray(object)) {

			data = [];

			for (var i=0, j=object.length; i<j; i++){
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

		var i ,
			obj = {} ,
			mapping = null ;

		mapping = this.getMappingForObject(object);

		if (mapping === null) {

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
			for (var i=0, j=mapping.properties.length; i<j; i++) {

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

				for (var i=0, j=mapping.relationships.length; i<j; i++) {

					var relationship = mapping.relationships[i];

					if (relationship.type == 'one'){
						obj.relationships[relationship.attribute] = {
							links: {
								self: this.router.generateUrl(mapping.type + '.relationships.self', {id: object.id, attribute: relationship.attribute}, true),
								related: this.router.generateUrl(mapping.type + '.relationships.related', {id: object.id, attribute: relationship.attribute}, true)
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
								self: this.router.generateUrl(mapping.type + '.relationships.self', {id: object.id, attribute: relationship.attribute}, true),
								related: this.router.generateUrl(mapping.type + '.relationships.related', {id: object.id, attribute: relationship.attribute}, true)
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

				'self': this.router.generateUrl(mapping.type + '.find.one', {id: object.id}, true),
			}

		}

		return obj;

	}

	deserialize(type, data) {

		var allMapping = this.mapping;
		var mapping = this.mapping[type];
		var obj = new mapping.proto;

		mapping.properties.forEach(function(property) {
			if (typeof data.data.attributes[property.attribute] !== 'undefined') {
				obj[property.target] = data.data.attributes[property.attribute];
			}
		});

		// relationships
		mapping.relationships.forEach(function(relationship) {

			if (relationship.type == 'one'){

				// check if relationship exists in request
				if (typeof data.data.relationships !== 'undefined' && typeof data.data.relationships[relationship.attribute] !== 'undefined') {
					
					// make sure mapped type exists
					if (typeof allMapping[relationship.relatedType] === 'undefined') {
						throw new Error("REST resource type '" + relationship.relatedType + "' doesn't exist (mapped in: " + type + ":" + relationship.target + ")");
					}

					var rel = new allMapping[relationship.relatedType].proto;
					rel.id = data.data.relationships[relationship.attribute].data.id;
					obj[relationship.target] = rel;
				}
			}

			if (relationship.type == 'many') {

			}

		});

		return obj;
	}

	deserializeInToObject(type, object, data) {

		var allMapping = this.mapping;
		var mapping = this.mapping[type];

		mapping.properties.forEach(function(property){

			if (typeof data.data.attributes[property.attribute] !== 'undefined') {
				object[property.target] = data.data.attributes[property.attribute];
			}
		});

		// relationships
		mapping.relationships.forEach(function(relationship) {

			if (relationship.type == 'one'){

				// check if relationship exists in request
				if (typeof data.data.relationships !== 'undefined' && typeof data.data.relationships[relationship.attribute] !== 'undefined') {
					
					// make sure mapped type exists
					if (typeof allMapping[relationship.relatedType] === 'undefined') {
						throw new Error("REST resource type '" + relationship.relatedType + "' doesn't exist (mapped in: " + type + ":" + relationship.target + ")");
					}

					var rel = new allMapping[relationship.relatedType].proto;
					rel.id = data.data.relationships[relationship.attribute].data.id;
					object[relationship.target] = rel;
				}
			}

			if (relationship.type == 'many') {

			}

		});






		return object;
	}


}