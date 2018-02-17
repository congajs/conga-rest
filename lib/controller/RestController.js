/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Controller = require('@conga/framework').Controller;
const QueryError = require('../query/QueryError');
const RestError = require('../rest/RestError');

/**
 * The RestController is the parent class for all controllers which should
 * automatically use the conga-rest serialization, etc.
 */
module.exports = class RestController extends Controller {

    constructor(
        container,
        resourceRegistry,
        specification,
        resourceType,
        isPaginationEnabled,
        defaultLimit = 20,
        defaultSort,
        isBulkEnabled
    ) {
        super(container);
        this.resourceRegistry = resourceRegistry;
        this.specification = specification;
        this.resourceType = resourceType;
        this.isPaginationEnabled = isPaginationEnabled;
        this.defaultLimit = defaultLimit;
        this.defaultSort = defaultSort;
        this.isBulkEnabled = isBulkEnabled;
    }

    /**
     * Get all of the resources
     *
     * (GET /)
     *
     * @param req
     * @param response
     */
    list(req, res) {
        throw new Error('You must implement list() in your REST controller');
    }

    /**
     * Get a single resource
     *
     * (GET /:id)
     *
     * @param req
     * @param response
     */
    get(req, res) {
        throw new Error('You must implement get() in your REST controller');
    }

    /**
     * Create a new resource
     *
     * (POST /)
     *
     * @param req
     * @param response
     */
    post(req, res) {
        throw new Error('You must implement post() in your REST controller');
    }

    /**
     * Update a resource
     *
     * (PUT /:id)
     *
     * @param req
     * @param response
     */
    put(req, res) {
        throw new Error('You must implement put() in your REST controller');
    }

    /**
     * Update a resource
     *
     * (PATCH /:id)
     *
     * @param req
     * @param response
     */
    patch(req, res) {
        throw new Error('You must implement patch() in your REST controller');
    }

    /**
     * Delete a resource
     *
     * (DELETE /:id)
     *
     * @param req
     * @param response
     */
    delete(req, res) {
        throw new Error('You must implement delete() in your REST controller');
    }

    /**
     * Update multiple resources
     *
     * (PATCH /)
     *
     * @param req
     * @param response
     */
    patchBulk(req, res) {
        throw new Error('You must implement patchBulk() in your REST controller');
    }

    /**
     * DELETE multiple resources
     *
     * (DELETE /)
     *
     * @param req
     * @param response
     */
    deleteBulk(req, res) {
        throw new Error('You must implement deleteBulk() in your REST controller');
    }

    /**
     * Get the given relationship for a resource
     *
     * (GET :/id/relationships/:attribute)
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    getRelationship(req, res) {
        throw new Error('You must implement getRelationship() in your REST controller');
    }

    /**
     * Get the related resource for a primary resource
     *
     * (GET :/id/:attribute)
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    getRelatedResource(req, res) {
        throw new Error('You must implement getRelatedResource() in your REST controller');
    }

    /**
     * Update a resource's relationship
     *
     * (POST :/id/relationships/:attribute)
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    postRelationship(req, res) {
        throw new Error('You must implement postRelationship() in your REST controller');
    }

    /**
     * Update a resource's relationship
     *
     * (PATCH :/id/relationships/:attribute)
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    patchRelationship(req, res) {
        throw new Error('You must implement patchRelationship() in your REST controller');
    }

    /**
     * Delete a resource's relationship
     *
     * (DELETE :/id/relationships/:attribute)
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    deleteRelationship(req, res) {
        throw new Error('You must implement deleteRelationship() in your REST controller');
    }

    /**
     * Try to get sort criteria from request
     *
     * @param  {Object} req
     * @return {Object}
     */
    parseSorting(req, res) {
        return this.specification.parseSorting(req, this.resourceType, this.defaultSort);
    }

    /**
     * Try to parse out the sparse fields from the request
     *
     * @param  {Object} req
     * @return {Object}
     */
    parseSparse(req, res) {
        return this.specification.parseSparse(req, this.resourceType);
    }

    /**
     * Try to parse out the include parameter from the request
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Object}
     */
    parseIncludes(req, res) {
        return this.specification.parseIncludes(req, this.resourceType);
    }

    /**
     * Try to parse out the pagination info from the request
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Object}
     */
    parsePagination(req, res) {
        return this.specification.parsePagination(req, this.defaultLimit);
    }

    /**
     * Try to parse out the filter parameter from the request
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {FilterSet}
     */
    parseFiltering(req, res) {
        return this.specification.parseFiltering(req, this.resourceType);
    }

    /**
     * Get the current context for marshal/unmarshal
     *
     * Overide this method to add custom logic to switch the context
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {String}
     */
    getGroupContext(req, res) {
        return 'DEFAULT';
    }

    /**
     * Build the return data for the response
     *
     * This automatically adds sparse/includes info if it exists on the request
     *
     * @param  {Object} req          [description]
     * @param  {Object} res          [description]
     * @param  {Mixed}  data         [description]
     * @param  {Pager}  pager        [description]
     * @return {Object}              [description]
     */
    buildReturnData(req, res, data, pager = null) {

        return {
            context: this.getGroupContext(),
            type: this.resourceType,
            route: req.conga.route,
            data: data,
            pager: pager,
            includes: this.parseIncludes(req, res),
            sparse: this.parseSparse(req, res)
        };

    }

    /**
     * Validate the request body to make sure it isn't empty or malformed
     *
     * This will automatically send the error to the response and return
     * the generated ErrorResponse if the body is invalid
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {ErrorResponse}
     */
    validateRequestBody(req, res) {

        // make sure that there wasn't a problem parsing body
        if (req.body === null) {
            return res.error(this.buildErrorResponse({
                resource: this.resourceType,
                type: RestError.BAD_JSON_BODY,
                errors: [
                    {
                        detail: req._ERROR_BAD_JSON
                    }
                ]
            }, 400));
        }

        return false;
    }

    /**
     * Send an internal server error response
     *
     * @param  {Response}      res
     * @param  {ErrorResponse} error
     * @return {void}
     */
    sendInternalServerError(res, error) {

        // always log the errors
        this.container.get('logger').error(error.stack);

        return res.error(this.buildErrorResponse({
            resource: this.resourceType,
            type: RestError.INTERNAL_SERVER_ERROR,
            errors: [error]
        }, 500));
    }

    sendResourcePermissionError(res, error) {
        //return res.error(error);
        return res.error(this.buildErrorResponse({
            resource: this.resourceType,
            type: RestError.RESOURCE_INVALID_PERMISSIONS,
            errors: [{
                type: RestError.RESOURCE_INVALID_PERMISSIONS,
            }]
        }, 401));
    }

    /**
     * Send a 404 error
     *
     * @param  {Response}      res
     * @return {void}
     */
    sendResourceNotFoundError(res) {
        return res.error(this.buildErrorResponse({
            resource: this.resourceType,
            type: RestError.RESOURCE_NOT_FOUND,
            errors: [
                {
                    type: RestError.RESOURCE_NOT_FOUND
                }
            ]
        }, 404));
    }

    sendResourceInvalidDataError(res, errors) {
        return res.error(this.buildErrorResponse({
            resource: this.resourceType,
            type: RestError.INVALID_RESOURCE_DATA,
            errors: this.convertValidationErrorsToRestErrors(errors)
        }, 422));
    }

    convertValidationErrorsToRestErrors(errors) {

        const final = [];

        errors.forEach((error) => {
            final.push({
                resource: this.resourceType,
                type: RestError.RESOURCE_INVALID_DATA,
                source: { pointer: error.property },
                detail: error.message
            });
        });

        return final;
    }

    sendSpecificationError(res, error) {
        return res.error(error);
    }

    sendBadRequestError(res, error) {
        return res.error(this.buildErrorResponse({
            resource: this.resourceType,
            errors: error.errors
        }, 400));
    }

    /**
     * Send a 405 error
     *
     * @param  {Response}      res
     * @return {void}
     */
    sendMethodNotAllowedError(res) {
        return res.error(this.buildErrorResponse({
            resource: this.resourceType,
            type: RestError.METHOD_NOT_ALLOWED,
            errors: [
                {
                    type: RestError.METHOD_NOT_ALLOWED
                }
            ]
        }, 405));
    }

    /**
     * Send the final success response
     *
     * This will catch any QueryError(s) from include or sparse query parameters and send
     * them to res.error()
     *
     * @param  {Object} req          [description]
     * @param  {Object} res          [description]
     * @param  {Mixed}  data         [description]
     * @param  {Pager}  [pager=null] [description]
     * @param  {Number} status       [description]
     * @return {void}                [description]
     */
    sendSuccessResponse(req, res, data, pager = null, status = 200) {

        try {

            return res.return(this.buildReturnData(
                req,
                res,
                data,
                pager
            ), status);

        } catch (error) {

            if (error instanceof QueryError) {
                return this.sendBadRequestError(res, error);
            } else {
                return this.sendInternalServerError(res, error);
            }

        }
    }
}
