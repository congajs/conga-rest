const path = require('path');
const _ = require('lodash');
const pluralize = require('pluralize');

const Controller = require('@conga/framework').Controller;

const RestGenerator = require('../../../generator/RestGenerator');
/**
 * @Route("/_conga/api/rest")
 */
module.exports = class DashboardRestController extends Controller {

    /**
     * @Route("/specification", methods=['GET'])
     */
    specification(req, res) {

        const config = _.cloneDeep(this.container.get('config').get('rest').specification);
        const specification = this.container.get('conga.rest.specification');

        const keys = [
            'pagination',
            'sorting',
            'filtering',
            'sparse',
            'includes'
        ];

        keys.forEach(key => {

            // add query examples and info
            config.query[key] = {
                service: config.query[key],
                examples: {
                    querystring: specification[key].getQuerystringExample(),
                    body: JSON.stringify(specification[key].getBodyQueryExample(), null, 4)
                }
            }

        });

        res.return({
            specification: config
        });

    }

    /**
     * @Route("/resources", methods=['GET'])
     */
    resources(req, res) {

        const resources = this.container.get('conga.rest.resource.registry').nameToProtoMap;

        res.return({
            resources: Object.keys(resources).map(key => resources[key])
        });

    }

    /**
     * @Route("/endpoints", methods=['GET'])
     */
    endpoints(req, res) {

        const routes = this.container.getParameter('conga.rest.routes');

        // group routes by resource names
        const groups = {};

        routes.forEach(route => {

            if (!(route.resource in groups)) {

                const resource = this.container.get('conga.rest.resource.registry').getByType(route.resource);
                const controller = this.container.get(resource.controller.serviceId);

                groups[route.resource] = {
                    resource: route.resource,
                    controller: {
                        serviceId: resource.controller.serviceId,
                        bundle: resource.controller.bundle,
                        file: resource.controller.filePath,
                        isPaginationEnabled: controller.isPaginationEnabled,
                        defaultLimit: controller.defaultLimit,
                        defaultSort: controller.defaultSort
                    },
                    routes: []
                };
            }

            groups[route.resource].routes.push(route);

        });

        res.return({
            endpoints: _.values(groups)
        });
    }

    /**
     * @Route("/bundles", methods=['GET'])
     */
    bundles(req, res) {

        const bundles = [];
        const src = this.container.getParameter('kernel.bundle_path');
        const paths = this.container.getParameter('bundle.paths');

        for (let i in paths) {
            if (paths[i].startsWith(src)) {
                bundles.push({
                    name: i
                });
            }
        }

        res.return({
            bundles: bundles
        });
    }

    /**
     * @Route("/api", methods=['POST'])
     */
    createApi(req, res) {

        const data = req.body.api;

        const basePath = this.container.getParameter('bundle.paths')[data.bundle];
        const generator = new RestGenerator();

        const resourcePath = path.join(basePath, 'lib', 'model', data.className + '.js');
        const controllerPath = path.join(basePath, 'lib', 'controller', data.className + 'Controller.js');

        generator.generateResource(
            data.className,
            resourcePath,
            data.resource,
            pluralize(data.className.toLowerCase()),
            data.attributes,
            data.relationships
        ).then(() => {
            return Promise.resolve();
        }).then(() => {

            generator.generateController(
                data.className + 'Controller',
                controllerPath,
                data.resource,
                data.route,
                'bass',
                {
                    bulk: data.bulk
                }
            ).then(() => {
                res.return({
                    api: data
                });
            });
        });

    }

    /**
     * @Route("/methods", methods=['GET'])
     */
    methods(req, res) {

        const methods = this.container.getParameter('rest.methods').slice();

        methods.push({
            path: '/',
            action: 'patchBulk',
            method: 'PATCH',
            name: 'patch.bulk',
            bulk: true
        });

        methods.push({
            path: '/',
            action: 'deleteBulk',
            method: 'DELETE',
            name: 'delete.bulk',
            bulk: true
        });

        res.return({
            methods: methods
        });
    }
}
