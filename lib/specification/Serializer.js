const util = require('util');

/**
 * This is the abstract serializer which should be extended for specification implementations
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class Serializer {

    /**
     * Construct the serializer with an inflection to use
     */
    constructor(inflection) {
        this.inflection = inflection;
    }

    /**
     * Get the mapping data from the given object
     *
     * @param  {Object} object the object which should hopefully be mapped
     * @return {Object}        the mapping data
     */
    getMappingFromObject(object) {

        if (object === null) {
            return null;
        }

        return Object.getPrototypeOf(object).__CONGA_REST__;
    }

    /**
     * Convenience method so that subclasses don't have to require 'util'
     *
     * @param  {Mixed}   data  the data to check
     * @return {Boolean}
     */
    isArray(data) {
        return util.isArray(data);
    }

    /**
	 * Convert and get an attribute name to a property name for an object instance
	 *
	 * @param  {Object} obj        the resource object
	 * @param  {String} attribute  the attribute name
	 * @return {String}            the property name
	 */
	convertAttributeToPropertyForObject(obj, attribute) {

		const mapping = this.getMappingFromObject(obj);

		// check properties
		if (typeof mapping.attributesToProperties[attribute] !== 'undefined') {
			return mapping.attributesToProperties[attribute].target;
		}

		// // check relationships
		// for (var i=0; i<mapping.relationships.length; i++) {
		// 	if (mapping.relationships[i].attribute == attribute) {
		// 		return mapping.relationships[i].target;
		// 	}
		// }
	}
}
