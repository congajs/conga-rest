const _ = require('lodash');

const Controller = require('@conga/framework').Controller;

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
}
