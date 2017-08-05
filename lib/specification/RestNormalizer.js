const moment = require('moment');
const util = require('util');

/**
 * The RestNormalizer takes the response from a controller and converts it to a standard format
 * which any specific marshaller will use to build the final response.
 *
 * The result from this class will contain all the final attribute names based on sparse fields
 * and have removed any attributes which should be hidden for the current context.
 */
module.exports = class RestNormalizer {

    constructor(registry, mapper, router) {
        this.registry = registry;
        this.mapper = mapper;
        this.router = router;
    }

    /**
     * Normalize the data
     *
     * @param  {Object} req
     * @param  {Object} data  data from controller
     * @return {Object}
     */
    normalize(req, data) {

        if (typeof data.includes === 'undefined' || data.includes === null) {
            data.includes = [];
        }

        const included = {};
        const normalized = this.serializeData(
            req,
            data.data,
            data.context,
            data.sparse,
            data.includes,
            included,
            ''
        );

        const ret = {
            data: normalized,
            included: included
        };

        if (typeof data.pager !== 'undefined' && data.pager !== null) {
            ret.pagination = this.buildPaginationLinks(req, data.type, data.pager);
        }

        return ret;
    }

    /**
     * Build the pagination links object
     *
     * @param  {Object} req
     * @param  {String} type
     * @param  {Pager}  pager
     * @return {Object}
     */
    buildPaginationLinks(req, type, pager) {

        const currentParams = Object.assign({}, req.query);

        const links = {
            self: this.router.buildUrlForResourceList(req, type, currentParams)
        };

        // first
        if (!pager.isFirstPage()) {
            links['first'] = '';
        }

        // last
        if (!pager.isLastPage()) {
            links['last'] = '';
        }

        return links;
    }

    /**
     * Recursively serialize the given data
     *
     * @param  {Object} object       the input data
     * @param  {Object} sparseFields the sparse field information
     * @return {Object}
     */
    serializeData(req, object, context, sparseFields, includes, included, currentPath) {

        let data = null;

        if (object === null) {

            return null;

        } else if (util.isArray(object)) {

            data = [];

            for (let i = 0, j = object.length; i < j; i++) {
                data.push(this.serializeData(
                    req,
                    object[i],
                    context,
                    sparseFields,
                    includes,
                    included,
                    currentPath
                ));
            }

        } else {

            data = this.serializeObject(
                req,
                object,
                context,
                sparseFields,
                includes,
                included,
                currentPath
            );
        }

        return data;
    }

    /**
     * Serialize a given object
     *
     * @param  {Object}  object       the object to serialize
     * @param  {Object}  sparseFields the array of sparse fields to include
     * @return {Object}
     */
    serializeObject(req, object, context, sparseFields, includes, included, currentPath) {

        if (!object) {
            return object;
        }

        let i;
        let obj = {};
        let mapping = null;

        mapping = this.mapper.getMappingFromObject(object);

        // handle non-resources
        if (typeof mapping === 'undefined' || mapping === null) {

            if (object instanceof Object &&
                !(object instanceof String) &&
                !(object instanceof Number) &&
                !(object instanceof Date) &&
                !(object instanceof Boolean)) {

                // if we don't find a matching class, go through each field of the object and try to map recursively
                let isClass = object.constructor.name !== 'Object';

                let idx;

                for (idx in object) {
                    if (typeof object[idx] !== 'function' &&
                        (!isClass || object.hasOwnProperty(idx))) {

                        obj[idx] = this.serializeData(
                            req,
                            object[idx],
                            context,
                            sparseFields,
                            includes,
                            included,
                            this.buildInPath(currentPath, idx)
                        );
                    }
                }

                // return the newly hydrated object
                return obj;
            }

            if (typeof object === 'string' && !isNaN(object)) {
                object = parseInt(object);
            }

            // just return the object we were given
            return object;

        } else {

            obj.type = mapping.type;
            obj.id = object[mapping.id.target] + '';

            // add links to the object
            obj.links = {
                'self': this.router.buildUrlForResource(req, object)
            };

            obj.attributes = {};

            let typeSparseFields = null;

            if (typeof sparseFields !== 'undefined'
                && sparseFields !== null
                && typeof sparseFields[mapping.type] !== 'undefined') {
                typeSparseFields = sparseFields[mapping.type];
            }

            // map each attribute
            for (let i = 0, j = mapping.properties.length; i < j; i++) {

                let property = mapping.properties[i];

                if (typeof property.group !== 'undefined'
                    && !property.group.read.includes(context)
                ) {
                    continue;
                }

                if (typeSparseFields == null || (typeSparseFields !== null
                    && typeSparseFields.indexOf(property.attribute)) > -1) {

                    if (!property.isSetter && property.expose) {

                        let val;

                        if (property.targetType === 'method') {
                            val = object[property.target]();
                        } else {
                            val = object[property.target];
                        }

                        if (property.type === 'Date' && object[property.target] instanceof Date) {

                            obj.attributes[property.attribute] = moment(
                                object[property.target]
                            ).format(property.format);

                        } else {

                            obj.attributes[property.attribute] = this.serializeData(
                                req,
                                val,
                                context,
                                sparseFields,
                                includes,
                                included,
                                this.buildInPath(currentPath, property.attribute)
                            );
                        }
                    }
                }
            }

            // map relationships
            if (mapping.relationships.length > 0) {

                obj.relationships = {
                    one: {},
                    many: {}
                };

                let i, j;

                for (i = 0, j = mapping.relationships.length; i < j; i++) {

                    const relationship = mapping.relationships[i];

                    if (relationship.type == 'one') {

                        obj.relationships['one'][relationship.attribute] = {
                            links: {
                                self: this.router.buildUrlForResourceRelationship(
                                    req,
                                    mapping.type,
                                    obj.id,
                                    relationship.attribute
                                ),

                                related: this.router.buildUrlForRelatedResource(
                                    req,
                                    mapping.type,
                                    obj.id,
                                    relationship.attribute
                                )
                            }
                        };

                        if (object[relationship.target] !== null
                            && typeof object[relationship.target] !== 'undefined') {

                            const inPath = this.buildInPath(currentPath, relationship.attribute);

                            const z = this.serializeData(
                                req,
                                object[relationship.target],
                                context,
                                sparseFields,
                                includes,
                                included,
                                inPath
                            );

                            obj.relationships['one'][relationship.attribute].data = z;

                            if (includes.includes(inPath)) {
                                this.addToIncluded(z, included);
                            }

                        } else {
                            obj.relationships['one'][relationship.attribute].data = null;
                        }
                    }

                    if (relationship.type == 'many'){

                        obj.relationships['many'][relationship.attribute] = {
                            links: {
                                //self: this.router.generateUrl(mapping.type + '.relationships.self', {id: object.id, attribute: relationship.attribute}, true),
                                //related: this.router.generateUrl(mapping.type + '.relationships.related', {id: object.id, attribute: relationship.attribute}, true)
                            },
                            data: []
                        }

                        if (typeof object[relationship.attribute] !== 'undefined') {

                            object[relationship.attribute].forEach((rel) => {

                                const inPath = this.buildInPath(currentPath, relationship.attribute);

                                const z = this.serializeData(
                                    req,
                                    rel,
                                    context,
                                    sparseFields,
                                    includes,
                                    included,
                                    inPath
                                );

                                obj.relationships['many'][relationship.attribute].data.push(z);

                                if (includes.includes(inPath)) {
                                    this.addToIncluded(z, included);
                                }

                            });
                        }
                    }
                }
            }
        }

        return obj;

    }

    /**
     * Append a path part to existing path
     *
     * @param  {String} a
     * @param  {String} b
     * @return {String}
     */
    buildInPath(a, b) {
        if (a === '') return b;
        return [a, b].join('.');
    }

    /**
     * Add an object to the includes store
     *
     * @param  {Object} obj
     * @param  {Object} included
     * @return {void}
     */
    addToIncluded(obj, included) {

        if (typeof included[obj.type] === 'undefined') {
            included[obj.type] = {};
        }

        included[obj.type][obj.id] = obj;
    }

}
