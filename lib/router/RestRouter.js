/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The RestRouter handles building urls to all the defined REST resources
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestRouter {

    /**
     * Construct the RestRouter with a conga-framework Router
     */
    constructor(router, resourceRegistry) {
        this.router = router;
        this.resourceRegistry = resourceRegistry;
    }

    /**
     * Build the absolute url for a resource
     *
     * @param  {Request} req      the request
     * @param  {Object}  resource the resource object
     * @return {String}
     */
    buildUrlForResource(req, resource) {

        const mapping = this.getMappingFromObject(resource);

        return this.router.generateUrl(
            req,
            mapping.routes['find.one'],
            { id: resource.id },
            true
        );
    }

    /**
     * Build the absolute url for a resource list with query params
     *
     * @param  {Request} req      the request
     * @param  {String}  type     the resource type
     * @param  {Object}  params   the query params
     * @return {String}
     */
    buildUrlForResourceList(req, type, params) {

        const mapping = this.resourceRegistry.getByType(type);

        return this.router.generateUrl(
            req,
            mapping.routes['list'],
            params,
            true
        );
    }

    /**
     * Build the url for a related attribute
     *
     * @param  {Request} req        the request
     * @param  {String}  type       the primary resource type
     * @param  {Mixed}   id         the primary resource id
     * @param  {String}  attribute  the related attribute name
     * @return {String}
     */
    buildUrlForResourceRelationship(req, type, id, attribute) {

        const mapping = this.resourceRegistry.getByType(type);

        return this.router.generateUrl(
            req,
            mapping.routes['relationships.get'],
            {
                id: id,
                attribute: attribute
            },
            true
        );
    }

    /**
     * Build the url for a related resource
     *
     * @param  {Request} req        the request
     * @param  {String}  type       the primary resource type
     * @param  {Mixed}   id         the primary resource id
     * @param  {String}  attribute  the related attribute name
     * @return {String}
     */
    buildUrlForRelatedResource(req, type, id, attribute) {

        console.log('=======================');
        console.log(type);
        console.log(id);
        console.log(attribute);

        const mapping = this.resourceRegistry.getByType(type);

        return this.router.generateUrl(
            req,
            mapping.routes['related'],
            {
                id: id,
                attribute: attribute
            },
            true
        );
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
