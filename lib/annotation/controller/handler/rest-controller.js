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
var RestController = require('../rest-controller');
//var RestModifyCriteria = require('../rest-modify-criteria');

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
			//path.join(__dirname, '..', '')
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

		// store routes for express to use later on
		container.setParameter('conga.routes', container.getParameter('conga.routes').concat(routes));

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

		// set up return array
		var routes = [];
		
		// parse the annotations
		reader.parse(controller.filePath);

		// get the annotations
		var constructorAnnotations = reader.getConstructorAnnotations();
		var methodAnnotations = reader.getMethodAnnotations();

		var restModifyCriteriaMethods = [];

		// find constructor annotations
		constructorAnnotations.forEach(function(annotation){

			// @RestController annotation
			if (annotation instanceof RestController){

				// build the controller prototype
				var C = require(controller.filePath); 
				var obj;

				var adapterPath = container.get('namespace.resolver').resolveWithSubpath(annotation.adapter, 'lib');
				var Rest = require(adapterPath);
				container.get('lodash').extend(Rest.prototype, C.prototype);
				obj = new Rest(container, annotation.model, annotation.options);

				obj.container = container;
				obj.wrappedPagination = annotation.wrappedPagination;

				// build all of the REST method routes
				this.restMethods.forEach(function(restMethod){

					var prefix = controller.prefix;
					var name = prefix.replace('/', '') + '.' + restMethod.action;
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
				container.set(controller.serviceId, obj);
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