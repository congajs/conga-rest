const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = class RestGenerator {

    /**
     * Generate a new REST controller
     *
     * @param  {String} name        the class name
     * @param  {String} destination the path to write the file to
     * @param  {String} resource    the resource name
     * @param  {String} route       the route path
     * @param  {String} type        the type of controller (bass)
     * @param  {Object} options     additional options
     * @return {Promise}
     */
    generateController(name, destination, resource, route, type, options) {

        options = _.merge({
            isPaginationEnabled: true,
            defaultLimit: 500,
            isIncludeRelatedSupported: true
        }, options);

        return this.renderAndSave(destination, 'controller.template.js', {
            name: name,
            resource: resource,
            route: route,
            options: options
        });

    }

    /**
     * [generateResource description]
     *
     * @param  {[type]} name          [description]
     * @param  {[type]} destination   [description]
     * @param  {[type]} resource      [description]
     * @param  {[type]} collection    [description]
     * @param  {[type]} attributes    [description]
     * @param  {[type]} relationships [description]
     * @return {Promise}
     */
    generateResource(name, destination, resource, collection, attributes, relationships) {

        return this.renderAndSave(destination, 'resource.template.js', {
            name: name,
            resource: resource,
            collection: collection,
            attributes: attributes,
            relationships: relationships
        });

    }

    renderAndSave(destination, template, vars) {

        return new Promise((resolve, reject) => {

            fs.readFile(path.join(__dirname, template), (err, data) => {

                const compile = _.template(data);

                const content = compile(vars);

                fs.writeFile(destination, content, (err) => {
                    if (err) reject(err);
                    resolve();
                });

            });

        });

    }
}
