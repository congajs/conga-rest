const RestNormalizer = require('./RestNormalizer');

/**
 * This is the abstract serializer which should be extended for specification implementations
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class Serializer {

    /**
     * Construct the serializer with an inflection to use
     */
    constructor(resourceRegistry, inflection, router, marshaller) {
        this.resourceRegistry = resourceRegistry;
        this.inflection = inflection;
        this.router = router;
        this.marshaller = marshaller;

        this.normalizer = new RestNormalizer(this.resourceRegistry, this.router);
    }

    /**
     * Serialize the data from a controller
     *
     * @param  {Object} req
     * @param  {Object} data  data from controller
     * @return {Object}
     */
    serialize(req, data) {
        return this.marshaller.marshal(
            req,
            this.normalizeData(req, data),
            data
        );
    }

    normalizeData(req, data) {
        return this.normalizer.normalize(req, data);
    }

    /**
     * @TODO - NEED TO MOVE THIS TO A CENTRAL PLACE
     *
     * Convert an attribute name to the associated property name
     *
     * @param  {String} type      the resource type
     * @param  {String} attribute the attribute name
     * @return {String}           the property name
     */
    convertAttributeToProperty(type, attribute) {

        const mapping = this.resourceRegistry.get(type);

        // check properties
		if (typeof mapping.attributesToProperties[attribute] !== 'undefined') {
			return mapping.attributesToProperties[attribute].target;
		}

        return null;

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
}
