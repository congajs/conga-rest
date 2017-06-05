module.exports = class BaseRestSerializer {

	setup(router, config, mapping, objectMapping) {
		this.router = router;
		this.config = config;
		this.mapping = mapping;
		this.objectMapping = objectMapping;
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
		throw new Error("must implement BaseSerializer:serializeSingleResponse");
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
		throw new Error("must implement BaseSerializer:serializeListResponse");
	}

	/**
	 * Deserialize data in to a new object of the given type
	 *
	 * @param  {String} type
	 * @param  {Object} data
	 * @return {Object}
	 */
	deserialize(type, data) {
		throw new Error("must implement BaseSerializer:deserialize");
	}

	/**
	 * Deserialize data in to an existing object
	 *
	 * @param  {String} type
	 * @param  {Object} object
	 * @param  {Object} data
	 * @return {Object}
	 */
	deserializeInToObject(type, object, data) {
		throw new Error("must implement BaseSerializer:deserializeInToObject");
	}

	/**
	 * Convert an attribute to a model property
	 *
	 * @param  {String} type
	 * @param  {String} attribute
	 * @return {Mixed}
	 */
	convertAttributeToProperty(type, attribute) {

		var mapping = this.mapping[type];

		if (typeof mapping.attributesToProperties[attribute] !== 'undefined') {
			return mapping.attributesToProperties[attribute].target;
		}

		return null;
	}

	/**
	 * Get the mapping for an object instance
	 *
	 * @param  {Object} obj
	 * @return {Object}
	 */
	getMappingForObject(obj) {

		var protoId = Object.getPrototypeOf(obj)._CONGA_REST_ID

		if (typeof this.objectMapping[protoId] === 'undefined') {
			return null;
		}

		return this.objectMapping[protoId];
	}

	/**
	 * Convert and get an attribute name to a property name for an object instance
	 *
	 * @param  {Object} obj
	 * @param  {String} attribute
	 * @return {String}
	 */
	convertAttributeToPropertyForObject(obj, attribute) {

		var mapping = this.getMappingForObject(obj);

		// check properties
		if (typeof mapping.attributesToProperties[attribute] !== 'undefined') {
			return mapping.attributesToProperties[attribute].target;
		}

		// check relationships
		for (var i=0; i<mapping.relationships.length; i++) {
			if (mapping.relationships[i].attribute == attribute) {
				return mapping.relationships[i].target;
			}
		}
	}

}
