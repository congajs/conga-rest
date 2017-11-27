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

const bodyParser = require('body-parser');

// local modules
const ControllerAnnotation = require('../RestControllerAnnotation');
const RestUploadAnnotation = require('../RestUploadAnnotation');

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
            path.join(__dirname, '..', 'RestUploadAnnotation'),
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

        // parse the routes from the controller
        const routes = this.parseRoutesFromFile(container, reader, controller);

        // make sure that container has routes array
        if (!container.hasParameter('conga.routes')){
            container.setParameter('conga.routes', []);
        }

        // make sure that container has REST routes array
        // make sure that container has routes array
        if (!container.hasParameter('conga.rest.routes')){
            container.setParameter('conga.rest.routes', []);
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

            // store in conga.rest.routes to be able to find rest specific routes later on
            container.getParameter('conga.rest.routes').push(route);
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

        // set up return array
        const routes = [];

        // parse the annotations
        reader.parse(controller.filePath);

        // get the annotations
        const definitionAnnotations = reader.definitionAnnotations;
        const methodAnnotations = reader.methodAnnotations;

        const restModifyCriteriaMethods = [];

        let controllerObj;
        let controllerAnnotation;

        // find constructor annotations
        definitionAnnotations.forEach((annotation) => {

            // @RestController annotation
            if (annotation instanceof ControllerAnnotation) {

                controllerAnnotation = annotation;

                const resourceMetadata = this.resourceRegistry.getByType(annotation.resource);
                const allowedMethods = annotation.allowedMethods;

                // grab the REST methods config from container
                const restMethods = container.getParameter('rest.methods').slice();

                // add bulk routes
                if (annotation.bulk) {
                    this.addBulkRoutes(restMethods);
                }

                // build the controller prototype
                const Controller = require(controller.filePath);

                controllerObj = new Controller(
                    container,
                    container.get('conga.rest.resource.registry'),
                    container.get('conga.rest.specification'),
                    resourceMetadata.type,
                    annotation.isPaginationEnabled,
                    annotation.defaultLimit,
                    annotation.defaultSort,
                    annotation.bulk
                );

                const routeMap = {};

                // build all of the REST method routes
                restMethods.forEach((restMethod) => {

                    // figure out if this is an allowed method
                    if (allowedMethods !== null && allowedMethods.indexOf(restMethod.action) === -1) {
                        return;
                    }

                    const prefix = controller.prefix;
                    const name = 'conga.rest.' + annotation.resource + '.' + restMethod.name;

                    let path = prefix + restMethod.path;
                    path = path.replace('//', '/').replace(/\/+$/, ''); // clean up weird concats

                    routeMap[restMethod.name] = name;

                    routes.push({
                        name: name,
                        controller: controller.serviceId,
                        controllerInfo: controller,
                        action: restMethod.action,
                        method: restMethod.method,
                        path: path,
                        resource: annotation.resource
                    });
                });

                resourceMetadata.routes = routeMap;
                resourceMetadata.controller = controller;

                // add controller to container
                container.set(controller.serviceId, controllerObj);
            }

            // @RestController annotation
            if (annotation instanceof RestUploadAnnotation) {

                const name = 'conga.rest.' + controllerAnnotation.resource + '.upload';
                let path = controller.prefix + '/upload';
                path = path.replace('//', '/').replace(/\/+$/, ''); // clean up weird concats


                const parser = function(req, res, next) {
                    bodyParser.raw({
                        type: "*/*",
                        limit: "2kb"
                    })(req, res, next);
                }

                routes.push({
                    name: name,
                    controller: controller.serviceId,
                    controllerInfo: controller,
                    action: 'upload',
                    method: 'POST',
                    path: path,
                    resource: controllerAnnotation.resource,
                    bodyParser: parser
                });

                const uploader = require('../../../upload/SimpleUploadController');

                controllerObj.upload = uploader.upload.bind(controllerObj);

            }

        });

        return routes;
    }

    /**
     * Add the bulk routes
     *
     * @param {Array} routes
     */
    addBulkRoutes(routes) {

        routes.push({
            path: '/',
            action: 'patchBulk',
            method: 'PATCH',
            name: 'patch.bulk'
        });

        routes.push({
            path: '/',
            action: 'deleteBulk',
            method: 'DELETE',
            name: 'delete.bulk'
        });
    }
}
