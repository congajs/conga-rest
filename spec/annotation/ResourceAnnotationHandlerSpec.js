const path = require('path');
const Resolver = require('@conga/framework/lib/namespace/Resolver');
const ResourceAnnotationHandler = require('../../lib/annotation/ResourceAnnotationHandler');
const RestResourceRegistry = require('../../lib/rest/RestResourceRegistry');

describe("ResourceAnnotationHandler", () => {

    let handler;
    let Article;

    beforeAll(() => {

        const resolver = new Resolver();
        resolver.register('demo-bundle', path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'demo-bundle'));

        handler = new ResourceAnnotationHandler(resolver, new RestResourceRegistry());

        const config = {
            'attribute.inflection': 'snake',
            'resource': {
                'paths': [
                    'demo-bundle:model'
                ]
            }
        };

        handler.parse(config);

        Article = require(path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'demo-bundle', 'lib', 'model', 'Article'));

    });

    it("should add metadata to prototype", () => {
        expect(Article.prototype.__CONGA_REST__).not.toBeUndefined();
    });

    it("should have metadata for id", () => {
        expect(Article.prototype.__CONGA_REST__.id).toEqual({ targetType: 'property', target: 'id', attribute: 'id' });
    });

    it("should have class reference", () => {
        expect(Article.prototype.__CONGA_REST__.proto).toBe(Article);
    });

    it("should have a type", () => {
        expect(Article.prototype.__CONGA_REST__.type).toEqual('article');
    });

    it("should have properties", () => {
        expect(Article.prototype.__CONGA_REST__.properties).not.toBeUndefined();
        expect(Article.prototype.__CONGA_REST__.properties.length).toEqual(9);
    });

    it("should have attribute to property mapping", () => {
        expect(Article.prototype.__CONGA_REST__.attributesToProperties).not.toBeUndefined();
        expect(Object.keys(Article.prototype.__CONGA_REST__.attributesToProperties).length).toEqual(11);
    });

    it("should have mapped snake case attributes", () => {
        expect(Article.prototype.__CONGA_REST__.attributesToProperties.not_exposed).not.toBeUndefined();
        expect(Article.prototype.__CONGA_REST__.attributesToProperties.created_at).not.toBeUndefined();
        expect(Article.prototype.__CONGA_REST__.attributesToProperties.updated_at).not.toBeUndefined();
    });

    it("should have non-exposed properties", () => {
        expect(Article.prototype.__CONGA_REST__.attributesToProperties.not_exposed).not.toBeUndefined();
        expect(Article.prototype.__CONGA_REST__.attributesToProperties.not_exposed.expose).toEqual(false);
    });

    it("should have non-updatable properties", () => {
        expect(Article.prototype.__CONGA_REST__.attributesToProperties.version.update).toEqual(false);
        expect(Article.prototype.__CONGA_REST__.attributesToProperties.created_at.update).toEqual(false);
        expect(Article.prototype.__CONGA_REST__.attributesToProperties.updated_at.update).toEqual(false);
    });

    it("should have mapped relationships", () => {
        expect(Article.prototype.__CONGA_REST__.relationships).not.toBeUndefined();
        expect(Article.prototype.__CONGA_REST__.relationships.length).toEqual(2);
    });

    it("should have a one-to-one relationship", () => {
        expect(Article.prototype.__CONGA_REST__.relationships[1].type).toEqual('one');
    });

    it("should have an attribute-to-property mapping for one-to-one attribute", () => {
        expect(Article.prototype.__CONGA_REST__.attributesToProperties.author.relatedType).toEqual('user');
    });

    it("should have an attribute-to-property mapping for one-to-many attribute", () => {
        expect(Article.prototype.__CONGA_REST__.attributesToProperties.comments.relatedType).toEqual('comment');
    });
});
