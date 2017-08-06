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

        const mapping = this.resourceRegistry.getByType(type);

        // check properties
        if (typeof mapping.attributesToProperties[attribute] !== 'undefined') {
            return mapping.attributesToProperties[attribute].target;
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
}
