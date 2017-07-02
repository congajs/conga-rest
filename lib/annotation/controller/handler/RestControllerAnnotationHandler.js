/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const path = require('path');
const url = require('url');

// local modules
const ControllerAnnotation = require('../RestControllerAnnotation');

/**
 * The RestAnnotationHandler finds all REST annotations in
 * the project controllers and applies REST methods and
 * adapters to them
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestControllerAnnotationHandler {

	/**
     * Construct the handler
     *
     * @param {RestResourceRegistry} resourceRegistry
     */
    constructor(resourceRegistry) {
        this.resourceRegistry = resourceRegistry;
    }

	/**
	 * Get the annotation paths that should be parsed
	 *
	 * @return {Array}
	 */
	getAnnotationPaths() {
		return [
			path.join(__dirname, '..', 'RestControllerAnnotation'),
		];
	}

	/**
	 * Handle all of the routing annotations on a controller
	 *
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Array}
	 */
	handleAnnotations(container, reader, controller) {

		// grab the REST methods config from container
		this.restMethods = container.getParameter('rest.methods');

		// parse the routes from the controller
		const routes = this.parseRoutesFromFile(container, reader, controller);

		// make sure that container has routes array
		if (!container.hasParameter('conga.routes')){
			container.setParameter('conga.routes', []);
		}

		const existingRoutes = container.getParameter('conga.routes');
		const existingRoutesMap = {};

		existingRoutes.forEach(function(route){
			existingRoutesMap[route.controller + '#' + route.action] = route;
		});

		routes.forEach(function(route){
			if (typeof existingRoutesMap[route.controller + '#' + route.action] === 'undefined'){
				existingRoutes.push(route);
			}
		});

		// store routes for express to use later on
		container.setParameter('conga.routes', existingRoutes);

		const handlers = container.getParameter('conga.response.handlers');

		for (let i in routes) {

			const route = routes[i];
			const controller = route.controller;
			const action = route.action;

			if (typeof handlers[controller] === 'undefined') {
				handlers[controller] = {};
			}

			if (typeof handlers[controller][action] === 'undefined') {
				handlers[controller][action] = {};
			}

			handlers[controller][action] = container.get('conga.rest.response.handler');
		}

		container.setParameter('conga.response.handlers', handlers);

	}

	/**
	 * Find the annotations in a controller and build all the routes based
	 * on the annotation data
	 *
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Array}
	 */
	parseRoutesFromFile(container, reader, controller) {

		var restManager = container.get('rest.manager');

		// set up return array
		var routes = [];

		// parse the annotations
		reader.parse(controller.filePath);

		// get the annotations
		var definitionAnnotations = reader.definitionAnnotations;
		var methodAnnotations = reader.methodAnnotations;

		var restModifyCriteriaMethods = [];

		// find constructor annotations
		definitionAnnotations.forEach(function(annotation){

			// @RestController annotation
			if (annotation instanceof ControllerAnnotation){

				var resourceType = this.resourceRegistry.get(annotation.model);//restManager.getTypeForModelName(annotation.model);
				var allowedMethods = annotation.allowedMethods;

				// build the controller prototype
				var Controller = require(controller.filePath);

				// var adapterPath = container.get('namespace.resolver').resolveWithSubpath(annotation.adapter, 'lib');
				// var RestAdapter = require(adapterPath);

				// adapter = new RestAdapter(container,
				// 			   annotation.model,
				// 			   resourceType,
				// 			   annotation.isPaginationEnabled,
				// 			   annotation.defaultLimit,
				// 			   annotation.adapterOptions
				// );

				var controllerObj = new Controller(
					container,
					container.get('conga.rest.specification'),
					container.get('rest.manager'),
					resourceType,
					annotation.model,
					annotation.isPaginationEnabled,
					annotation.defaultLimit
				);

				// build all of the REST method routes
				this.restMethods.forEach(function(restMethod){

					// figure out if this is an allowed method
					if (allowedMethods !== null && allowedMethods.indexOf(restMethod.action) === -1) {
						return;
					}

					var prefix = controller.prefix;
					var name = resourceType + '.' + restMethod.name;
					var path = prefix + restMethod.path;
					path = path.replace('//', '/').replace(/\/+$/, ''); // clean up weird concats

					routes.push({
						name: name,
						controller: controller.serviceId,
						action: restMethod.action,
						method: restMethod.method,
						path: path
					});
				});

				// add controller to container
				container.set(controller.serviceId, controllerObj);
			}
		}, this);

		// find method annotations
		methodAnnotations.forEach(function(annotation){

			// @RestModifyCriteria
			// if (annotation instanceof RestModifyCriteria){
			// 	restModifyCriteriaMethods.push(annotation.target);
			// }

		});

		return routes;
	}
}
