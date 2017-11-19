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
const QueryError = require('../query/QueryError');
const RestController = require('./RestController');
const RestError = require('../rest/RestError');

/**
 * The BassRestController is the parent class for any REST controller which
 * should hook in to bass.js
 *
 * This controller provides all of the methods to automatically handle standard
 * REST operations.
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
        let pager;

        console.log('in list');

        // parse stuff from the query and catch QueryError(s) if there are parsing errors
        try {

            pager = this.parsePaginationIntoQuery(req, res, query);

            // add filters and sorting to the query
            this.parseFilteringIntoQuery(req, res, query);
            this.parseSortingIntoQuery(req, res, query);

        } catch (error) {

            if (error instanceof QueryError) {
                return this.sendBadRequestError(res, error);
            } else {
                return this.sendInternalServerError(res, error);
            }

        }

        // run modifyListQuery to allow the query to be modified
        this.modifyListQuery(req, res, query).then(() => {

            return manager.findByQuery(this.getModelNameForCurrentResource(), query);

        }).then((resources) => {

            return new Promise((resolve, reject) => {

                session.close();

                pager.setMaxResults(resources.totalRows);

                // send the final response
                return this.sendSuccessResponse(
                    req,
                    res,
                    resources.data,
                    pager,
                    200
                );

            });

        }).catch((error) => {
            return this.sendInternalServerError(res, error);
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

        this.modifyGetConditions(req, res, conditions).then(() => {

            return manager.findOneBy(this.getModelNameForCurrentResource(), conditions);

        }).then((resource) => {

            if (resource === null) {
                return this.sendResourceNotFoundError(res);
            }

            this.checkResourcePermissions(req, res, resource, 'GET').then(() => {

                return this.sendSuccessResponse(
                    req,
                    res,
                    resource,
                    null,
                    200
                );

            }).catch((error) => {
                return this.sendResourcePermissionError(res, error);
            });

        // handle error
        }).catch((error) => {
            return this.sendInternalServerError(res, error);
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

        // validate that body isn't empty or malformed
        if (this.validateRequestBody(req, res)) {
            return;
        }

         // get the bass manager
        const session = this.container.get('bass').createSession()
        const manager = this.getManagerForCurrentResource(session);

        // do any specification specific validation
        this.specification.validateRequest(req, this.resourceType).then(() => {

            const data = this.specification.deserializeRequestData(
                req,
                this.resourceType,
                this.getGroupContext()
            );

            if (Array.isArray(data)) {

                if (!this.isBulkEnabled) {

                    return this.sendBadRequestError(res, {
                        errors: [{
                            message: ''
                        }]
                    })
                }

                this.createMultiple(req, res, data, session, manager).then((resources) => {

                    manager.flush().then(() => {

                        const promises = [];

                        resources.forEach((resource) => {
                            promises.push(new Promise((resolve, reject) => {
                                this.onPostCreate(req, res, resource, session, manager).then(() => {
                                    resolve();
                                });
                            }));
                        });

                        Promise.all(promises).then(() => {

                            this.sendSuccessResponse(
                                req,
                                res,
                                resources,
                                null,
                                201
                            );

                        });

                    }).catch((error) => {
                        console.log(error);
                        return this.sendInternalServerError(res, error);
                    });

                });

            } else {

                this.createSingle(req, res, data, session, manager).then((resource) => {

                    manager.flush().then(() => {

                        return this.sendSuccessResponse(
                            req,
                            res,
                            resource,
                            null,
                            201
                        );

                    }).catch((error) => {
                        return this.sendInternalServerError(res, error);
                    });

                }).catch((err) => {

                })

            }

        }).catch((error) => {
            return this.sendSpecificationError(error);
        });
    }

    /**
     * Create multiple resources from a bulk POST request
     *
     * @param  {Object}  req
     * @param  {Object}  res
     * @param  {Array}   data
     * @param  {Session} session
     * @param  {Manager} manager
     * @return {Promise}
     */
    createMultiple(req, res, data, session, manager) {

        return new Promise((resolve, reject) => {

            const promises = [];

            data.forEach((resource) => {

                promises.push(new Promise((resolve, reject) => {
                    this.createSingle(req, res, resource, session, manager).then((resource) => {
                        resolve(resource);
                    })
                }));

            });

            Promise.all(promises).then((resources) => {
                resolve(resources);
            }, (err) => {
                reject(err);
            });

        });

    }

    /**
     * Create a single resource to be persisted
     *
     * @param  {Object}  req
     * @param  {Object}  res
     * @param  {Array}   data
     * @param  {Session} session
     * @param  {Manager} manager
     * @return {Promise}
     */
    createSingle(req, res, data, session, manager) {

        return new Promise((resolve, reject) => {

            // deserialize the request data to a resource model
            const resource = manager.createDocument(this.getModelNameForCurrentResource());

            // copy over attributes to resource
            let property;

            for (property in data.attributes) {
                resource[property] = data.attributes[property];
            }

            // attach any relationships
            this.attachRelationshipsToResource(req, res, session, resource, data.relationships, 'POST').then(() => {

                // validate the model
                this.container.get('validator').validate(resource).then(() => {

                    // allow the final resource to be modified or validated before persisting
                    this.onCreate(req, res, resource, session, manager).then(() => {

                        manager.persist(resource);
                        resolve(resource);

                    });

                }).catch((errors) => {
                    return this.sendResourceInvalidDataError(res, errors);
                });

            }).catch((error) => {
                console.log(error);
                // attached relationship error
            });

        });

    }

    /**
     * (PUT /:id)
     *
     * @todo - alias for patch() for now
     *
     * @param req
     * @param response
     */
    put(req, res) {
        return this.patch(req, res);
    }

    /**
     * (PATCH /:id)
     *
     * @param req
     * @param response
     */
    patch(req, res) {

        // validate that body isn't empty or malformed
        if (this.validateRequestBody(req, res)) {
            return;
        }

         // get the bass manager
        const session = this.container.get('bass').createSession()
        const manager = this.getManagerForCurrentResource(session);

        // do any specification specific validation
        this.specification.validateRequest(req, this.resourceType).then(() => {

            const data = this.specification.deserializeRequestData(
                req,
                this.resourceType,
                this.getGroupContext()
            );

            this.patchSingle(req, res, session, manager, data, req.params.id).then((resource) => {

                // allow the final resource to be modified or validated before persisting
                this.onUpdate(req, res, resource, session, manager).then(() => {

                    manager.persist(resource);

                    manager.flush().then(() => {

                        this.onPostUpdate(req, res, resource, session, manager).then(() => {

                            // send the final response
                            return this.sendSuccessResponse(
                                req,
                                res,
                                resource,
                                null,
                                200
                            );

                        });

                    // this
                    }).catch((error) => {
                        console.log('GOT IN TO THIS CATCH');
                        return this.sendInternalServerError(res, error);
                    });
                });

            });
        });
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

        this.deleteSingle(req, res, session, manager, req.params.id).then((resource) => {

            manager.flush().then(() => {

                this.onPostDelete(req, res, resource, session, manager).then(() => {

                    return this.sendSuccessResponse(
                        req,
                        res,
                        null,
                        null,
                        200
                    );

                });

            }).catch((error) => {
                return this.sendInternalServerError(res, error);
            });

        });
    }

    /**
     * Internal method to validate/queue a single resource to be deleted
     *
     * @param  {Object}  req
     * @param  {Object}  res
     * @param  {Session} session
     * @param  {Manager} manager
     * @param  {Mixed}   id
     * @return {Promise}
     */
    deleteSingle(req, res, session, manager, id) {

        return new Promise((resolve, reject) => {

            manager.find(this.getModelNameForCurrentResource(), id).then((resource) => {

                if (resource === null) {
                    return this.sendResourceNotFoundError(res);
                }

                this.checkResourcePermissions(req, res, resource, 'DELETE').then(() => {

                    this.onDelete(req, res, resource, session, manager).then(() => {

                        manager.remove(resource);

                        resolve(resource);

                    });

                }).catch((error) => {
                    return this.sendResourcePermissionError(res, error);
                });

            }).catch((error) => {
                return this.sendInternalServerError(res, error);
            });

        });
    }

    /**
     * Get the related resource(s)
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {void}
     */
    getRelatedResource(req, res) {
        return this.getRelationship(req, res);
    }

    /**
     * Find the given relationship for a resource
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {void}
     */
    getRelationship(req, res) {

        // get the bass manager
        const session = this.container.get('bass').createSession()
        const manager = this.getManagerForCurrentResource(session);

        manager.find(this.getModelNameForCurrentResource(), req.params.id).then((resource) => {

            if (resource === null) {
                return this.sendResourceNotFoundError(res);
            }

            if (typeof resource[req.params.attribute] === 'undefined') {
                return this.sendResourceNotFoundError(res);
            }

            this.checkResourcePermissions(req, res, resource, 'RELATIONSHIP').then(() => {

                // send the final response
                return this.sendSuccessResponse(
                    req,
                    res,
                    resource[req.params.attribute],
                    null,
                    200
                );

            }).catch((error) => {
                return this.sendResourcePermissionError(res, error);
            });

        }).catch((error) => {
            return this.sendInternalServerError(res, error);
        });
    }

    /**
     * Add a relationship
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    postRelationship(req, res) {
        return this.modifyRelationship(req, res, 'POST');
    }

    /**
     * Update a resource's relationship
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    patchRelationship(req, res) {
        return this.modifyRelationship(req, res, 'PATCH');
    }

    /**
     * Delete a resource's relationship
     *
     * @param  {Object} req
     * @param  {Object} res
     * @return {Void}
     */
    deleteRelationship(req, res) {
        return this.modifyRelationship(req, res, 'DELETE');
    }

    /**
     * The common method to deal with adding/updating/deleting relationships
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Object} action POST/PATCH/DELETE
     * @return {Void}
     */
    modifyRelationship(req, res, action) {

        // validate that body isn't empty or malformed
        if (this.validateRequestBody(req, res)) {
            return;
        }

         // get the bass manager
        const session = this.container.get('bass').createSession()
        const manager = this.getManagerForCurrentResource(session);

        // do any specification specific validation
        this.specification.validateRequest(req, this.resourceType).then(() => {

            // load the resource from db
            manager.find(this.getModelNameForCurrentResource(), req.params.id).then((resource) => {

                if (resource === null) {
                    return this.sendResourceNotFoundError(res);
                }

                // do any custom logic to check permissions to access resource
                this.checkResourcePermissions(req, res, resource, action + '_RELATIONSHIP').then(() => {

                    const data = this.specification.deserializeRequestData(
                        req,
                        this.resourceType,
                        this.getGroupContext()
                    );

                    // attach any relationships
                    this.attachRelationshipsToResource(req, res, session, resource, data.relationships, action).then(() => {

                        // validate the resource
                        this.container.get('validator').validate(resource).then(() => {

                            // allow the final resource to be modified or validated before persisting
                            this.onModifyRelationship(req, res, resource, data.relationships, action, session, manager).then(() => {

                                manager.persist(resource);

                                manager.flush().then(() => {

                                    this.onPostModifyRelationship(req, res, resource, data.relationships, action, session, manager).then(() => {

                                        // send the final response
                                        return this.sendSuccessResponse(
                                            req,
                                            res,
                                            resource[req.params.attribute],
                                            null,
                                            202
                                        );

                                    });

                                // this
                                }).catch((error) => {
                                    return this.sendInternalServerError(res, error);
                                });

                            // this
                            }).catch((error) => {
                                return this.sendInternalServerError(res, error);
                            });

                        // is
                        }).catch((errors) => {
                            return this.sendResourceInvalidDataError(res, errors);
                        });

                    }).catch((error) => {
                        // attached relationship error
                        return this.sendInternalServerError(res, error);
                    });

                // a
                }).catch((error) => {
                    return this.sendInternalServerError(res, error);
                });

            // pyramid
            }).catch((error) => {
                return this.sendResourcePermissionError(res, error);
            });

        }).catch((error) => {
            return this.sendInternalServerError(res, error);
        });

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

        // validate that body isn't empty or malformed
        if (this.validateRequestBody(req, res)) {
            return;
        }

         // get the bass manager
        const session = this.container.get('bass').createSession()
        const manager = this.getManagerForCurrentResource(session);

        // do any specification specific validation
        this.specification.validateRequest(req, this.resourceType).then(() => {

            const data = this.specification.deserializeRequestData(
                req,
                this.resourceType,
                this.getGroupContext()
            );

            const promises = [];

            data.forEach((d) => {

                promises.push(new Promise((resolve, reject) => {
                    this.patchSingle(req, res, session, manager, d, d.id).then((resource) => {
                        resolve(resource);
                    });
                }));

            });

            Promise.all(promises).then((resources) => {

                manager.flush().then(() => {

                    const promises = [];

                    resources.forEach((resource) => {
                        promises.push(new Promise((resolve, reject) => {
                            this.onPostUpdate(req, res, resource, session, manager).then(() => {
                                resolve();
                            });
                        }));
                    });

                    Promise.all(promises).then(() => {

                        // send the final response
                        this.sendSuccessResponse(
                            req,
                            res,
                            resources,
                            null,
                            200
                        );

                    });

                })

            }, (err) => {
                console.log(err);
                this.sendInternalServerError(res, err);
            });

        }).catch((error) => {
            return this.sendInternalServerError(res, error);
        });

    }

    /**
     * Internal method to validate/queue a single resource to be updated
     *
     * @param  {Object}  req
     * @param  {Object}  res
     * @param  {Session} session
     * @param  {Manager} manager
     * @param  {Mixed}   id
     * @return {Promise}
     */
    patchSingle(req, res, session, manager, data, id) {

        return new Promise((resolve, reject) => {

            // load the resource from db
            manager.find(this.getModelNameForCurrentResource(), id).then((resource) => {

                if (resource === null) {
                    return this.sendResourceNotFoundError(res);
                }

                // do any custom logic to check permissions to access resource
                this.checkResourcePermissions(req, res, resource, 'PATCH').then(() => {

                    // copy over attributes to resource
                    let property;

                    for (property in data.attributes) {
                        resource[property] = data.attributes[property];
                    }

                    // attach any relationships
                    this.attachRelationshipsToResource(req, res, session, resource, data.relationships).then(() => {

                        // validate the resource
                        this.container.get('validator').validate(resource).then(() => {

                            // allow the final resource to be modified or validated before persisting
                            this.onUpdate(req, res, resource, session, manager).then(() => {

                                manager.persist(resource);
                                resolve(resource);
                            });

                        // is
                        }).catch((errors) => {
                            return this.sendResourceInvalidDataError(res, errors);
                        });

                    }).catch((error) => {
                        return this.sendInternalServerError(res, error);
                    });

                // a
                }).catch((error) => {
                    this.sendResourcePermissionError(res, error);
                });

            // pyramid
            }).catch((error) => {
                return this.sendInternalServerError(res, error);
            });

        });
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

        // validate that body isn't empty or malformed
        if (this.validateRequestBody(req, res)) {
            return;
        }

         // get the bass manager
        const session = this.container.get('bass').createSession()
        const manager = this.getManagerForCurrentResource(session);

        // do any specification specific validation
        this.specification.validateRequest(req, this.resourceType).then(() => {

            const data = this.specification.deserializeRequestData(
                req,
                this.resourceType,
                this.getGroupContext()
            );

            const promises = [];

            data.forEach((d) => {

                promises.push(new Promise((resolve, reject) => {
                    this.deleteSingle(req, res, session, manager, d.id).then((resource) => {
                        resolve(resource);
                    });
                }));

            });

            Promise.all(promises).then((resources) => {

                manager.flush().then(() => {

                    const promises = [];

                    resources.forEach((resource) => {
                        promises.push(new Promise((resolve, reject) => {
                            this.onPostDelete(req, res, resource, session, manager).then(() => {
                                resolve();
                            });
                        }));
                    });

                    Promise.all(promises).then(() => {

                        // send the final response
                        this.sendSuccessResponse(
                            req,
                            res,
                            null,
                            null,
                            200
                        );

                    });

                });

            }, (err) => {
                console.log(err);
                this.sendInternalServerError(res, err);
            });

        }).catch((error) => {
            return this.sendInternalServerError(res, error);
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
    modifyGetConditions(req, res, conditions) {
        return Promise.resolve();
    }

    /**
     * Override this method to modify a new resource before it is persisted
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @param  {Session}  session
     * @param  {Manager}  manager
     * @return {Promise}
     */
    onCreate(req, res, resource, session, manager) {
        return Promise.resolve();
    }

    /**
     * Override this method to do something with a resource after it
     * has been created and persisted
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @param  {Session}  session
     * @param  {Manager}  manager
     * @return {Promise}
     */
    onPostCreate(req, res, resource, session, manager) {
        return Promise.resolve();
    }

    /**
     * Override this method to modify a resource before it is updated
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @param  {Session}  session
     * @param  {Manager}  manager
     * @return {Promise}
     */
    onUpdate(req, res, resource, session, manager) {
        return Promise.resolve();
    }

    /**
     * Override this method to do something after a resource
     * has been updated and persisted
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @param  {Session}  session
     * @param  {Manager}  manager
     * @return {Promise}
     */
    onPostUpdate(req, res, resource, session, manager) {
        return Promise.resolve();
    }

    /**
     * Override this method to modify a resource before it is deleted
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @param  {Session}  session
     * @param  {Manager}  manager
     * @return {Promise}
     */
    onDelete(req, res, resource, session, manager) {
        return Promise.resolve();
    }

    /**
     * Override this method to do something after a resource has been deleted
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @param  {Session}  session
     * @param  {Manager}  manager
     * @return {Promise}
     */
    onPostDelete(req, res, resource, session, manager) {
        return Promise.resolve();
    }

    /**
     * Override this method to modify a resource before it is updated
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @param  {Object}   relationships
     * @param  {String}   action
     * @param  {Session}  session
     * @param  {Manager}  manager
     * @return {Promise}
     */
    onModifyRelationship(req, res, resource, relationships, action, session, manager) {
        return Promise.resolve();
    }

    /**
     * Override this method to do something after a resource
     * has been updated and persisted
     *
     * @param  {Object}   req
     * @param  {Object}   req
     * @param  {Object}   resource
     * @param  {Object}   relationships
     * @param  {String}   action
     * @param  {Session}  session
     * @param  {Manager}  manager
     * @return {Promise}
     */
    onPostModifyRelationship(req, res, resource, relationships, action, session, manager) {
        return Promise.resolve();
    }

    /**
     * Implement this to do any custom resource permission checks
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Object} resource
     * @param  {String} method      the HTTP method
     * @return {Promise}
     */
    checkResourcePermissions(req, res, resource, method) {
        return Promise.resolve();
    }

    /**
     * Implement this method to check the permissions of a related resource
     * before it is persisted on the given resource
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Object} resource
     * @param  {Object} relatedResource
     * @return {Promise}
     */
    checkRelatedResourcePermissions(req, res, resource, relatedResource, property) {
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

    /**
     * Get the bass manager from a session based on the current resource type
     *
     * @param  {Session} session
     * @return {Manager}
     */
    getManagerForCurrentResource(session) {
        return this.getManagerForResourceType(session, this.resourceType);
    }

    /**
     * Get the bass manager from a session based on the current resource type
     *
     * @param  {Session} session
     * @param  {String}  type
     * @return {Manager}
     */
    getManagerForResourceType(session, type) {
        return session.getManager(
            this.resourceRegistry.getByType(type).proto.prototype._BASS_MANAGER_NAME
        );
    }

    /**
     * Get the model name for the current resource
     *
     * @todo - not sure if this is really needed anymore
     *
     * @return {String}
     */
    getModelNameForCurrentResource() {
        return this.getModelNameForResourceType(this.resourceType);
    }

    /**
     * Get the model name for a resource type
     *
     * @param  {String} type
     * @return {String}
     */
    getModelNameForResourceType(type) {
        return this.resourceRegistry.getByType(type).proto.prototype.__BASS__.METADATA.name;
    }

    /**
     * Load / validate relationships from incoming request data and attach or remove from a resource
     *
     * @param  {Object}  req           the request
     * @param  {Object}  res           the response
     * @param  {Session} session       the bass session
     * @param  {Object}  resource      the resource model object
     * @param  {Object}  relationships object of relationship data from request
     * @param  {String}  action        the action (POST, PATCH, DELETE)
     * @return {Promise}
     */
    attachRelationshipsToResource(req, res, session, resource, relationships, action) {

        return new Promise((resolve, reject) => {

            const promises = [];

            // many
            if (typeof relationships.many !== 'undefined' && Object.keys(relationships.many).length > 0) {

                for (let i in relationships.many) {

                    if (relationships.many[i].data.length > 0) {

                        const ids = [];

                        relationships.many[i].data.forEach((rel) => {
                            ids.push(rel.id);
                        });

                        promises.push(new Promise((resolve, reject) => {

                            const manager = this.getManagerForResourceType(
                                session,
                                relationships.many[i].mapping.relatedType
                            );

                            manager.findWhereIn(this.getModelNameForResourceType(relationships.many[i].mapping.relatedType), 'id', ids).then((docs) => {

                                switch (action) {

                                    case 'PATCH':

                                        const existing = resource[i].map((doc) => { return doc.id });

                                        docs.forEach((doc) => {
                                            if (!existing.includes(doc.id)) {
                                                resource[i].push(doc);
                                            }
                                        })

                                        break;

                                    case 'POST':

                                        resource[i] = docs;
                                        break;

                                    case 'DELETE':

                                        resource[i] = [];
                                        break;
                                }

                                docs.forEach((doc) => {
                                    promises.push(new Promise((resolve, reject) => {
                                        this.checkRelatedResourcePermissions(
                                            req,
                                            res,
                                            resource,
                                            doc,
                                            i
                                        );
                                    }));
                                });

                                resolve();
                            }).catch((err) => {
                                reject(err);
                            });

                        }));

                    } else {

                        resource[i] = [];
                    }

                }

            }

            // one
            if (typeof relationships.one !== 'undefined' && Object.keys(relationships.one).length > 0) {

                for (let i in relationships.one) {

                    if (relationships.one[i].data !== null) {

                        promises.push(new Promise((resolve, reject) => {

                            const manager = this.getManagerForResourceType(
                                session,
                                relationships.one[i].mapping.relatedType
                            );

                            manager.find(this.getModelNameForResourceType(
                                relationships.one[i].mapping.relatedType),
                                relationships.one[i].data.id
                            ).then((doc) => {

                                switch (action) {

                                    case 'PATCH':
                                    case 'POST':

                                        resource[i] = doc;
                                        break;

                                    case 'DELETE':

                                        resource[i] = null;
                                        break;
                                }

                                promises.push(new Promise((resolve, reject) => {
                                    this.checkRelatedResourcePermissions(
                                        req,
                                        res,
                                        resource,
                                        doc,
                                        i
                                    );
                                }));

                                resolve();

                            }).catch((err) => {
                                reject(err);
                            });

                        }));

                    } else {

                        resource[i] = null;
                    }
                }
            }

            Promise.all(promises).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });

    }
}
