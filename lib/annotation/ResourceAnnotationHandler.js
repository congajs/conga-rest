// built-in modules
const path = require('path');

// third-party modules
const annotations = require('conga-annotations');
const inflector = require('change-case');
const recursiveReadSync = require('recursive-readdir-sync');

// local modules
const RestAttributeAnnotation = require('./resource/RestAttributeAnnotation');
const RestIdAnnotation = require('./resource/RestIdAnnotation');
const RestRelationshipAnnotation = require('./resource/RestRelationshipAnnotation');
const RestResourceAnnotation = require('./resource/RestResourceAnnotation');

/**
 * This class finds all of the model classes defined in the "rest" config
 * and then parses out the various REST resource annotations, and then finally
 * storing the resulting metadata on the class prototypes
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class ResourceAnnotationHandler {

    /**
     * Construct the handler
     *
     * @param  {Resolver} namespaceResolver
     */
    constructor(namespaceResolver) {
        this.namespaceResolver = namespaceResolver;
    }

    /**
     * Parse the annotations from all of the resources found in
     * the given config object (config.model.paths)
     *
     * @param  {Object} config
     * @return {void}
     */
    parse(config) {

        const registry = new annotations.Registry();

		// register all the resource annotations
		registry.registerAnnotation(path.join(__dirname, 'resource', 'RestAttributeAnnotation'));
		registry.registerAnnotation(path.join(__dirname, 'resource', 'RestIdAnnotation'));
		registry.registerAnnotation(path.join(__dirname, 'resource', 'RestRelationshipAnnotation'));
		registry.registerAnnotation(path.join(__dirname, 'resource', 'RestResourceAnnotation'));

		const paths = this.getResourcePathsFromConfig(config);

		// create the annotation reader
		const reader = new annotations.Reader(registry);

		paths.forEach((p) => {
			this.parseAnnotations(config, reader, p);
		}, this);

    }

    /**
	 * Get all the full object paths from the rest configuration namespaces
	 *
	 * @param  {Object}    config
	 * @return {Array}
	 */
	getResourcePathsFromConfig(config) {

		const paths = [];

		if (typeof config.model.paths !== 'undefined') {

			config.model.paths.forEach((namespace) => {

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

    /**
     * Parse the REST annotations from the given file path
     *
     * @param  {Object} config
     * @param  {Reader} reader
     * @param  {String} filePath
     * @return {void}
     */
    parseAnnotations(config, reader, filePath) {

        const inflection = config['attribute.inflection'];

        // parse the annotations
        reader.parse(filePath);

        // get the annotations
        const definitionAnnotations = reader.definitionAnnotations;
        const propertyAnnotations = reader.propertyAnnotations;
        const methodAnnotations = reader.methodAnnotations;

        if (definitionAnnotations.length === 0) {
            return;
        }

        // find the constructor name
        const constructorName = definitionAnnotations[0].target;
        const resourceName = definitionAnnotations[0].type;
        const properties = [];
        const relationships = [];

        let id;

        propertyAnnotations.forEach((annotation) => {

            // @Rest:ID
            if (annotation instanceof RestIdAnnotation) {
                id = {
                    targetType: 'property',
                    target: annotation.target,
                    //attribute: annotation.property
                }
            }

            // @Rest:Attribute
            if (annotation instanceof RestAttributeAnnotation) {
                properties.push({
                    targetType: 'property',
                    target: annotation.target,
                    update: annotation.update,
                    expose: annotation.expose,
                    type: annotation.type,
                    attribute: annotation.property ? annotation.property : this.inflectAttribute(annotation.target, inflection)
                });
            }

            // @Rest:Relationship
            if (annotation instanceof RestRelationshipAnnotation) {
                relationships.push({
                    targetType: 'property',
                    target: annotation.target,
                    type: annotation.type,
                    relatedType: annotation.relatedType,
                    attribute: annotation.property ? annotation.property : this.inflectAttribute(annotation.target, inflection)
                });
            }
        });

        methodAnnotations.forEach((annotation) => {

            // @Rest:Attribute
            if (annotation instanceof RestAttributeAnnotation) {
                properties.push({
                    targetType: 'method',
                    target: annotation.target,
                    update: annotation.update,
                    type: annotation.type,
                    attribute: annotation.property ? annotation.property : self.inflectAttribute(annotation.target, inflection),
                    isSetter: annotation.setter
                });
            }

        });

        // build map of attributes to properties
        const attributesToProperties = {};

        properties.forEach((property) => {
            attributesToProperties[property.attribute] = property;
        });

        relationships.forEach((relationship) => {
            attributesToProperties[relationship.attribute] = relationship;
        });

        const proto = require(filePath);

        // store all mapping data on the model's prototype
        proto.prototype.__CONGA_REST__ = {
            id: id,
            type: resourceName,
            properties: properties,
            relationships: relationships,
            proto: proto,
            attributesToProperties: attributesToProperties
        };

    }

    /**
     * Inflect a property name
     *
     * @param  {String} name
     * @param  {String} type
     * @return {String}
     */
    inflectAttribute(name, type) {

        switch (type){

            case 'camel':
                return inflector.camel(name);
                break;

            case 'snake':
                return inflector.snake(name);
                break;

            case 'hyphen':
                return inflector.paramCase(name);
                break;
            default:
                return name;
        }
    }
}
