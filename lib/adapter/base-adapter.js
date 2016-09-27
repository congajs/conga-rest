module.exports = class BaseAdapter {

	constructor(container, model, type, isPaginationEnabled, defaultLimit, options) {

		this.container = container;
		this.model = model;
		this.type = type;
		this.isPaginationEnabled = isPaginationEnabled;
		this.defaultLimit = defaultLimit;
		this.maxLimit = 1000;

		this.restManager = container.get('rest.manager');
	}

	/**
	 * Get all of the resources
	 * 
	 * (GET /)
	 * 
	 * @param req
	 * @param response
	 */
	findAll(req, res) {
		throw new Error('You must implement findAll() in your REST adapter');
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
		throw new Error('You must implement find() in your REST adapter');
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
		throw new Error('You must implement create() in your REST adapter');
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
		throw new Error('You must implement update() in your REST adapter');
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
		throw new Error('You must implement remove() in your REST adapter');
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
		throw new Error('You must implement findRelationship() in your REST adapter');
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
	updateRelationship(req, res) {
		throw new Error('You must implement updateRelationship() in your REST adapter');
	}

	/**
	 * Try to get sort criteria from request
	 * 
	 * @param  {Object} req
	 * @return {Object}
	 */
	getSort(req, res) {

		var restManager = this.restManager;

		// try to get sort parameter if it was passed in
		var sortParam = req.query[this.container.getParameter('rest.parameters').SORT];
		var sort = null;

		// build the sort criteria
		// sort = -id,createdAt,-name
		if (typeof sortParam !== 'undefined') {

			var splits = sortParam.split(',');
			var attribute;
			sort = {};

			for (var i=0, j=splits.length; i<j; i++) {

				if (splits[i][0] === '-') {

					attribute = restManager.convertAttributeToProperty(this.type, splits[i].replace(/-/, ''));

					if (attribute === null) {
						throw new Error("Invalid attribute: " + splits[i].replace(/-/, ''));
					}

					sort[attribute] = -1;

				} else {

					attribute = restManager.convertAttributeToProperty(this.type, splits[i]);

					if (attribute === null) {
						throw new Error("Invalid attribute: " + splits[i]);
					}

					sort[attribute] = 1;
				}
			}
		}

		return sort;
	}

	/**
	 * Try to parse out the sparse fields from the request
	 * 
	 * @param  {Object} req
	 * @return {Object}
	 */
	getSparseFields(req, res) {

		var sparseFields = req.query[this.container.getParameter('rest.parameters').SPARSE_FIELDS];

		if (typeof sparseFields !== 'undefined') {
			for (var i in sparseFields) {
				sparseFields[i] = sparseFields[i].split(',');
			}
		} else {
			sparseFields = null;
		}

		return sparseFields;
	}

	/**
	 * Try to parse out the include parameter from the request
	 * 
	 * @param  {Object} req
	 * @param  {Object} res
	 * @return {Object}
	 */
	getInclude(req, res) {

		var includes = req.query[this.container.getParameter('rest.parameters').INCLUDE];

		if (typeof includes !== 'undefined') {
			includes = includes.split(',');
			for (var i=0; i<includes.length; i++) {
				includes[i] = includes[i].split('.');
			}
		} else {
			includes = null;
		}

		return includes;
	}

	/**
	 * Try to parse out the filter parameter from the request
	 * 
	 * @param  {Object} req
	 * @param  {Object} res
	 * @return {Object}
	 */
	getFilter(req, res) {
		
		var filter = req.query[this.container.getParameter('rest.parameters').FILTER];


	}

}