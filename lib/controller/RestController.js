/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The RestController is the parent class for all controllers which should
 * automatically use the conga-rest serialization, etc.
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestController {

    constructor(
        container,
        specification,
        resourceType,
        model,
        isPaginationEnabled,
        defaultLimit = 20,
        defaultSort
    ) {
        this.container = container;
        this.specification = specification;
        this.resourceType = resourceType;
        this.model = model;
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
        throw new Error('You must implement findAll() in your REST controller');
    }

    /**
     * Get a single resource
     *
     * (GET /:id)
     *
     * @param req
     * @param response
     */
    find(req, res) {
        throw new Error('You must implement find() in your REST controller');
    }

    /**
     * Create a new resource
     *
     * (POST /)
     *
     * @param req
     * @param response
     */
    create(req, res) {
        throw new Error('You must implement create() in your REST controller');
    }

    /**
     * Update a resource
     *
     * (PUT /:id)
     * (PATCH /:id)
     *
     * @param req
     * @param response
     */
    update(req, res) {
        throw new Error('You must implement update() in your REST controller');
    }

    /**
     * Delete a resource
     *
     * (DELETE /:id)
     *
     * @param req
     * @param response
     */
    remove(req, res) {
        throw new Error('You must implement remove() in your REST controller');
    }

    /**
     * Find the given relationship for a resource
     *
     * (GET :/id/relationships/:attribute)
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    findRelationship(req, res) {
        throw new Error('You must implement findRelationship() in your REST controller');
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
            return this.specification.parseSorting(req, this.model, this.defaultSort);
        } catch (err) {
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
            res.error(err.message);
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
            return this.specification.parseIncludes(req, this.model);
        } catch (err) {
            res.error(err.message);
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
            return this.specification.parseFiltering(req, this.model);
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
