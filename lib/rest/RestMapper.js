const moment = require('moment');

/**
 * The RestMapper provides methods to retreive mapping information for resources
 */
module.exports = class RestMapper {

    constructor(resourceRegistry) {
        this.resourceRegistry = resourceRegistry;
        this.pointerCache = null;
    }

    /**
     * Initialize the mapper
     *
     * @return {void}
     */
    init() {
        this.buildPointerCache();
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
     * Get the mapping by type
     *
     * @param  {String} type
     * @return {Object}
     */
    getMappingForType(type) {
        return this.resourceRegistry.getByType(type);
    }

    /**
     * Check if the given type is a valid registered type
     *
     * @param  {String}  type
     * @return {Boolean}
     */
    isValidType(type) {
        return this.resourceRegistry.isValidType(type);
    }

    /**
     * Convert an attribute name to the associated property name
     *
     * @param  {String} type      the resource type
     * @param  {String} attribute the attribute name
     * @return {String}           the property name
     */
    convertAttributeToProperty(type, attribute) {

        const registry = this.resourceRegistry.getByType(type);

        if (!registry) {
            return null;
        }

        // check properties
        if (attribute in registry.attributesToProperties) {
            return registry.attributesToProperties[attribute].target;
        }

        // check dot notation
        let target = '';
        let mapping = registry;
        let parts = attribute.split('.');

        while (mapping && parts.length > 1) {
            const nested = parts.shift();

            const child = parts.join('.');

            if (nested in mapping.attributesToProperties) {
                const prop = mapping.attributesToProperties[nested];

                mapping = this.resourceRegistry.getByType(prop.relatedType);

                if (mapping) {
                    target += (target.length !== 0 ? '.' : '') + nested;

                    if (child in mapping.attributesToProperties) {

                        const childProp = mapping.attributesToProperties[child];

                        // cache the nested mapping so we don't loop again
                        registry.attributesToProperties[attribute] = Object.assign({}, childProp, {
                            target: target + '.' + childProp.target
                        });

                        // return the target path
                        return target + '.' + childProp.target;
                    }
                }
            }
        }

        return null;

    }

    /**
     * Convert a property name to the associated attribute name
     *
     * @param  {String} type      the resource type
     * @param  {String} property  the property name
     * @return {String}           the attribute name
     */
    convertPropertyToAttribute(type, property) {

        const mapping = this.resourceRegistry.getByType(type);

        // check properties
        if (typeof mapping.propertiesToAttributes[property] !== 'undefined') {
            return mapping.propertiesToAttributes[property];
        }

        return null;
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

    /**
     * Check if the given pointer is valid for the given resource type
     *
     * Examples:
     *     isValidPointer('article', 'author.email')
     *     isValidPointer('article', 'author/email')
     *
     * @param  {String}  type    the resource type
     * @param  {String}  pointer the pointer (in dot or slash notation)
     * @return {Boolean}
     */
    isValidPointer(type, pointer) {

        // normalize the pointer to slash notation
        pointer = pointer.replace(/\./g, '/');

        return this.pointerCache[type].includes(pointer);
    }

    /**
     * Build the pointer cache for all registered resources
     *
     * @return {void}
     */
    buildPointerCache() {

        this.pointerCache = {};

        const types = this.resourceRegistry.getTypes();

        // recursively build cache for a type
        const buildPointersForType = function(type, base, cache) {

            const meta = types[type];

            cache.push(base + meta.id.attribute);

            let property;
            for (property of meta.properties) {
                cache.push(base + property.attribute);
            }

            let relationship;
            for (relationship of meta.relationships) {

                cache.push(base + relationship.attribute);

                buildPointersForType(
                    relationship.relatedType,
                    base + relationship.attribute + '/',
                    cache
                );
            }
        }

        let type;

        for (type in types) {
            const cache = [];
            buildPointersForType(type, '', cache);
            this.pointerCache[type] = cache;
        }

    }

    /**
     * Convert an incoming resource attribute value to an unmarshalled property value
     *
     * @param  {String} type      the resource type
     * @param  {String} attribute the attribute name
     * @param  {Mixed}  value     the value
     * @return {Mixed}            the converted value
     */
    convertAttributeValueToPropertyValue(type, attribute, value) {

        const mapping = this.resourceRegistry.getByType(type);

        // check properties
        if (typeof mapping.attributesToProperties[attribute] === 'undefined') {
            throw new Error();
        }

        const map = mapping.attributesToProperties[attribute];

        if ('valueMap' in map) {

            if (typeof map.valueMap.outToIn[value] === 'undefined') {
                throw new Error();
            }

            value = map.valueMap.outToIn[value];
        }

        if (typeof map.type !== 'undefined' && map.type !== null) {

            if (map.type === 'Date') {
                value = new Date(value);
            }

        }

        return value;
    }
}
