/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const ConjunctionFilter = require('../query/ConjunctionFilter');
const Filter = require('../query/Filter');
const RestController = require('./RestController');

/**
 * The BassRestController is the parent class for any REST controller which
 * should hook in to the bass ODM
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class BassRestController extends RestController {

    /**
     * (GET /)
     *
     * @param req
     * @param response
     */
    list(req, res) {

        // create the bass session and get manager for the current model
        const session = this.container.get('bass').createSession();
        const manager = this.getManagerForCurrentResource(session);

        // create a new bass query
        const query = manager.createQuery();
        const pager = this.parsePaginationIntoQuery(req, res, query);

        // add filters and sorting to the query
        this.parseFilteringIntoQuery(req, res, query);
        this.parseSortingIntoQuery(req, res, query);

        // run modifyListQuery to allow the query to be modified
        this.modifyListQuery(req, res, query).then(() => {

            return manager.findByQuery(this.getModelNameForCurrentResource(), query);

        }).then((documents) => {

            return new Promise((resolve, reject) => {

                session.close();

                pager.setMaxResults(documents.totalRows);

                try {
                    res.return(
                        this.buildReturnData(req, res, documents.data, pager),
                        200
                    );
                } catch (err) {
                    reject(err);
                }

            });

        }).catch((err) => {
            this.container.get('logger').error(err.stack);
            res.error(err);
        });

    }

    /**
     * (GET /:id)
     *
     * @param req
     * @param response
     */
    get(req, res) {

        // create the bass session and get manager for the current model
        const session = this.container.get('bass').createSession();
        const manager = this.getManagerForCurrentResource(session);

        const conditions = { id: req.params.id };

        this.modifyFindConditions(req, res, conditions).then(() => {

            return manager.findOneBy(this.getModelNameForCurrentResource(), conditions);

        }).then((document) => {

            if (document === null) {
                return res.error(this.buildErrorResponse({
                    type: this.resourceType
                }, 404));
            }

            // return final serialized response
            res.return(
                this.buildReturnData(req, res, document),
                200
            );

        // handle error
        }, (err) => {
            this.container.get('logger').error(err.stack);
            return res.error(this.buildErrorResponse({
                type: this.resourceType
            }, 500));
        });
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

        // make sure that there wasn't a problem parsing body
        if (req.body === null) {
            return this.restManager.createBadRequestResponse(res);
        }

         // get the bass manager
        const session = this.container.get('bass').createSession()
        const manager = this.getManagerForCurrentResource(session);

        // do any specification specific validation
        this.specification.validateRequest(req, this.resourceType).then(() => {

            // deserialize the request data to a resource model
            const resource = manager.createDocument(this.getModelNameForCurrentResource());
            const data = this.specification.deserializeRequestData(req, this.resourceType, this.getContext());

            // console.log('====== GOT DATA ======');
            // console.log(data);

            // copy over attributes to resource
            let property;

            for (property in data.attributes) {
                resource[property] = data.attributes[property];
            }

            // console.log(resource);
            // process.exit();

            // validate the model
            this.container.get('validator').validate(resource).then(() => {

                // allow the final resource to be modified or validated before persisting
                this.onCreate(req, res, resource).then(() => {

                    manager.persist(resource);

                    manager.flush().then(() => {

                        res.return(
                            this.buildReturnData(req, res, resource),
                            201
                        );

                    }).catch((err) => {
                        console.trace(err);
                        //this.restManager.createInternalServerErrorResponse(res);

                        res.error();

                    });
                });

            }).catch((errors) => {
                console.log(errors);
            });

        }).catch((errors) => {

            console.trace(errors);

        });

    }

    /**
     * (PUT /:id)
     *
     * @param req
     * @param response
     */
    patch(req, res) {

        // make sure that there wasn't a problem parsing body
        if (req.body === null) {
            return this.restManager.createBadRequestResponse(res);
        }

         // get the bass manager
        const session = this.container.get('bass').createSession()
        const manager = this.getManagerForCurrentResource(session);

        // do any specification specific validation
        this.specification.validateRequest(req, this.resourceType).then(() => {

            manager.find(this.getModelNameForCurrentResource(), req.params.id).then((resource) => {

                const data = this.specification.deserializeRequestData(req, this.resourceType, this.getContext());

                // copy over attributes to resource
                let property;

                for (property in data.attributes) {
                    resource[property] = data.attributes[property];
                }

                // validate the model
                this.container.get('validator').validate(resource).then(() => {

                    // allow the final resource to be modified or validated before persisting
                    this.onUpdate(req, res, resource).then(() => {

                        manager.persist(resource);

                        manager.flush().then(() => {

                            res.return(
                                this.buildReturnData(req, res, resource),
                                201
                            );

                        }).catch((err) => {
                            console.trace(err);
                            //this.restManager.createInternalServerErrorResponse(res);

                            res.error();

                        });
                    });

                }).catch((errors) => {
                    console.log(errors);
                });


            }).catch((errors) => {
                console.trace(errors);
            });

        }).catch((errors) => {
            console.trace(errors);
        });

        // const manager = this.container.get('bass').createSession().getManagerForModelName(this.model);
        //
        // // make sure that there is a valid request body
        // if (req.body === null) {
        //     return this.restManager.createBadRequestResponse(res);
        // }
        //
        // // make sure that type in body matches current type
        // if (req.body.data.type !== this.resourceType) {
        //      return this.restManager.createConflictResponse(res);
        // }
        //
        //
        //
        //
        // manager.find(this.getModelNameForCurrentResource(), req.params.id).then((document) => {
        //
        //     // do some sort of permission check here
        //     // this.checkResourcePermissions(req, document, 'UPDATE').then().catch();
        //
        //
        //     if (document === null) {
        //         return this.restManager.createNotFoundResponse(res);
        //     }
        //
        //     // deserialize the request body in to the model
        //     document = this.restManager.deserializeInToObject(this.resourceType, document, req.body);
        //
        //     // refresh the document so that all relationships have values
        //     manager.refreshDocument(document, (err) => {
        //
        //         // validate the final document
        //         this.validator.validate(document, (err) => {
        //
        //             if (err) {
        //                 // return an error
        //                 return res.return(this.restManager.serializeErrors(error), 400);
        //             }
        //
        //             // save the document
        //             manager.persist(document);
        //
        //             manager.flush().then(() => {
        //                 res.return(this.restManager.serialize(document));
        //             }, function (err) {
        //                 this.restManager.createInternalServerErrorResponse(res);
        //             });
        //
        //         });
        //     });
        //
        // }, (err) => {
        //     this.restManager.createInternalServerErrorResponse(res);
        // });

    }

    /**
     * (DELETE /:id)
     *
     * @param req
     * @param response
     */
    delete(req, res) {

        // get the bass manager
        const session = this.container.get('bass').createSession()
        const manager = this.getManagerForCurrentResource(session);

        manager.find(this.getModelNameForCurrentResource(), req.params.id).then((resource) => {

            if (resource === null) {
                return this.restManager.createNotFoundResponse(res);
            }

            manager.remove(resource);

            manager.flush().then(() => {

                res.return(
                    this.buildReturnData(req, res, null),
                    200
                );

            }, (err) => {
                restManager.createInternalServerErrorResponse(res);
            });

        }, (err) => {

            restManager.createInternalServerErrorResponse(res);
        });
    }

    /**
     * Find the given relationship for a resource
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    getRelationship(req, res) {

        const manager = this.container.get('bass').createSession().getManagerForModelName(this.model);
        const mapping = this.restManager.getMappingForType(this.resourceType);

        // make sure that this is a valid relationship

        manager.find(this.model, req.params.id).then((document) => {

            if (document === null) {
                return this.restManager.createNotFoundResponse(res);
            }

            res.return(this.restManager.serialize(
                document[this.restManager.convertAttributeToProperty(this.resourceType, req.params.attribute)]
            ));

        }, function(err) {
            console.log(err);
            restManager.createInternalServerErrorResponse(res);
        });
    }

    /**
     * Update a resource's relationship
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    updateRelationship(req, res) {

        const session = this.container.get('bass').createSession();
        const manager = session.getManagerForModelName(this.model);
        const data = req.body.data;
        const mapping = this.restManager.getMappingForType(this.resourceType);
        const relationshipMapping = this.restManager.getRelationshipMappingByTypeAndAttribute(this.resourceType, req.params.attribute);
        const relationshipResourceMapping = this.restManager.getMappingForType(relationshipMapping.relatedType);


        manager.find(this.model, req.params.id).then((document) => {

            if (document === null) {

                res.return({ success : false });

            } else {

                if (relationshipMapping.type == 'many') {

                    const ids = [];

                    for (let i = 0; i < data.length; i++) {
                        ids.push(data[i].id);
                    }

                    const relationshipManager = session.getManagerForModelName(relationshipResourceMapping.proto.prototype.constructor.name);

                    relationshipManager.findWhereIn(relationshipResourceMapping.proto.prototype.constructor.name, 'id', ids, null, null).then((rels) => {

                        document[relationshipMapping.target] = rels;

                        manager.persist(document);

                        manager.flush().then(() => {
                            res.return(this.restManager.serialize(document[relationshipMapping.target]));
                        }, function(err){
                            console.log(err);
                        });

                    }, function(err){
                        console.log(err);
                    });

                } else if (mapping.type == 'one') {

                }
            }

        }, function(err){
            console.log(err);
        });
    }

    /**
     * Override this method to modify the bass query for the list action
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Query}    query
     * @return {Promise}
     */
    modifyListQuery(req, res, query) {
        return Promise.resolve();
    }

    /**
     * Override this method to modify the bass conditions for the find action
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   conditions
     * @return {Promise}
     */
    modifyFindConditions(req, res, conditions) {
        return Promise.resolve();
    }

    /**
     * Override this method to modify a new resource before it is persisted
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @return {Promise}
     */
    onCreate(req, res, resource) {
        return Promise.resolve();
    }

    /**
     * Override this method to modify a resource before it is updated
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @return {Promise}
     */
    onUpdate(req, res, resource) {
        return Promise.resolve();
    }

    /**
     * Override this method to modify a resource before it is removed
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @return {Promise}
     */
    onRemove(req, res, resource) {
        return Promise.resolve();
    }

    /**
     * Implement this to do any custom resource permission checks
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Object} resource
     * @param  {String} type      the action type (CREATE, UPDATE, GET)
     * @return {Promise}
     */
    checkResourcePermissions(req, res, resource, type) {
        return Promise.resolve();
    }

    /**
     * Parse the sorting from a request and apply to a bass Query
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Query}  query
     * @return {Object}
     */
    parseSortingIntoQuery(req, res, query) {
        const sort = this.parseSorting(req, res);
        query.sort(sort);
        return sort;
    }

    /**
     * Parse the pagination from a request and apply to a bass Query
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Query}  query
     * @return {Pager}
     */
    parsePaginationIntoQuery(req, res, query) {

        const pager = this.parsePagination(req, res);

        // check if pagination is enabled for controller
        if (this.isPaginationEnabled) {
            query.skip(pager.getOffset());
            query.limit(pager.getLimit());
            query.countFoundRows(true);
        }

        return pager;
    }

    /**
     * Parse the filters from a request and apply to a bass Query
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Query}  query
     * @return {FilterSet}
     */
    parseFilteringIntoQuery(req, res, query) {

        let filters;

        try {

            filters = this.parseFiltering(req, res);

            if (!filters.isEmpty()) {

                filters.map((filter, conjunction) => {

                    if (filter !== null) {

                        switch (filter.comparison) {

                            case Filter.LIKE:

                                const regex = new RegExp('^' + filter.value.replace('*', '.*'), 'i');

                                query.where(filter.property).regex(regex);

                                break;

                            case Filter.EQUALS:

                                query.where(filter.property).equals(filter.value);

                                break;

                            default:

                                query.where(filter.property)[filter.comparison](filter.value);

                                break;
                        }


                    }

                });
            }

            return filters;

        } catch (err) {

            res.error(err.message);

        }

    }

    getModelNameForResourceType(type) {

    }

    /**
     * Get the bass manager from a session based on the current resource type
     *
     * @param  {Session} session
     * @return {Manager}
     */
    getManagerForCurrentResource(session) {

        // console.log('============ RESOURCE ============');
        // console.log(this.resourceType);


        return session.getManager(
            this.resourceRegistry.getByType(this.resourceType).proto.prototype._BASS_MANAGER_NAME
        );
    }

    getModelNameForCurrentResource() {
        return this.resourceRegistry.getByType(this.resourceType).proto.prototype.__BASS__.METADATA.name;
    }
}
