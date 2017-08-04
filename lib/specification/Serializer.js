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
    constructor(marshaller, normalizer) {
        this.marshaller = marshaller;
        this.normalizer = normalizer;
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
            this.normalizer.normalize(req, data),
            data
        );
    }

    deserializeRequestInToObject(req, data) {
        return this.marshaller.unmarshal(
            req,
            data
        )
    }

    deserializeRequestData(req, resourceType, group) {
        return this.marshaller.unmarshal(req, resourceType, group);
    }

}
