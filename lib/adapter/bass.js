/*
 * This file is part of the conga-bass library.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var BassAdapter = function(container, type, controller, isPaginationEnabled, defaultLimit, options){

	this.container = container;
	this.model = options.model;
	this.type = type;
	this.controller = controller;
	this.documentManager = options.documentManager;
	this.restModifyCriteriaMethods = [];
	this.isPaginationEnabled = isPaginationEnabled;
	this.defaultLimit = defaultLimit;

	this.restManager = container.get('rest.manager');

	// copy stuff over to the real controller to use
	this.controller.model = this.model;
	this.controller.type = this.type;
	this.controller.restManager = this.restManager;
	this.controller.container = this.container;
};

BassAdapter.prototype = {
	
	/**
	 * The model that this controller is tied to
	 * 
	 * @var {String}
	 */
	model: null,
	
	/**
	 * The document manager name to use for the current model
	 *
	 * @var {String
	 */
	documentManager: null,
	
	/**
	 * (GET /)
	 * 
	 * @param req
	 * @param response
	 */
	findAll: function(req, res){

		var container = this.container;
		var restManager = this.container.get('rest.manager');
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		var model = this.model;
		var type = this.type;

		// create a new Bass Query
		var query = manager.createQuery();

		// try to get sort parameter if it was passed in
		var sortParam = req.query[this.container.getParameter('rest.parameters').SORT];
		var sort;

		// build the sort criteria
		// sort = -id,createdAt,-name
		if (typeof sortParam !== 'undefined'){
			var splits = sortParam.split(',');
			var attribute;
			sort = {};
			for (var i=0, j=splits.length; i<j; i++){
				if (splits[i][0] === '-'){
					attribute = restManager.convertAttributeToProperty(type, splits[i].replace(/-/, ''));

					if (attribute === null){
						// throw error
					}

					sort[attribute] = -1;
				} else {
					attribute = restManager.convertAttributeToProperty(type, splits[i]);

					if (attribute === null){

						// throw error
					}

					sort[attribute] = 1;
				}
			}
		}

		// add sorting to query
		if (typeof sort !== 'undefined') query.sort(sort);

		// filtering
		var filter = req.query.filter;

		if (typeof filter !== 'undefined') {





		}

		// check if pagination is enabled for controller
		if (this.isPaginationEnabled){

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

		// function to find documents
		var find = function(count){

			try {

				manager.findByQuery(model, query).then(function(documents){

//console.log(documents);

					// get the pagination info for the serializer
					var pagination = restManager.paginationBuilder.buildPaginationInfo(req, offset, limit, count);

					// get related include
					var includes = req.query.include;

					if (typeof includes !== 'undefined'){
						includes = includes.split(',');
						for (var i=0; i<includes.length; i++){
							includes[i] = includes[i].split('.');
						}
					} else {
						includes = null;
					}

					// get sparse fields
					var sparseFields = req.query.fields;

					if (typeof sparseFields !== 'undefined'){
						for (var i in sparseFields){
							sparseFields[i] = sparseFields[i].split(',');
						}
					} else {
						sparseFields = null;
					}

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
				function(err){
					cb(err);
				});

			} catch (err){
				cb(err);
			}
		};

		// function to find total count of documents based on query
		var findTotalCount = function(cb){

			manager.findCountByQuery(model, query).then(function(count){

				try {
					cb(null, count);
				} catch (err) {
					cb(err);
				}
			},
			function(err){
				cb(err);
			});
		};

		// run logic when there is pagination enabled
		if (this.isPaginationEnabled){

			findTotalCount(function(err, count){

				if (err){

					container.get('logger').error(err.stack);
					res.return(restManager.createInternalServerError());

				} else {

					find(count);
				}
			});

		} else {

			// run logic without pagination
			find();
		}
	},
	
	/**
	 * (GET /:id)
	 * 
	 * @param req
	 * @param response
	 */
	find: function(req, res) {

		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		var restManager = this.restManager;
		var model = this.model;

		this.runProxy('find', req, res, function() {

			manager.find(model, req.params.id).then(function(document) {

				if (document === null) {
					return restManager.createNotFoundResponse(res);
				}

				res.return(restManager.serialize(document));
			
			// handle error
			}, function(err) {
				restManager.createInternalServerErrorResponse(res);
			});
		});
	},
	
	/**
	 * (POST /)
	 * 
	 * @param req
	 * @param response
	 */
	create: function(req, res) {

	 	// get the bass manager
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		var restManager = this.restManager;
		var container = this.container;
		var type = this.type;
		var controller = this.controller;

		this.runProxy('create', req, res, function() {

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
			var errors = container.get('validator').validate(resource);

			if (errors.length > 0) {

				return restManager.createUnprocessableEntityResponse(res, errors);

			} else {

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
			}
		});
	},
	
	/**
	 * (PUT /:id)
	 * 
	 * @param req
	 * @param response
	 */
	update: function(req, res) {

		var restManager = this.restManager;
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
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

		this.runProxy('update', req, res, function() {

			manager.find(model, req.params.id).then(function(document) {

				if (document === null) {
					return restManager.createNotFoundResponse(res);
				}

				// deserialize the request body in to the model
				document = restManager.deserializeInToObject(type, document, req.body);

				// refresh the document so that all relationships have values
				manager.refreshDocument(document, function(err) {

					// validate the final document
					var errors = validator.validate(document);

					// check if there were any validation errors
					if (errors.length > 0) {

						// return an error
						res.return(restManager.serializeErrors(error), 400);

					} else {

						// save the document
						manager.persist(document);

						manager.flush().then(function() {
							res.return(restManager.serialize(document));
						}, function (err) {
							restManager.createInternalServerErrorResponse(res);
						});			
					}
				});

			}, function(err) {
				restManager.createInternalServerErrorResponse(res);
			});
		});
	},
	
	/**
	 * (DELETE /:id)
	 * 
	 * @param req
	 * @param response
	 */
	remove: function(req, res) {

		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
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
	},

	/**
	 * Find the given relationship for a resource
	 * 
	 * @param  {Object} req
	 * @param  {Object} res
	 * @return {Void}
	 */
	findRelationship: function(req, res){

		var restManager = this.restManager;
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		
		// make sure that this is a valid relationship


		manager.find(this.model, req.params.id).then(function(document){

			if (document === null) {
				return restManager.createNotFoundResponse(res);
			}

			res.return(restManager.serialize(document[req.params.attribute]));

		}, function(err){
			restManager.createInternalServerErrorResponse(res);
		});	
	},

	/**
	 * Update a resource's relationship
	 * 
	 * @param  {Object} req
	 * @param  {Object} res
	 * @return {Void}
	 */
	updateRelationship: function(req, res){

		var restManager = this.restManager;
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);

		var data = req.body.data;
		var mapping = restManager.getMappingForType(this.type);
		var relationshipMapping = restManager.getRelationshipMappingByTypeAndAttribute(this.type, req.params.attribute);
		var relationshipResourceMapping = restManager.getMappingForType(relationshipMapping.relatedType);


		manager.find(this.model, req.params.id).then(function(document){

			console.log('found document');
			//console.log(document);

			if (document === null){

				res.return({ success : false });

			} else {

				console.log('check type');

				console.log(relationshipMapping);

				if (relationshipMapping.type == 'many'){

					console.log('is many');

					var ids = [];

					for (var i = 0; i < data.length; i++){
						ids.push(data[i].id);
					}

					manager.findWhereIn(relationshipResourceMapping.proto.prototype.constructor.name, 'id', ids, null, null).then(function(rels){
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





				} else if (mapping.type == 'one'){



				}

			}

		}, function(err){
			console.log(err);
		});	

	},

	/**
	 * Try to run given action on the internal controller if it exists, otherwise 
	 * callback to the method in here
	 * 
	 * @param  {String}   action
	 * @param  {Object}   req
	 * @param  {Object}   res
	 * @param  {Function} cb 
	 * @return {void}
	 */
	runProxy: function(action, req, res, cb){
		if (typeof this.controller[action] !== 'undefined'){
			this.controller[action](req, res);
		} else {
			cb();
		}
	}
};

module.exports = BassAdapter;