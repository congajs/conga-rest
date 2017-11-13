// built-in modules

// third-party modules

const recursiveReadSync = require('recursive-readdir-sync');

// local modules
const ResourceAnnotationCompiler = require('./ResourceAnnotationCompiler');

/**
 * This class finds all of the model classes defined in the "rest" config
 * and then parses out the various REST resource annotations, and then finally
 * storing the resulting metadata on the class prototypes
 */
module.exports = class ResourceAnnotationHandler {

    /**
     * Construct the handler
     *
     * @param {Resolver}             namespaceResolver
     * @param {RestResourceRegistry} resourceRegistry
     */
    constructor(namespaceResolver, resourceRegistry) {
        this.namespaceResolver = namespaceResolver;
        this.resourceRegistry = resourceRegistry;
    }

    /**
     * Parse the annotations from all of the resources found in
     * the given config object (config.model.paths)
     *
     * @param  {Object} config
     * @return {void}
     */
    parse(config) {

        const compiler = new ResourceAnnotationCompiler();

        compiler.compile(
            this.resourceRegistry,
            this.getResourcePathsFromConfig(config),
            config.specification.inflection
        );

    }

    /**
     * Get all the full object paths from the rest configuration namespaces
     *
     * @param  {Object}    config
     * @return {Array}
     */
    getResourcePathsFromConfig(config) {

        const paths = [];

        if (config.resource.paths) {

            config.resource.paths.forEach((namespace) => {

                const dir = this.namespaceResolver.resolveWithSubpath(namespace, 'lib');
                const files = recursiveReadSync(dir);

                files.forEach((p) => {
                    if (p.substr(-3) === '.js') {
                        paths.push(p);
                    }
                });
            });
        }

        return paths;
    }

}
