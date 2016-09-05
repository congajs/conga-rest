var util = require('util');

function JsonApiSerializer(){

};

JsonApiSerializer.prototype = {

	setup: function(router, config, mapping, objects){

		this.router = router;
		this.config = config;
		this.mapping = mapping;
		this.objects = objects;

		// build map of constructor names to types
		this.objectToTypeMap = {};

		for (var i=0; i<this.objects.length; i++){
			this.objectToTypeMap[this.objects[i].proto.prototype.constructor.name] = this.objects[i];
		}
	},

	/**
	 * Serialize the list response
	 * 
	 * @param  {[type]} type       [description]
	 * @param  {[type]} data       [description]
	 * @param  {[type]} pagination [description]
	 * @param  {[type]} includes   [description]
	 * @param  {[type]} req        [description]
	 * @return {[type]}            [description]
	 */
	serializeListResponse: function(type, data, pagination, includes, sparseFields, req) {

		var obj = {};

		obj.jsonapi = {
			version: "1.0"
		};

		obj.links = {
			self: pagination.currentPage,
			first: pagination.firstPage,
			last: pagination.lastPage,
			prev: pagination.previousPage,
			next: pagination.nextPage
		};

		obj.data = this.serializeData(data, sparseFields);

		if (includes !== null){
			obj.included = this.serializeIncluded(data, includes, sparseFields);
		}

		return obj;

	},

	serializeIncluded: function(data, includes, sparseFields){

		var included = [];
		var cache = [];
		var that = this;

		var walk = function(obj, path){

			var prop = path.shift();

			prop = that.convertAttributeToPropertyForObject(obj, prop);

			obj = obj[prop];

			if (util.isArray(obj)){
				obj.forEach(function(tmp){
					var key = that.getMappingForObject(tmp).type + ':' + tmp.id;

					if (cache.indexOf(key) === -1){
						included.push(that.serializeObject(tmp, sparseFields));
						cache.push(key);
					}

					if (path.length > 0){
						walk(tmp, path);
					}
				});

			} else {

				if (obj !== null){

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
		for (var i=0; i<data.length; i++){
			for (var j=0; j<includes.length; j++){
				walk(data[i], includes[j].slice(0)); // <-- cloning array here
			}
		}

		return included;
	},

	serialize: function(object){

		if (object === null){
			return null;
		}

		var obj = {};

		obj.jsonapi = {
			version: "1.0"
		};

		obj.links = {
			self: this.config['linking.root.url'] + "/users"
		};

		obj.data = this.serializeData(object);

		return obj;
	},

	serializeData: function(object, sparseFields)
	{
		var data = null;

		if (util.isArray(object)){

			data = [];

			object.forEach(function(obj){
				data.push(this.serializeData(obj, sparseFields));
			}, this);

		} else {
			data = this.serializeObject(object, sparseFields);		
		}

		return data;
	},

	serializeObject: function(object, sparseFields)
	{
		if (!object) {
			return object;
		}

		var i ,
			obj = {} ,
			mapping = null ,
			len = this.objects.length;

		mapping = this.getMappingForObject(object);

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
			mapping.properties.forEach(function(property){

				if (typeSparseFields == null || (typeSparseFields !== null && typeSparseFields.indexOf(property.attribute)) > -1){
					if (!property.isSetter && property.expose){
						if (property.targetType === 'method'){
							obj.attributes[property.attribute] = this.serializeData(object[property.target]() );
						} else {
							obj.attributes[property.attribute] = this.serializeData(object[property.target]);
						}				
					}
				}


			}, this);

			// map relationships
			if (mapping.relationships.length > 0){

				obj.relationships = {};

				mapping.relationships.forEach(function(relationship){

					if (relationship.type == 'one'){
						obj.relationships[relationship.attribute] = {
							links: {
								self: this.router.generateUrl(mapping.type + '.relationships.self', {id: object.id, attribute: relationship.attribute}, true),
								related: this.router.generateUrl(mapping.type + '.relationships.related', {id: object.id, attribute: relationship.attribute}, true)
							},
							data: {
								type: relationship.relatedType,
								id: object[relationship.target].id
							}
						};
					}

					if (relationship.type == 'many'){
						obj.relationships[relationship.attribute] = {
							links: {
								self: this.router.generateUrl(mapping.type + '.relationships.self', {id: object.id, attribute: relationship.attribute}, true),
								related: this.router.generateUrl(mapping.type + '.relationships.related', {id: object.id, attribute: relationship.attribute}, true)
							},
							data: []
						}

						if (typeof object[relationship.attribute] !== 'undefined'){
							object[relationship.attribute].forEach(function(rel){
								obj.relationships[relationship.attribute].data.push({
									type: relationship.relatedType,
									id: rel.id
								});
							}, this);
						}
					}

				}, this);

			}

			// add links to the object
			obj.links = {

				'self': this.router.generateUrl(mapping.type + '.find.one', {id: object.id}, true),
			}

		}

		return obj;

	},

	deserialize: function(type, data){

		var allMapping = this.mapping;
		var mapping = this.mapping[type];
		var obj = new mapping.proto;

		mapping.properties.forEach(function(property){
			obj[property.target] = typeof data.data.attributes[property.attribute] !== 'undefined' ? data.data.attributes[property.attribute] : null;
		});

		// relationships
		mapping.relationships.forEach(function(relationship){

			if (relationship.type == 'one'){

				// check if relationship exists in request
				if (typeof data.data.relationships !== 'undefined' && typeof data.data.relationships[relationship.attribute] !== 'undefined'){
					var rel = new allMapping[relationship.relatedType].proto;
					rel.id = data.data.relationships[relationship.attribute].data.id;
					obj[relationship.target] = rel;
				}
			}

			if (relationship.type == 'many'){

			}

		});



		return obj;
	},

	deserializeInToObject: function(type, object, data){

		var mapping = this.mapping[type];

		mapping.properties.forEach(function(property){

			if (typeof data.data.attributes[property.attribute] !== 'undefined'){
				object[property.target] = data.data.attributes[property.attribute];
			}
		});

		return object;
	},

	/**
	 * Convert an attribute to a model property
	 * 
	 * @param  {String} type
	 * @param  {String} attribute
	 * @return {Mixed}
	 */
	convertAttributeToProperty: function(type, attribute){
		var mapping = this.mapping[type];
		if (typeof mapping.attributesToProperties[attribute] !== 'undefined'){
			return mapping.attributesToProperties[attribute].target;		
		}

		return null;
	},

	/**
	 * Get the mapping for an object instance
	 * 
	 * @param  {Object} obj
	 * @return {Object}
	 */
	getMappingForObject: function(obj){
		if (typeof this.objectToTypeMap[obj.constructor.name] !== 'undefined'){
			return this.objectToTypeMap[obj.constructor.name];
		}
		
		return null;
	},

	/**
	 * Convert and get an attribute name to a property name for an object instance
	 * 
	 * @param  {Object} obj
	 * @param  {String} attribute
	 * @return {String}
	 */
	convertAttributeToPropertyForObject: function(obj, attribute){

		var mapping = this.getMappingForObject(obj);

		// check properties
		if (typeof mapping.attributesToProperties[attribute] !== 'undefined'){
			return mapping.attributesToProperties[attribute].target;
		}

		// check relationships
		for (var i=0; i<mapping.relationships.length; i++){
			if (mapping.relationships[i].attribute == attribute){
				return mapping.relationships[i].target;
			}
		}
	}

};

module.exports = JsonApiSerializer;