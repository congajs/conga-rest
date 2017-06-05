/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const path = require('path');
const util = require('util');

// third-party modules
const _ = require('lodash');
const annotations = require('conga-annotations');

/**
 * The RestManager keeps track of Restful objects
 * and handles thier serialization
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestManager {

	/**
	 * Construct the RestManager
	 */
	constructor() {
		this.objects = {};
		this.nameToObjectMap = {};
		this.resourceNameToObjectMap = {};
		this.serializer = null;
	}

	/**
	 * Parse out all of the REST annotations from objects
	 * and store the information for lookup later on
	 *
	 * @param container
	 */
	onKernelCompile(event, next) {

		var container = event.container;
		this.container = container;
		var config = container.get('config').get('rest');

		if (typeof config === 'undefined') {
			next();
			return;
		}

		// make sure that the conga-validation validator exists
		if (!container.get('validator')) {
			throw new Error('conga-rest requires the conga-validation bundle to be configured in your project');
		}

		this.createSpecification(container, config);


		container.get('conga.rest.resource.annotation.parser').parse(config);

		// move on
		next();
	}

	/**
	 * Create the configured RestSpecification implementation and set on container
	 *
	 * @param  {Container} container
	 * @param  {Object}    config
	 * @return {void}
	 */
	createSpecification(container, config) {

		const Specification = require(
			container.get('namespace.resolver').resolveWithSubpath(config['specification'], 'lib') + '.js'
		);

		const spec = new Specification(config);
		spec.initialize();

		container.set('conga.rest.specification', spec);

		// need to set the specification on the response handler also
		container.get('conga.rest.response.handler').setSpecification(spec);
	}



	getTypeForModelName(model) {
		return this.nameToObjectMap[model].type;
	}





	/**
	 * Deserialize an object
	 *
	 * @param  {Object} object The object
	 * @param  {Object} data The data you are hydrating your object with (the request body)
	 * @return {Object} The newly hydrated object (same instance)
	 */
	deserializeObject(object, data) {

		// get the mapping information for the object
		var mapping = this.getMappingForObject(object);

		// if the object is not mapped with rest, just return it
		if (mapping === null) {
			return object;
		}

		if (mapping.deserializeMethod && typeof object[mapping.deserializeMethod] === 'function') {

			// use the serialization method
			object[mapping.deserializeMethod](data);

		} else {

			// map each property
			var self = this;
			mapping.properties.forEach(function(property, idx) {

				if (property.update && typeof data[property.property] !== 'undefined') {

					var value = undefined;

					switch (property.type) {

						case 'Date' : {
							value = new Date(Date.parse(data[property.property]));
							break;
						}

						case 'Object' : {

							var map;

							if (typeof mapping.proto.prototype[property.property] !== 'undefined' &&
								(map = mapping.proto.prototype[property.property]) &&
								map.constructor instanceof Function &&
								map.constructor.name !== 'Object' &&
								!(map.constructor instanceof String) &&
								!(map.constructor instanceof Number) &&
								!(map.constructor instanceof Boolean)) {

								if (data[property.property] && data[property.property] instanceof Object) {

									// send this object through rest serialization (RECURSION) on its prototype
									value = self.deserializeObject(_.cloneDeep(map.constructor.prototype), data[property.property]);

								} else {

									// if the provided data property is empty, use the mapping's prototype and populate the object
									value = _.cloneDeep(map.constructor.prototype);
								}
							} else {
								value = _.cloneDeep(data[property.property]);
							}
							break;
						}

						default : {
							value = _.cloneDeep(data[property.property]);
							break;
						}
					}

					if (value !== undefined) {
						if (property.isSetter) {

							object[property.target](value);

						} else {
							object[property.property] = value;
						}
					}
				}
			});
		}

		return object;
	}

	// /**
	//  * Serialize an object or array to it's restful representation
	//  *
	//  * @param  {Object} object
	//  * @return {Object}
	//  */
	// serialize(object) {
	//
	// 	try {
	// 		return this.serializer.serialize(object);
	// 	} catch (err) {
	// 		this.container.get('logger').error(err.stack);
	// 	}
	//
	// 	return null;
	// }

	/**
	 * Recursively serialize an object to it's Restful representation
	 *
	 * @param  {Object} object
	 * @return {Object}
	 */
	// serializeObject: function(object){

	// 	if (!object) {
	// 		return object;
	// 	}

	// 	var i ,
	// 		obj = {} ,
	// 		mapping = null ,
	// 		len = this.objects.length;

	// 	for (i = 0; i < len; i++) {

	// 		if (object instanceof this.objects[i].proto &&
	// 			this.objects[i].proto.prototype.constructor.name !== 'Object' &&
	// 			this.objects[i].proto.prototype.constructor.name !== 'Function' &&
	// 			this.objects[i].proto.prototype.constructor.name === object.constructor.name) {

	// 			mapping = this.objects[i];
	// 			break;
	// 		}
	// 	}

	// 	if (mapping){

	// 		obj.data
	// 	}
	// },

	// serializeErrors(errors) {
	// 	return errors;
	// }

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
		try {
			return this.serializer.serializeSingleResponse(type, data, includes, sparseFields, req);
		} catch (err) {
			this.container.get('logger').error(err.stack);
		}

		return null;
	}

	/**
	 * Serialize a full list response
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
		try {
			return this.serializer.serializeListResponse(type, data, pagination, includes, sparseFields, req);
		} catch (err) {
			this.container.get('logger').error(err.stack);
		}

		return null;
	}

	/**
	 * Find the property information for an object
	 *
	 * @param  {Object} object
	 * @return {Array}
	 */
	// getPropertiesForObject: function(object){

	// 	var obj = this.getDataForObject(object);

	// 	if (obj) {
	// 		return obj.properties;
	// 	}

	// 	return null;
	// },

	/**
	 * Get the relationship mapping info for a type and attribute
	 *
	 * @param  {String} type
	 * @param  {String} attribute
	 * @return {Object}
	 */
	getRelationshipMappingByTypeAndAttribute(type, attribute) {

		var mapping = this.resourceNameToObjectMap[type];

		for (var i = 0; i < mapping.relationships.length; i++) {
			if (mapping.relationships[i].attribute == attribute) {
				return mapping.relationships[i];
			}
		}

		return null;
	}

	/**
	 * Get the mapping information for an object
	 *
	 * @param  {Object} object
	 * @return {Object}
	 */
	getMappingForObject(obj) {

		var protoId = Object.getPrototypeOf(obj)._CONGA_REST_ID

		if (typeof this.objects[protoId] === 'undefined') {
			return null;
		}

		return this.objects[protoId];
	}

	/**
	 * Get the mapping for a resource type
	 *
	 * @param  {String} type
	 * @return {Object}
	 */
	getMappingForType(type) {
		return this.resourceNameToObjectMap[type];
	}

	/**
	 * Convert an attribute to a model property
	 *
	 * @param  {String} type
	 * @param  {String} attribute
	 * @return {Mixed}
	 */
	convertAttributeToProperty(type, attribute) {
		return this.serializer.convertAttributeToProperty(type, attribute);
	}

	/**
	 * Inflect a property name
	 *
	 * @param  {String} name
	 * @param  {String} type
	 * @return {String}
	 */
	inflectAttribute(name, type) {

		console.log(name + ' - ' + type);

		const inflector = this.container.get('inflector');

		switch (type){

			case 'camel':
				return inflector.camel(name);
				break;

			case 'snake':
				return inflector.snake(name);
				break;

			case 'hyphen':
				return inflector.paramCase(name);
				break;
			default:
				return name;
		}
	}


}
