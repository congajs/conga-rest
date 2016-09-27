/*
 * This file is part of the conga-bass library.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const BaseAdapter = require('./base-adapter');

module.exports = class BassAdapter extends BaseAdapter {

	/**
	 * (GET /)
	 * 
	 * @param req
	 * @param response
	 */
	findAll(req, res) {

		var self = this;
		var container = this.container;
		var restManager = this.container.get('rest.manager');
		var bassSession = this.container.get('bass').createSession();
		var manager = bassSession.getManagerForModelName(this.model);

		var model = this.model;
		var type = this.type;

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

	}
	
	/**
	 * (GET /:id)
	 * 
	 * @param req
	 * @param response
	 */
	find(req, res) {

		var self = this;
		var manager = this.container.get('bass').createSession().getManagerForModelName(this.model);
		var restManager = this.restManager;
		var model = this.model;
		var type = this.type;

		manager.find(model, req.params.id).then(function(document) {

			if (document === null) {
				return restManager.createNotFoundResponse(res);
			}

			// get related include
			var includes = self.getInclude(req, res);

			// get sparse fields
			var sparseFields = self.getSparseFields(req, res);

			// return final serialized response
			res.return(restManager.serializeSingleResponse(
				type,
				document,
				includes,
				sparseFields,
				req
			));
		
		// handle error
		}, function(err) {
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
		var manager = this.container.get('bass').createSession().getManagerForModelName(this.model);
		var restManager = this.restManager;
		var container = this.container;
		var type = this.type;
		var controller = this.controller;

 		// make sure that there wasn't a problem parsing body
 		if (req.body === null) {
 			return restManager.createBadRequestResponse(res);
 		}

		// make sure that type in body matches current type
		if (req.body.data.type !== type) {
 			return restManager.createConflictResponse(res);
		}

		// deserialize the data to a model
		var resource = restManager.deserialize(type, req.body);
 
		// validate the model
		container.get('validator').validate(resource, function(err) {

			if (err) {

				return restManager.createUnprocessableEntityResponse(res, err);
			}

			var finish = function() {

				manager.persist(resource);

				manager.flush().then(function() {
					restManager.createCreatedResponse(res, resource);
				}, function(err) {
					restManager.createInternalServerErrorResponse(res);
				});	
			};

			// check if there is a onCreate method in controller
			if (typeof controller['onCreate'] !== 'undefined') {
				controller['onCreate'](req, res, resource, function() {
					finish();
				});
			} else {
				finish();
			}

		});
	}
	
	/**
	 * (PUT /:id)
	 * 
	 * @param req
	 * @param response
	 */
	update(req, res) {

		var restManager = this.restManager;
		var manager = this.container.get('bass').createSession().getManagerForModelName(this.model);
		var validator = this.container.get('validator');
		var type = this.type;
		var model = this.model;

		// make sure that there is a valid request body
		if (req.body === null) {
			return restManager.createBadRequestResponse(res);
		}

		// make sure that type in body matches current type
		if (req.body.data.type !== type) {
 			return restManager.createConflictResponse(res);
		}


		manager.find(model, req.params.id).then(function(document) {

			if (document === null) {
				return restManager.createNotFoundResponse(res);
			}

			// deserialize the request body in to the model
			document = restManager.deserializeInToObject(type, document, req.body);

			// refresh the document so that all relationships have values
			manager.refreshDocument(document, function(err) {

				// validate the final document
				validator.validate(document, function(err) {

					if (err) {
						// return an error
						return res.return(restManager.serializeErrors(error), 400);
					}

					// save the document
					manager.persist(document);

					manager.flush().then(function() {
						res.return(restManager.serialize(document));
					}, function (err) {
						restManager.createInternalServerErrorResponse(res);
					});	

				});
			});

		}, function(err) {
			restManager.createInternalServerErrorResponse(res);
		});

	}
	
	/**
	 * (DELETE /:id)
	 * 
	 * @param req
	 * @param response
	 */
	remove(req, res) {

		var manager = this.container.get('bass').createSession().getManagerForModelName(this.model);
		var restManager = this.restManager;

		manager.find(this.model, req.params.id).then(function(document) {

			if (document === null) {
				return restManager.createNotFoundResponse(res);
			}

			manager.remove(document);

			manager.flush().then(function() {

				res.return(restManager.serialize(null));

			}, function(err) {
				restManager.createInternalServerErrorResponse(res);
			});

		}, function(err) {

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

		var restManager = this.restManager;
		var manager = this.container.get('bass').createSession().getManagerForModelName(this.model);
		
		// make sure that this is a valid relationship


		manager.find(this.model, req.params.id).then(function(document) {

			if (document === null) {
				return restManager.createNotFoundResponse(res);
			}

			res.return(restManager.serialize(document[req.params.attribute]));

		}, function(err) {
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

		var restManager = this.restManager;
		var manager = this.container.get('bass').createSession().getManagerForModelName(this.model);

		var data = req.body.data;
		var mapping = restManager.getMappingForType(this.type);
		var relationshipMapping = restManager.getRelationshipMappingByTypeAndAttribute(this.type, req.params.attribute);
		var relationshipResourceMapping = restManager.getMappingForType(relationshipMapping.relatedType);


		manager.find(this.model, req.params.id).then(function(document) {

			if (document === null) {

				res.return({ success : false });

			} else {

				console.log('check type');

				console.log(relationshipMapping);

				if (relationshipMapping.type == 'many') {

					console.log('is many');

					var ids = [];

					for (var i = 0; i < data.length; i++) {
						ids.push(data[i].id);
					}

					manager.findWhereIn(relationshipResourceMapping.proto.prototype.constructor.name, 'id', ids, null, null).then(function(rels) {
						//console.log(rels);

						console.log('got relations');


						document[relationshipMapping.target] = rels;

						console.log('about to persist');

						manager.persist(document);

						console.log('about to flush');

						manager.flush().then(function(){

							console.log('flushed');


							res.return(restManager.serialize(document[relationshipMapping.target]));
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


};
