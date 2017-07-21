/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

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

        this.defaultSort = {referenceId: 1};

        const container = this.container;
        const bassSession = this.container.get('bass').createSession();
        const manager = bassSession.getManagerForModelName(this.model);

        const model = this.model;
        const type = this.resourceType;

        const filter = this.specification.parseFiltering(req, res);
        const pagination = this.specification.parsePagination(req, res);

        // create a new Bass Query
        const query = manager.createQuery();

        // // get sorting criteria
        // let sort = null;
        //
        // try {
        //     sort = this.getSort(req, res);
        // } catch (err) {
        //     // invalid attribute provided
        //     return restManager.createBadRequestResponse(res);
        // }
        //
        // // add sorting to query
        // if (sort !== null) query.sort(sort);
        query.sort(this.parseSorting(req, res));
        // filtering
        // let filter = null;
        //
        // try {
        //     filter = this.getFilter(req, res);
        // } catch (err) {
        //     // invalid attribute provided
        //     return restManager.createBadRequestResponse(res);
        // }
        //
        // if (filter !== null) {
        //
        // }

        // set defaults
        let offset = 0;
        let limit = this.defaultLimit;

        // check if pagination is enabled for controller
        if (this.isPaginationEnabled) {

            // // get offset and limit from the request
            // const offsetAndLimitInfo = restManager.paginationBuilder.getOffsetAndLimitInfoFromRequest(req);
            //
            // // get offset and limit if they exist
            // if (offsetAndLimitInfo.offset !== null) offset = offsetAndLimitInfo.offset;
            // if (offsetAndLimitInfo.limit !== null) limit = offsetAndLimitInfo.limit;

            // add pagination
            query.skip(offset);
            query.limit(limit);
        }

        if (this.isPaginationEnabled) {
            query.countFoundRows(true);
        }

        // run onBuildListQuery to allow the query to be modified
        this.onBuildListQuery(req, res, query, () => {

            manager.findByQuery(model, query).then((documents) => {

                // get the pagination info for the serializer
                //const pagination = restManager.paginationBuilder.buildPaginationInfo(req, offset, limit, documents.totalRows);

                // get related include
                try {
                    var includes = this.getInclude(req, res);
                } catch (err) {
                    // invalid attribute provided
                    return restManager.createBadRequestResponse(res);
                }

                // get sparse fields
                try {

                    var sparseFields = this.getSparseFields(req, res);

                } catch (err) {
                    // invalid attribute provided
                    return restManager.createBadRequestResponse(res);
                }

                bassSession.close();

                try {

                    res.return({
                        type: type,
                        data: documents.data,
                        //pagination: pagination,
                        includes: includes,
                        sparseFields: sparseFields
                    });

                } catch (err) {

                    container.get('logger').error(err.stack);
                    res.return(restManager.createInternalServerError());

                }

            },
            function(err) {
                container.get('logger').error(err.stack);
                res.return(restManager.createInternalServerError());
            });

        });
    }

    /**
     * (GET /:id)
     *
     * @param req
     * @param response
     */
    find(req, res) {

        const manager = this.container.get('bass').createSession().getManagerForModelName(this.model);
        const restManager = this.restManager;

        manager.find(this.model, req.params.id).then((document) => {

            if (document === null) {
                return restManager.createNotFoundResponse(res);
            }

            // return final serialized response
            res.return({
                data: document
            });

        // handle error
        }, (err) => {
            this.container.get('logger').error(err.stack);
            restManager.createInternalServerErrorResponse(res);
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
    create(req, res) {

         // get the bass manager
        const manager = this.container.get('bass').createSession().getManagerForModelName(this.model);

        // do any specification specific validation
        this.specification.validateRequest(req, this.resourceType).then(() => {

            // deserialize the request data to a resource model
            const resource = manager.createDocument(this.model);
            this.specification.deserializeRequestInToObject(req, resource);

            // validate the model
            this.container.get('validator').validate(resource).then(() => {

                // allow the final resource to be modified before persisting
                this.onCreate(req, res, resource).then(() => {

                    manager.persist(resource);

                    manager.flush().then(() => {

                        res.return({
                            data: resource,
                            includes: null,
                            sparseFields: null
                        });

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




     //     // make sure that there wasn't a problem parsing body
     //     if (req.body === null) {
     //         return this.restManager.createBadRequestResponse(res);
     //     }
        //
        // // make sure that type in body matches current type
        // if (req.body.data.type !== this.resourceType) {
     //         return this.restManager.createConflictResponse(res);
        // }

    //     const resource = manager.createDocument(this.model);
    //
    //     // deserialize the data to a model
    //     this.restManager.deserializeInToObject(this.resourceType, resource, req.body);
    //
    //     // validate the model
    //     this.container.get('validator').validate(resource, (err) => {
    //
    //         if (err) {
    //             return this.restManager.createUnprocessableEntityResponse(res, err);
    //         }
    //
    //         // allow the final resource to be modified before persisting
    //         this.onCreate(req, res, resource, () => {
    //
    //             manager.persist(resource);
    //
    //             manager.flush().then(() => {
    //                 this.restManager.createCreatedResponse(res, resource);
    //             }, (err) => {
    //                 this.restManager.createInternalServerErrorResponse(res);
    //             });
    //         });
    //     });
    // }

    /**
     * (PUT /:id)
     *
     * @param req
     * @param response
     */
    update(req, res) {

        const manager = this.container.get('bass').createSession().getManagerForModelName(this.model);

        // make sure that there is a valid request body
        if (req.body === null) {
            return this.restManager.createBadRequestResponse(res);
        }

        // make sure that type in body matches current type
        if (req.body.data.type !== this.resourceType) {
             return this.restManager.createConflictResponse(res);
        }




        manager.find(this.model, req.params.id).then((document) => {

            // do some sort of permission check here
            // this.checkResourcePermissions(req, document, 'UPDATE').then().catch();


            if (document === null) {
                return this.restManager.createNotFoundResponse(res);
            }

            // deserialize the request body in to the model
            document = this.restManager.deserializeInToObject(this.resourceType, document, req.body);

            // refresh the document so that all relationships have values
            manager.refreshDocument(document, (err) => {

                // validate the final document
                this.validator.validate(document, (err) => {

                    if (err) {
                        // return an error
                        return res.return(this.restManager.serializeErrors(error), 400);
                    }

                    // save the document
                    manager.persist(document);

                    manager.flush().then(() => {
                        res.return(this.restManager.serialize(document));
                    }, function (err) {
                        this.restManager.createInternalServerErrorResponse(res);
                    });

                });
            });

        }, (err) => {
            this.restManager.createInternalServerErrorResponse(res);
        });

    }

    /**
     * (DELETE /:id)
     *
     * @param req
     * @param response
     */
    remove(req, res) {

        const manager = this.container.get('bass').createSession().getManagerForModelName(this.model);

        manager.find(this.model, req.params.id).then((document) => {

            if (document === null) {
                return this.restManager.createNotFoundResponse(res);
            }

            manager.remove(document);

            manager.flush().then(() => {

                res.return(this.restManager.serialize(null));

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
    findRelationship(req, res) {

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
     * @param  {Function} cb
     * @return {void}
     */
    onBuildListQuery(req, res, query, cb) {
        cb();
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

    onUpdate(req, res, resource, cb) {
        return Promise.resolve();
    }

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

}
