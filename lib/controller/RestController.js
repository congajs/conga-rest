/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Controller = require('@conga/framework').Controller;

/**
 * The RestController is the parent class for all controllers which should
 * automatically use the conga-rest serialization, etc.
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestController extends Controller {

    constructor(
        container,
        resourceRegistry,
        specification,
        resourceType,
        isPaginationEnabled,
        defaultLimit = 20,
        defaultSort
    ) {
        super(container);
        this.resourceRegistry = resourceRegistry;
        this.specification = specification;
        this.resourceType = resourceType;
        this.isPaginationEnabled = isPaginationEnabled;
        this.defaultLimit = defaultLimit;
        this.defaultSort = defaultSort
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
        throw new Error('You must implement getRelationship() in your REST controller');
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
    // addRelationship(req, res) {
    //     throw new Error('You must implement addRelationship() in your REST controller');
    // }

    /**
     * Update a resource's relationship
     *
     * (PATCH :/id/relationships/:attribute)
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    updateRelationship(req, res) {
        throw new Error('You must implement updateRelationship() in your REST controller');
    }

    /**
     * Try to get sort criteria from request
     *
     * @param  {Object} req
     * @return {Object}
     */
    parseSorting(req, res) {

        try {
            return this.specification.parseSorting(req, this.resourceType, this.defaultSort);
        } catch (err) {
            console.log(err);
            res.error(err.message);
        }

    }

    /**
     * Try to parse out the sparse fields from the request
     *
     * @param  {Object} req
     * @return {Object}
     */
    parseSparse(req, res) {

        try {
            return this.specification.parseSparse(req, this.model);
        } catch (err) {
            res.error(this.buildErrorResponse({
                type: 'invalid.query.parameter',
                source: { parameter: this.specification.sparse.getName() },
                value: err.message
            }, 400));
        }

    }

    /**
     * Try to parse out the include parameter from the request
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Object}
     */
    parseIncludes(req, res) {

        try {
            return this.specification.parseIncludes(req, this.resourceType);
        } catch (err) {
            res.error(this.buildErrorResponse({
                type: 'invalid.query.parameter',
                source: { parameter: this.specification.includes.getName() },
                value: err.message
            }, 400));
        }

    }

    /**
     * Try to parse out the pagination info from the request
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Object}
     */
    parsePagination(req, res) {

        try {
            const pager =  this.specification.parsePagination(req, this.defaultLimit);
            return pager;
        } catch (err) {
            console.trace(err);
            res.error(err.message);
        }

    }

    /**
     * Try to parse out the filter parameter from the request
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {FilterSet}
     */
    parseFiltering(req, res) {

        try {
            return this.specification.parseFiltering(req, this.resourceType);
        } catch (err) {
            res.error(err);
        }

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
    getContext(req, res) {
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
            context: this.getContext(),
            type: this.resourceType,
            route: req.conga.route,
            data: data,
            pager: pager,
            includes: this.parseIncludes(req, res),
            sparse: this.parseSparse(req, res)
        };

    }
}
