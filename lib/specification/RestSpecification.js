const OffsetBasedPagination = require('../rest/pagination/OffsetBasedPagination');

/**
 * This class holds all of the components of a configured specification
 */
module.exports = class RestSpecification {

    /**
     * [constructor description]
     *
     * @param  {[type]} contentType    [description]
     * @param  {[type]} validator      [description]
     * @param  {[type]} pagination     [description]
     * @param  {[type]} filtering      [description]
     * @param  {[type]} sorting        [description]
     * @param  {[type]} sparse         [description]
     * @param  {[type]} includes       [description]
     * @param  {[type]} errorFormatter [description]
     * @return {[type]}                [description]
     */
    constructor(
        contentType,
        serializer,
        validator,
        pagination,
        filtering,
        sorting,
        sparse,
        includes,
        errorFormatter
    ) {
        this.contentType = contentType;
        this.serializer = serializer;
        this.validator = validator;
        this.pagination = pagination;
        this.filtering = filtering;
        this.sorting = sorting;
        this.sparse = sparse;
        this.includes = includes;
        this.errorFormatter = errorFormatter;
    }

    /**
     * Return the content type for the specification
     *
     * @return {String}
     */
    getContentType() {
        return this.contentType;
    }

    /**
     * Get the serializer
     *
     * @return {Serializer}
     */
    getSerializer() {
        return this.serializer;
    }

    /**
     * Do any required validation of a request
     *
     * @param  {Request} req           the request
     * @return {Promise}
     */
    validateRequest(req) {
        return this.validator.validateRequest(req);
    }

    /**
     * Parse the pagination from the request
     *
     * @param  {Request} req
     * @return {Pager}
     */
    parsePagination(req) {
        return this.pagination.parse(req);
    }

    /**
     * Parse the filtering from the request
     *
     * @param  {Request} req
     * @return {FilterSet}
     */
    parseFiltering(req) {
        return this.filtering.parse(req);
    }

    /**
     * Parse the sorting from the request
     *
     * @param  {Request} req
     * @return {Object}
     */
    parseSorting(req, type, defaultSort) {
        console.log('parse sorting');
        return this.sorting.parse(req, type, defaultSort);
    }

    /**
     * Parse the sparse fields from the request
     *
     * @param  {Request} req
     * @return {Object}
     */
    parseSparse(req) {
        return this.sparse.parse(req);
    }

    /**
     * Parse the includes (relationships) from the request
     *
     * @param  {Request} req
     * @return {Object}
     */
    parseIncludes(req) {
        return this.includes.parse(req);
    }

    /**
     * Deserialize a request in to a given object
     *
     * @param  {Request} req    the request
     * @param  {Object}  object the object to deserialize in to
     * @return {void}
     */
    deserializeRequestInToObject(req, object) {
        return this.serializer.deserializeRequestInToObject(req, object);
    }

    /**
     * Serialize a single response type (get one, create one, etc.)
     *
     * @param  {Request} req   the original request
     * @param  {Object}  data  the response data
     * @return {Object}
     */
    serializeSingleResponse(req, data) {
        return this.serializer.serializeSingleResponse(req, data);
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
            return this.serializer.serializeListResponse(req, data);
        } else {
            return this.serializer.serializeSingleResponse(req, data);
        }

    }
}
