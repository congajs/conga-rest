const RestNormalizer = require('./RestNormalizer');

/**
 * The Serializer proxies the marshalling/unmarshalling of
 * request and response data
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

    /**
     * Deserialize the request in to a normalized data object
     *
     * @param  {Request} req          the request object
     * @param  {String}  resourceType the resource type
     * @param  {String}  group        the group context
     * @return {Object}
     */
    deserializeRequestData(req, resourceType, group) {
        return this.marshaller.unmarshal(req, resourceType, group);
    }

}
