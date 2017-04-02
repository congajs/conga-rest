/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var path = require('path');
var url = require('url');

// third-party modules

// local modules
var ControllerAnnotation = require('../rest-controller');

/**
 * The RestAnnotationHandler finds all REST annotations in
 * the project controllers and applies REST methods and
 * adapters to them
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var RestAnnotationHandler = function(){};

RestAnnotationHandler.prototype = {
	
	/**
	 * Get the annotation paths that should be parsed
	 *
	 * @return {Array}
	 */
	getAnnotationPaths: function(){
		return [
			path.join(__dirname, '..', 'rest-controller'),
		];
	},

	/**
	 * Handle all of the routing annotations on a controller
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Array}
	 */
	handleAnnotations: function(container, reader, controller){
		
		// grab the REST methods config from container
		this.restMethods = container.getParameter('rest.methods');

		// parse the routes from the controller
		var routes = this.parseRoutesFromFile(container, reader, controller);

		// make sure that container has routes array
		if (!container.hasParameter('conga.routes')){
			container.setParameter('conga.routes', []);
		}

		var existingRoutes = container.getParameter('conga.routes');
		var existingRoutesMap = {};

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
	},
		
	/**
	 * Find the annotations in a controller and build all the routes based
	 * on the annotation data
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Array}
	 */
	parseRoutesFromFile: function(container, reader, controller){

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

				var resourceType = restManager.getTypeForModelName(annotation.model);
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
					container.get('rest.manager'), 
					resourceType, 
					annotation.model,
					annotation.isPaginationEnabled,
					annotation.defaultLimit
				);

				// store the controller object on the adapter
				//adapter.controller = controllerObj;

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
};

module.exports = RestAnnotationHandler;