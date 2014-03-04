/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var path = require('path');
var util = require('util');

// third-party modules
var _;

var annotations = require('conga-annotations');
var wrench;

/**
 * The RestManager keeps track of Restful objects
 * and handles thier serialization
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var RestManager = function(){
	this.objects = [];
	this.nameToObjectMap = {};
};

RestManager.prototype = {

	/**
	 * Parse out all of the REST annotations from objects
	 * and store the information for lookup later on
	 * 
	 * @param container
	 */
	onKernelCompile: function(event, next){

		_ = event.container.get('lodash');
		wrench = event.container.get('wrench');

		var container = event.container;
		var config = container.get('config').get('rest');

		if (typeof config === 'undefined'){
			next();
			return;
		}

		var registry = new annotations.Registry();

		registry.registerAnnotation(path.join(__dirname, '..', 'annotation', 'object', 'rest-object'));
		registry.registerAnnotation(path.join(__dirname, '..', 'annotation', 'object', 'rest-property'));
		registry.registerAnnotation(path.join(__dirname, '..', 'annotation', 'object', 'rest-deserialize-method'));
		registry.registerAnnotation(path.join(__dirname, '..', 'annotation', 'object', 'rest-serialize-method'));

		var paths = this.getObjectPathsFromConfig(container, config);

		// create the annotation reader
		var reader = new annotations.Reader(registry);

		paths.forEach(function(p){
			this.parseAnnotations(container, reader, p);
		}, this);		

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
	parseAnnotations: function(container, reader, filePath){

		// parse the annotations
		reader.parse(filePath);

		// get the annotations
		var constructorAnnotations = reader.getConstructorAnnotations();
		var propertyAnnotations = reader.getPropertyAnnotations();
		var methodAnnotations = reader.getMethodAnnotations();

		if (constructorAnnotations.length === 0){
			return;
		}

		// find the constructor name
		var constructorName = constructorAnnotations[0].target;
		var properties = [];
		var serializeMethod = null;
		var deserializeMethod = null;

		propertyAnnotations.forEach(function(annotation){

			// @Rest:Property
			if (annotation.annotation === 'Rest:Property'){
				properties.push({
					targetType: 'property',
					target: annotation.target,
					update: annotation.update,
					type: annotation.type,
					property: annotation.property ? annotation.property : annotation.target
				});				
			}
		});

		methodAnnotations.forEach(function(annotation){

			// @Rest:Property
			if (annotation.annotation === 'Rest:Property'){
				properties.push({
					targetType: 'method',
					target: annotation.target,
					update: annotation.update,
					type: annotation.type,
					property: annotation.property ? annotation.property : annotation.target,
					isSetter: annotation.setter
				});				
			}

			// @Rest:SerializeMethod
			if (annotation.annotation === 'Rest:SerializeMethod'){
				serializationMethod = annotation.target;
			}

			// @Rest:DeserializeMethod
			if (annotation.annotation === 'Rest:DeserializeMethod'){
				deserializationMethod = annotation.target;
			}

		});

		var obj = {
			properties: properties,
			proto: require(filePath),
			serializeMethod: serializeMethod,
			deserializeMethod: deserializeMethod
		};

		this.objects.push(obj);
		this.nameToObjectMap[constructorName] = obj;
	},

	/**
	 * Get all the full object paths from the rest configuration namespaces
	 * 
	 * @param  {Container} container
	 * @param  {Object} config
	 * @return {Array}
	 */
	getObjectPathsFromConfig: function(container, config){

		var paths = [];

		if (typeof config.model.paths !== 'undefined'){
			config.model.paths.forEach(function(namespace){

				var dir = container.get('namespace.resolver').resolveWithSubpath(namespace, 'lib');
				var files = wrench.readdirSyncRecursive(dir);

				files.forEach(function(p){
					if (p.substr(-3) === '.js'){
						paths.push(path.join(dir, p));
					}
				});
			});
		}

		return paths;
	},

	/**
	 * Deserialize request data to a given object
	 * 
	 * @param  {Object} object
	 * @param  {Object} request
	 * @return {Object}
	 */
	deserialize: function(object, request){

		if (object === null){
			return null;
		}

		if (util.isArray(object)){

			var arr = [];

			object.forEach(function(obj){
				arr.push(this.deserializeObject(obj, request));
			}, this);

			return arr;
		}

		return this.serializeObject(object);
	},

	deserializeObject: function(object, request)
	{
		// get the mapping information for the object
		var mapping = this.getMappingForObject(object);

		if (mapping === null){
			return object;
		}

		var obj = new mapping.proto();

		if (mapping.deserializeMethod){

			// use the serialization method
			obj[mapping.deserializeMethod](object);

		} else {

			// map each property
			mapping.properties.forEach(function(property){

				if (!property.isSetter){
					if (property.targetType === 'method'){
						obj[property.property] = object[property.target]();
					} else {
						obj[property.property] = object[property.target];
					}				
				}
			});
		}

		return obj;
	},

	/**
	 * Serialize an object or array to it's restful representation
	 * 
	 * @param  {Object} object
	 * @return {Object}
	 */
	serialize: function(object){

		if (object === null){
			return null;
		}

		if (util.isArray(object)){

			var arr = [];

			object.forEach(function(obj){
				arr.push(this.serialize(obj));
			}, this);

			return arr;
		}

		return this.serializeObject(object);
	},

	/**
	 * Recursively serialize an object to it's Restful representation
	 * 
	 * @param  {Object} object
	 * @return {Object}
	 */
	serializeObject: function(object){

		var obj = {};
		var mapping = null;

		this.objects.forEach(function(data){

			if (object instanceof data.proto ||
				(data.proto.prototype.constructor.name !== 'Object' &&
				 data.proto.prototype.constructor.name === object.constructor.name)) {

				mapping = data;
				return false;
			}

			return true;
		});

		if (mapping === null){

			if (object instanceof Object &&
				!(object instanceof String) &&
				!(object instanceof Number) &&
				!(object instanceof Boolean)) {

				// if we don't find a matching class, go through each field of the object and try to map recursively
				for (var idx in object) {
					obj[idx] = this.serializeObject(object[idx]);
				}

				// return the newly hydrated object
				return obj;
			}

			// just return the object we were given
			return object;
		}

		if (mapping.serializeMethod){

			// use the serialization method
			// NOTE: passing through this.serialize() again just incase another object that should be serialized is returned
			obj = this.serialize(object[mapping.serializeMethod]());

		} else {

			// map each property
			mapping.properties.forEach(function(property){

				if (!property.isSetter){
					if (property.targetType === 'method'){
						obj[property.property] = this.serialize(object[property.target]());
					} else {
						obj[property.property] = this.serialize(object[property.target]);
					}				
				}
			}, this);
		}

		return obj;
	},

	/**
	 * Find the property information for an object
	 * 
	 * @param  {Object} object
	 * @return {Array}
	 */
	getPropertiesForObject: function(object){

		var properties = null;

		this.objects.forEach(function(data){

			if (object instanceof data.proto ||
				(data.proto.prototype.constructor.name !== 'Object' &&
				 data.proto.prototype.constructor.name === object.constructor.name)) {

				properties = data.properties;

				return false;
			}

			return true;
		});

		return properties;
	},

	/**
	 * Find the data for an object
	 * 
	 * @param  {Object} object
	 * @return {Object}
	 */
	getDataForObject: function(object){

		var objectData = null;

		this.objects.forEach(function(data){

			if (object instanceof data.proto ||
				(data.proto.prototype.constructor.name !== 'Object' &&
				 data.proto.prototype.constructor.name === object.constructor.name)) {

				objectData = data;
				return false;
			}

			return true;
		});

		return objectData;
	},

	/**
	 * Get the mapping information ofr an object
	 * 
	 * @param  {Object} object
	 * @return {Object}
	 */
	getMappingForObject: function(object){

		var mapping = null;

		this.objects.forEach(function(data){

			if (object instanceof data.proto ||
				(data.proto.prototype.constructor.name !== 'Object' &&
				 data.proto.prototype.constructor.name === object.constructor.name)) {

				mapping = data;
				return false;
			}

			return true;
		});

		return mapping;	
	}
};

module.exports = RestManager;