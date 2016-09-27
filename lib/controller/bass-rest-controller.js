const RestController = require('./rest-controller');

module.exports = class BassRestController extends RestController {

	/**
	 * (GET /)
	 * 
	 * @param req
	 * @param response
	 */
	list(req, res) {

		var self = this;
		var container = this.container;
		var restManager = this.container.get('rest.manager');
		var bassSession = this.container.get('bass').createSession();
		var manager = bassSession.getManagerForModelName(this.model);

		var model = this.model;
		var type = this.resourceType;

		// create a new Bass Query
		var query = manager.createQuery();
		
		// get sorting criteria
		try {
			var sort = this.getSort(req, res);
		} catch (err) {
			// invalid attribute provided
			return restManager.createBadRequestResponse(res);
		}

		// add sorting to query
		if (sort !== null) query.sort(sort);

		// filtering
		try {
			var filter = this.getFilter(req, res);
		} catch (err) {
			// invalid attribute provided
			return restManager.createBadRequestResponse(res);
		}

		if (filter !== null) {

		}

		// check if pagination is enabled for controller
		if (this.isPaginationEnabled) {

			// set defaults
			var offset = 0;
			var limit = this.defaultLimit;

			// get offset and limit from the request
			var offsetAndLimitInfo = restManager.paginationBuilder.getOffsetAndLimitInfoFromRequest(req);

			// get offset and limit if they exist
			if (offsetAndLimitInfo.offset !== null) offset = offsetAndLimitInfo.offset;
			if (offsetAndLimitInfo.limit !== null) limit = offsetAndLimitInfo.limit;

			// add pagination
			query.skip(offset);
			query.limit(limit);
		}

		if (this.isPaginationEnabled) {
			query.countFoundRows(true);
		}

		// run onBuildListQuery to allow the query to be modified
		this.onBuildListQuery(req, res, query, () => {

			manager.findByQuery(model, query).then(function(documents) {

				// get the pagination info for the serializer
				var pagination = restManager.paginationBuilder.buildPaginationInfo(req, offset, limit, documents.totalRows);

				// get related include
				try {
					var includes = self.getInclude(req, res);
				} catch (err) {
					// invalid attribute provided
					return restManager.createBadRequestResponse(res);
				}

				// get sparse fields
				try {
					var sparseFields = self.getSparseFields(req, res);
				} catch (err) {
					// invalid attribute provided
					return restManager.createBadRequestResponse(res);
				}

				bassSession.close();

				// build and return the final response
				res.return(restManager.serializeListResponse(
					type,
					documents.data,
					pagination,
					includes,
					sparseFields,
					req
				)); 
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
			res.return(restManager.serializeSingleResponse(
				this.resourceType,
				document,
				this.getInclude(req, res),
				this.getSparseFields(req, res),
				req
			));
		
		// handle error
		}, (err) => {
			self.container.get('logger').error(err.stack);
			restManager.createInternalServerErrorResponse(res);
		});
	}
	
	/**
	 * (POST /)
	 * 
	 * @param req
	 * @param response
	 */
	create(req, res) {

	 	// get the bass manager
		const manager = this.container.get('bass').createSession().getManagerForModelName(this.model);

 		// make sure that there wasn't a problem parsing body
 		if (req.body === null) {
 			return this.restManager.createBadRequestResponse(res);
 		}

		// make sure that type in body matches current type
		if (req.body.data.type !== this.resourceType) {
 			return this.restManager.createConflictResponse(res);
		}

		const resource = manager.createDocument(this.model);

		// deserialize the data to a model
		this.restManager.deserializeInToObject(this.resourceType, resource, req.body);
 
		// validate the model
		this.container.get('validator').validate(resource, (err) => {

			if (err) {

				return this.restManager.createUnprocessableEntityResponse(res, err);
			}

			// allow the final resource to be modified before persisting
			this.onCreate(req, res, resource, () => {

				manager.persist(resource);

				manager.flush().then(() => {
					this.restManager.createCreatedResponse(res, resource);
				}, (err) => {
					this.restManager.createInternalServerErrorResponse(res);
				});	
			});
		});
	}
	
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
		
		// make sure that this is a valid relationship


		manager.find(this.model, req.params.id).then((document) => {

			if (document === null) {
				return this.restManager.createNotFoundResponse(res);
			}

			res.return(this.restManager.serialize(document[req.params.attribute]));

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

					var ids = [];

					for (var i = 0; i < data.length; i++) {
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
	 * @param  {Function} cb
	 * @return {void}
	 */
	onCreate(req, res, resource, cb) {
		cb();
	}

}