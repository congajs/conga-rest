const OffsetBasedPagination = require('../rest/pagination/OffsetBasedPagination');

/**
 * This class holds all of the components to handle a configured specification
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestSpecification {

    /**
     * Construct the specification with the "rest" config values
     *
     * @param  {Object} config the "rest" config object
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * Initialize the specification
     *
     * @return {void}
     */
    initialize() {
        throw new Error('You must implement RestSpecification::initialize()');
    }

    // constructor(serializer, pagination, sort, filtering, include, sparse, relationships, errorHandler) {
    //
    // }

    /**
     * Return the content type for the specification
     *
     * @return {String}
     */
    getContentType() {
        throw new Error('You must implement RestSpecification::getContentType()');
    }

    getSerializer() {
        return this.serializer;
    }

    parsePaginationFromRequest(req) {
        return new OffsetBasedPagination();
        return this.parsePaginationFromRequest(req);
    }

    parseSortFromRequest(req) {

    }

    parseFiltersFromRequest(req) {

    }

    parseIncludesFromRequest(req) {

    }

    parseSparseFieldsFromRequest(req) {

    }

    /**
     * Do any required validation of a request
     *
     * @param  {Request} req           the request
     * @param  {String}  resourceType  the name of the resource
     * @return {Promise}
     */
    validateRequest(req, resourceType) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    /**
     * Deserialize a request in to a given object
     *
     * @param  {Request} req    the request
     * @param  {Object}  object the object to deserialize in to
     * @return {void}
     */
    deserializeRequestInToObject(req, object) {
        throw new Error('You must implement RestSpecification::deserializeRequestInToObject!');
    }

    /**
     * Serialize a single response type (get one, create one, etc.)
     *
     * @param  {Request} req   the original request
     * @param  {Object}  data  the response data
     * @return {Object}
     */
    serializeSingleResponse(req, data) {
        throw new Error('You must implement RestSpecification::serializeSingleResponse');
    }

    /**
     * Serialize a final response
     *
     * @param  {Request} req   the original request
     * @param  {Object}  data  the response data
     * @return {Mixed}
     */
    serializeResponse(req, data) {

        if (typeof data.data === 'Array') {
            return this.serializeListResponse(req, data);
        } else {
            return this.serializeSingleResponse(req, data);
        }

    }
}
