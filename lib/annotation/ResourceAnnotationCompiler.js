const _ = require('lodash');
const path = require('path');


const annotations = require('@conga/annotations');
const inflector = require('change-case');

const RestAttributeAnnotation = require('./resource/RestAttributeAnnotation');
const RestGroupAnnotation = require('./resource/RestGroupAnnotation');
const RestIdAnnotation = require('./resource/RestIdAnnotation');
const RestMapAttributeAnnotation = require('./resource/RestMapAttributeAnnotation');
const RestRelationshipAnnotation = require('./resource/RestRelationshipAnnotation');
const RestResourceAnnotation = require('./resource/RestResourceAnnotation');


module.exports = class ResourceAnnotationCompiler {

    compile(resourceRegistry, paths, inflection) {

        const registry = new annotations.Registry();

        // register all the resource annotations
        registry.registerAnnotation(path.join(__dirname, 'resource', 'RestAttributeAnnotation'));
        registry.registerAnnotation(path.join(__dirname, 'resource', 'RestGroupAnnotation'));
        registry.registerAnnotation(path.join(__dirname, 'resource', 'RestIdAnnotation'));
        registry.registerAnnotation(path.join(__dirname, 'resource', 'RestMapAttributeAnnotation'));
        registry.registerAnnotation(path.join(__dirname, 'resource', 'RestRelationshipAnnotation'));
        registry.registerAnnotation(path.join(__dirname, 'resource', 'RestResourceAnnotation'));

        // create the annotation reader
        const reader = new annotations.Reader(registry);

        paths.forEach((p) => {
            this.parseAnnotations(resourceRegistry, reader, p, inflection);
        }, this);

    }

    /**
     * Parse the REST annotations from the given file path
     *
     * @param  {ResourceRegistry} resourceRegistry
     * @param  {Reader} reader
     * @param  {String} filePath
     * @return {void}
     */
    parseAnnotations(resourceRegistry, reader, filePath, inflection) {

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
        //const properties = [];
        const relationships = [];

        let id;

        // hash of property names to info parsed from property annotations
        const properties = {};

        /**
         * Add new data for a property to the properties hash
         * @param {String} name
         * @param {Object} data
         */
        const addPropertyData = (name, data) => {

            if (typeof properties[name] === 'undefined') {
                properties[name] = {};
            }

            Object.assign(properties[name], data);
        };

        propertyAnnotations.forEach((annotation) => {

            // @Rest:ID
            if (annotation instanceof RestIdAnnotation) {
                id = {
                    targetType: 'property',
                    target: annotation.target,
                    attribute: this.inflectAttribute(annotation.target, inflection)
                }
            }

            // @Rest:Attribute
            if (annotation instanceof RestAttributeAnnotation) {
                addPropertyData(annotation.target, {
                    targetType: 'property',
                    target: annotation.target,
                    update: annotation.update,
                    expose: annotation.expose,
                    type: annotation.type,
                    format: annotation.format,
                    attribute: annotation.property ? annotation.property : this.inflectAttribute(annotation.target, inflection)
                });
            }

            // @Rest:MapAttribute
            if (annotation instanceof RestMapAttributeAnnotation) {

                const outToIn = {};
                for (let val in annotation.value) {
                    outToIn[annotation.value[val]] = val;
                }

                addPropertyData(annotation.target, {
                    valueMap: {
                        inToOut: annotation.value ? annotation.value : {},
                        outToIn: outToIn
                    }
                });
            }

            // @Rest:Group
            if (annotation instanceof RestGroupAnnotation) {
                addPropertyData(annotation.target, {
                    group: {
                        read: annotation.read,
                        write: annotation.write
                    }
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
                addPropertyData(annotation.property, {
                    targetType: 'method',
                    target: annotation.target,
                    update: annotation.update,
                    type: annotation.type,
                    attribute: annotation.property ? annotation.property : this.inflectAttribute(annotation.target, inflection),
                    isSetter: annotation.setter
                });
            }

        });

        const finalProperties = _.values(properties);

        // build map of attributes to properties
        const attributesToProperties = {};

        finalProperties.forEach((property) => {
            attributesToProperties[property.attribute] = property;
        });

        relationships.forEach((relationship) => {
            attributesToProperties[relationship.attribute] = relationship;
        });

        const propertiesToAttributes = {};

        finalProperties.forEach((property) => {
            propertiesToAttributes[property.target] = property.attribute;
        });

        const proto = require(filePath);

        // store all mapping data on the model's prototype
        const metadata = {
            id: id,
            type: resourceName,
            properties: finalProperties,
            relationships: relationships,
            proto: proto,
            attributesToProperties: attributesToProperties,
            propertiesToAttributes: propertiesToAttributes
        };

        proto.prototype.__CONGA_REST__ = metadata;

        resourceRegistry.add(constructorName, metadata);
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

            case 'constant':
                return inflector.constantCase(name);
                break;

            case 'pascal':
                return inflector.pascalCase(name);
                break;

            default:
                return name;
        }
    }
}
