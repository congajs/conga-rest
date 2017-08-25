/**
 * This class holds all of the components of a configured specification
 */
module.exports = class RestSpecification {

    /**
     * Construct the RestSpecification with configured parsers, etc.
     *
     * @param  {String}                contentType
     * @param  {RestRequestValidator}  validator
     * @param  {PaginationQueryParser} pagination
     * @param  {FilteringQueryParser}  filtering
     * @param  {SortingQueryParser}    sorting
     * @param  {SparseQueryParser}     sparse
     * @param  {IncludeQueryParser}    includes
     * @param  {ErrorHandler}          errorHandler
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
        errorHandler
    ) {
        this.contentType = contentType;
        this.serializer = serializer;
        this.validator = validator;
        this.pagination = pagination;
        this.filtering = filtering;
        this.sorting = sorting;
        this.sparse = sparse;
        this.includes = includes;
        this.errorHandler = errorHandler;
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
     * @param  {String}  resourceType  the resource type
     * @return {Promise}
     */
    validateRequest(req, resourceType) {
        return this.validator.validateRequest(req, resourceType);
    }

    /**
     * Parse the filtering from the request
     *
     * @param  {Request} req   the request object
     * @param  {String}  type  the resource type
     * @return {FilterSet}
     */
    parseFiltering(req, type) {
        return this.filtering.parse(req, type);
    }

    /**
     * Parse the sorting from the request
     *
     * @param  {Request} req          the request object
     * @param  {String}  type         the resource type
     * @param  {Object}  defaultSort  the default sorting object
     * @return {Object}
     */
    parseSorting(req, type, defaultSort) {
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
    parseIncludes(req, type) {
        return this.includes.parse(req, type);
    }

    /**
     * Parse the pagination query from the request
     *
     * @param  {Request} req           the request
     * @param  {Number}  defaultLimit  the default limit
     * @return {Pager}
     */
    parsePagination(req, defaultLimit) {
        return this.pagination.parse(req, defaultLimit);
    }

    /**
     * Deserialize the request in to a normalized object
     *
     * @param  {Request} req          the request
     * @param  {String}  resourceType the resource type
     * @param  {String}  group        the group (context)
     * @return {Object}
     */
    deserializeRequestData(req, resourceType, group) {
        return this.serializer.deserializeRequestData(req, resourceType, group);
    }

    /**
     * Serialize a final response
     *
     * @param  {Request} req   the original request
     * @param  {Object}  data  the response data
     * @return {Mixed}
     */
    serializeResponse(req, data) {
        return this.serializer.serialize(req, data);
    }

    /**
     * Handle and serialize the final error
     *
     * @param  {Request}       req   the original request
     * @param  {Response}      res   [description]
     * @param  {ErrorResponse} error [description]
     * @param  {Function}      cb    [description]
     * @return {void}
     */
    handleError(req, res, error, cb) {
        return this.errorHandler.handleError(req, res, error, cb);
    }
}
