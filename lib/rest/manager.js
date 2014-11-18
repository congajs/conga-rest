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
var _ = require('lodash');

var annotations = require('conga-annotations');
var wrench;

/**
 * The RestManager keeps track of Restful objects
 * and handles thier serialization
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
function RestManager() {
	this.objects = [];
	this.nameToObjectMap = {};
}

RestManager.prototype = {

	/**
	 * Parse out all of the REST annotations from objects
	 * and store the information for lookup later on
	 * 
	 * @param container
	 */
	onKernelCompile: function(event, next){

		//_ = require('lodash'); //event.container.get('lodash');
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

		methodAnnotations.forEach(function(annotation) {
			switch (annotation.annotation) {
				case 'Rest:Property' :
					properties.push({
						targetType: 'method',
						target: annotation.target,
						update: annotation.update,
						type: annotation.type,
						property: annotation.property ? annotation.property : annotation.target,
						isSetter: annotation.setter
					});
					break;

				case 'Rest:SerializeMethod' :
					serializeMethod = annotation.target;
					break;

				case 'Rest:DeserializeMethod' :
					deserializeMethod = annotation.target;
					break;
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
	 * Deserialize any data object into a given object
	 * 
	 * @param  {Object} object The object
	 * @param  {Object} data The data you are unserializing INTO your object
	 * @return {Object} The newly hydrated object (same instance)
	 */
	deserialize: function(object, data){

		if (object === null){
			return null;
		}

		if (util.isArray(object)){

			var arr = [];

			object.forEach(function(obj){
				arr.push(this.deserializeObject(obj, data));
			}, this);

			return arr;
		}

		return this.deserializeObject(object, data);
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
		if (mapping === null){
			return object;
		}

		//var obj = new mapping.proto();

		if (mapping.deserializeMethod && typeof object[mapping.deserializeMethod] === 'function'){

			// use the serialization method
			object[mapping.deserializeMethod](data);

		} else {

			// map each property
			var self = this;
			mapping.properties.forEach(function(property, idx){

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

		if (!object) {
			return object;
		}

		var i ,
			obj = {} ,
			mapping = null ,
			len = this.objects.length;

		for (i = 0; i < len; i++) {

			if (object instanceof this.objects[i].proto &&
				this.objects[i].proto.prototype.constructor.name !== 'Object' &&
				this.objects[i].proto.prototype.constructor.name !== 'Function' &&
				this.objects[i].proto.prototype.constructor.name === object.constructor.name) {

				mapping = this.objects[i];
				break;
			}
		}

		if (mapping === null){

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

						obj[idx] = this.serialize(object[idx]);
					}
				}

				// return the newly hydrated object
				return obj;
			}

			// just return the object we were given
			return object;
		}

		if (mapping.serializeMethod && typeof object[mapping.serializeMethod] === 'function'){

			// use the serialization method
			// NOTE: passing through this.serialize() again just incase another object that should be serialized is returned
			obj = this.serialize( object[mapping.serializeMethod]() );

		} else {

			// TODO: if the field exists in the class without a rest property, strip it - if the field does not exist in the class but is in the data, leave it in!!!!!!!!

			// map each property
			mapping.properties.forEach(function(property){

				if (!property.isSetter){
					if (property.targetType === 'method'){
						obj[property.property] = this.serialize( object[property.target]() );
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

		var obj = this.getDataForObject(object);

		if (obj) {
			return obj.properties;
		}

		return null;

	},

	// TODO : getDataForObject and getMappingForObject are identical, why?

	/**
	 * Find the data for an object
	 * 
	 * @param  {Object} object
	 * @return {Object}
	 */
	getDataForObject: function(object){

		var i,
			len = this.objects.length;

		for (i = 0; i < len; i++) {

			if (object instanceof this.objects[i].proto ||
				(this.objects[i].proto.prototype.constructor.name !== 'Object' &&
					this.objects[i].proto.prototype.constructor.name !== 'Function' &&
					this.objects[i].proto.prototype.constructor.name === object.constructor.name)) {

				return this.objects[i];
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
	getMappingForObject: function(object){

		var i,
			len = this.objects.length;

		for (i = 0; i < len; i++) {

			if (object instanceof this.objects[i].proto ||
				(this.objects[i].proto.prototype.constructor.name !== 'Object' &&
					this.objects[i].proto.prototype.constructor.name !== 'Function' &&
					this.objects[i].proto.prototype.constructor.name === object.constructor.name)) {

				return this.objects[i];
			}
		}

		return null;
	}
};

RestManager.prototype.constructor = RestManager;

module.exports = RestManager;