/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var crypto = require('crypto');
var path = require('path');
var util = require('util');

// third-party modules
var _ = require('lodash');
var annotations = require('conga-annotations');

// local modules
var ModifyCriteriaAnnotation = require('../annotation/controller/rest-modify-criteria');
var AttributeAnnotation = require('../annotation/resource/rest-attribute');
var IdAnnotation = require('../annotation/resource/rest-id');
var RelationshipAnnotation = require('../annotation/resource/rest-relationship');
var ResourceAnnotation = require('../annotation/resource/rest-resource');

/**
 * The RestManager keeps track of Restful objects
 * and handles thier serialization
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
function RestManager() {
	this.objects = {};
	this.nameToObjectMap = {};
	this.resourceNameToObjectMap = {};
	this.serializer = null;
}

RestManager.prototype = {

	/**
	 * Parse out all of the REST annotations from objects
	 * and store the information for lookup later on
	 * 
	 * @param container
	 */
	onKernelCompile: function(event, next) {

		wrench = event.container.get('wrench');

		var container = event.container;
		this.container = container;
		var config = container.get('config').get('rest');

		if (typeof config === 'undefined') {
			next();
			return;
		}

		var registry = new annotations.Registry();

		// register all the resource annotations
		registry.registerAnnotation(path.join(__dirname, '..', 'annotation', 'resource', 'rest-attribute'));
		registry.registerAnnotation(path.join(__dirname, '..', 'annotation', 'resource', 'rest-id'));
		registry.registerAnnotation(path.join(__dirname, '..', 'annotation', 'resource', 'rest-relationship'));
		registry.registerAnnotation(path.join(__dirname, '..', 'annotation', 'resource', 'rest-resource'));

		var paths = this.getObjectPathsFromConfig(container, config);

		// create the annotation reader
		var reader = new annotations.Reader(registry);

		paths.forEach(function(p){
			this.parseAnnotations(container, reader, p);
		}, this);

		// set up the serializer
		var serializer = require(container.get('namespace.resolver').resolveWithSubpath(config['serializer'], 'lib') + '.js');
		this.serializer = new serializer;
		this.serializer.setup(container.get('router'), config, this.resourceNameToObjectMap, this.objects);

		// set up the pagination builder
		var paginationBuilder = require(container.get('namespace.resolver').resolveWithSubpath(config['pagination'], 'lib') + '.js');
		this.paginationBuilder = new paginationBuilder;

		// move on
		next();
	},

	/**
	 * Parse the REST annotations from the given file path
	 * 
	 * @param  {Container} container
	 * @param  {Reader} reader
	 * @param  {String} filePath
	 * @return {void}
	 */
	parseAnnotations: function(container, reader, filePath) {

		var self = this;
		var config = this.container.get('config').get('rest');
		var inflection = config['attribute.inflection'];

		// parse the annotations
		reader.parse(filePath);

		// get the annotations
		var definitionAnnotations = reader.definitionAnnotations;
		var propertyAnnotations = reader.propertyAnnotations;
		var methodAnnotations = reader.methodAnnotations;

		if (definitionAnnotations.length === 0){
			return;
		}

		// find the constructor name
		var constructorName = definitionAnnotations[0].target;
		var resourceName = definitionAnnotations[0].type;
		var properties = [];
		var relationships = [];
		var serializeMethod = null;
		var deserializeMethod = null;
		var id = null;

		propertyAnnotations.forEach(function(annotation) {

			// @Rest:ID
			if (annotation instanceof IdAnnotation) {
				id = {
					targetType: 'property',
					target: annotation.target,
					attribute: annotation.property
				}
			}

			// @Rest:Attribute
			if (annotation instanceof AttributeAnnotation) {
				properties.push({
					targetType: 'property',
					target: annotation.target,
					update: annotation.update,
					expose: annotation.expose,
					type: annotation.type,
					attribute: annotation.property ? annotation.property : self.inflectAttribute(annotation.target, inflection)
				});				
			}

			// @Rest:Relationship
			if (annotation instanceof RelationshipAnnotation) {
				relationships.push({
					targetType: 'property',
					target: annotation.target,
					type: annotation.type,
					relatedType: annotation.relatedType,
					attribute: annotation.property ? annotation.property : self.inflectAttribute(annotation.target, inflection)
				});
			}
		});

		methodAnnotations.forEach(function(annotation) {
			
			// @Rest:Attribute
			if (annotation instanceof AttributeAnnotation) {
					properties.push({
						targetType: 'method',
						target: annotation.target,
						update: annotation.update,
						type: annotation.type,
						attribute: annotation.property ? annotation.property : self.inflectAttribute(annotation.target, inflection),
						isSetter: annotation.setter
					});
			}

			// // @Rest:SerializeMethod
			// if (annotation instanceof SerializeMethodAnnotation) {
			// 	serializeMethod = annotation.target;
			// }

			// // @Rest:DeserializeMethod'
			// if (annotation instanceof DserializeMethodAnnotation) {
			// 	deserializeMethod = annotation.target;
			// }
		});

		// build map of attributes to properties
		var attributesToProperties = {};

		properties.forEach(function(property) {
			attributesToProperties[property.attribute] = property;
		});

		var proto = require(filePath);

		// create a unique id for this prototype
		var protoId = crypto.createHash('md5').update(filePath).digest("hex");
		proto.prototype._CONGA_REST_ID = protoId;

		proto.prototype.__CONGA_REST__ = {
			PROTOTYPE_ID: protoId,
			RESOURCE_NAME: resourceName
		};



		var obj = {
			id: id,
			type: resourceName,
			properties: properties,
			relationships: relationships,
			proto: proto,
			serializeMethod: serializeMethod,
			deserializeMethod: deserializeMethod,
			attributesToProperties: attributesToProperties
		};

		this.objects[protoId] = obj;
		this.nameToObjectMap[constructorName] = obj;
		this.resourceNameToObjectMap[resourceName] = obj;
	},

	getTypeForModelName: function(model) {
		return this.nameToObjectMap[model].type;
	},

	/**
	 * Get all the full object paths from the rest configuration namespaces
	 * 
	 * @param  {Container} container
	 * @param  {Object} config
	 * @return {Array}
	 */
	getObjectPathsFromConfig: function(container, config) {

		var paths = [];

		if (typeof config.model.paths !== 'undefined') {
			config.model.paths.forEach(function(namespace) {

				var dir = container.get('namespace.resolver').resolveWithSubpath(namespace, 'lib');
				var files = wrench.readdirSyncRecursive(dir);

				files.forEach(function(p) {
					if (p.substr(-3) === '.js') {
						paths.push(path.join(dir, p));
					}
				});
			});
		}

		return paths;
	},

	/**
	 * Deserialize a data object to a model
	 * 
	 * @param  {Object} object The object
	 * @param  {Object} data The data you are unserializing INTO your object
	 * @return {Object} The newly hydrated object (same instance)
	 */
	deserialize: function(type, data) {

		if (data === null) {
			return null;
		}

		return this.serializer.deserialize(type, data);
	},

	/**
	 * Deserialize a data object in to a give model object
	 * 
	 * @param  {String} type
	 * @param  {Object} object
	 * @param  {Object} data
	 * @return {Object}
	 */
	deserializeInToObject: function(type, object, data) {

		if (data === null) {
			return object;
		}

		return this.serializer.deserializeInToObject(type, object, data);
	},

	/**
	 * Deserialize an object
	 *
	 * @param  {Object} object The object
	 * @param  {Object} data The data you are hydrating your object with (the request body)
	 * @return {Object} The newly hydrated object (same instance)
	 */
	deserializeObject: function(object, data)
	{
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
	},

	/**
	 * Serialize an object or array to it's restful representation
	 * 
	 * @param  {Object} object
	 * @return {Object}
	 */
	serialize: function(object) {

		try {
			return this.serializer.serialize(object);
		} catch (err) {
			this.container.get('logger').error(err.stack);
		}

		return null;
	},

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

	serializeErrors: function(errors) {
		return errors;
	},

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
	serializeSingleResponse: function(type, data, includes, sparseFields, req) {
		try {
			return this.serializer.serializeSingleResponse(type, data, includes, sparseFields, req);
		} catch (err) {
			this.container.get('logger').error(err.stack);
		}

		return null;
	},

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
	serializeListResponse: function(type, data, pagination, includes, sparseFields, req) {
		try {
			return this.serializer.serializeListResponse(type, data, pagination, includes, sparseFields, req);
		} catch (err) {
			this.container.get('logger').error(err.stack);
		}

		return null;
	},

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
	getRelationshipMappingByTypeAndAttribute: function(type, attribute) {

		var mapping = this.resourceNameToObjectMap[type];

		for (var i = 0; i < mapping.relationships.length; i++) {
			if (mapping.relationships[i].attribute == attribute) {
				return mapping.relationships[i];
			}
		}

		return null;
	},

	/**
	 * Get the mapping information for an object
	 * 
	 * @param  {Object} object
	 * @return {Object}
	 */
	getMappingForObject: function(obj) {

		var protoId = Object.getPrototypeOf(obj)._CONGA_REST_ID

		if (typeof this.objects[protoId] === 'undefined') {
			return null;
		}

		return this.objects[protoId];
	},

	/**
	 * Get the mapping for a resource type
	 * 
	 * @param  {String} type
	 * @return {Object}
	 */
	getMappingForType: function(type) {
		return this.resourceNameToObjectMap[type];
	},

	/**
	 * Convert an attribute to a model property
	 * 
	 * @param  {String} type
	 * @param  {String} attribute
	 * @return {Mixed}
	 */
	convertAttributeToProperty: function(type, attribute) {
		return this.serializer.convertAttributeToProperty(type, attribute);
	},

	/**
	 * Inflect a property name
	 * 
	 * @param  {String} name
	 * @param  {String} type
	 * @return {String}
	 */
	inflectAttribute: function(name, type) {
		var inflector = this.container.get('inflector');

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
	},

	createNotFoundResponse: function(res) {
		res.return({
			status: "404"
		}, 404);
	},

	createInternalServerErrorResponse: function(res) {
		res.return({
			status: "500"
		}, 500);
	},

	createBadRequestResponse: function(res, errors) {
		res.return({
			status: "400"
		}, 400);
	},

	createConflictResponse: function(res, errors) {
		res.return({
			status: "409",
			errors: errors
		}, 409);
	},

	createCreatedResponse: function(res, resource) {
		res.return(this.serializeSingleResponse(
			Object.getPrototypeOf(resource).__CONGA_REST__.RESOURCE_NAME, 
			resource
		), 201);
	}, 

	createUnprocessableEntityResponse: function(res, errors) {
		res.return({
			status: "422",
			errors: errors
		}, 422);
	}
};

RestManager.prototype.constructor = RestManager;

module.exports = RestManager;