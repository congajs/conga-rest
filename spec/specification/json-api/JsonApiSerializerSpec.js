const path = require('path');
const Resolver = require('conga-framework/lib/namespace/Resolver');
const ResourceAnnotationHandler = require('../../../lib/annotation/ResourceAnnotationHandler');
const JsonApiSerializer = require('../../../lib/specification/json-api/JsonApiSerializer');

const Article = require('../../data/projects/sample/src/demo-bundle/lib/model/Article');
const User = require('../../data/projects/sample/src/demo-bundle/lib/model/User');

describe("JsonApiSerializer", () => {

    let handler;
    let serializer;

    beforeEach(() => {

        const resolver = new Resolver();

        resolver.register(
            'demo-bundle',
            path.join(__dirname, '..', '..', 'data', 'projects', 'sample', 'src', 'demo-bundle')
        );

        handler = new ResourceAnnotationHandler(resolver);

        const config = {
            'attribute.inflection': 'snake',
            'model': {
                'paths': [
                    'demo-bundle:model'
                ]
            }
        };

        handler.parse(config);

        serializer = new JsonApiSerializer(config['attribute.inflection']);

    });

    describe("single response", () => {

        let article;
        let res;

        beforeEach(() => {

            let user = new User();
            user.id = 'abc123';
            user.email = 'example@gmail.com';
            user.name = 'John Doe';
            user.createdAt = new Date();

            console.log(User.prototype);

            article = new Article();
            article.id = 'xzy123'
            article.title = 'my title';
            article.body = 'my body';
            article.comments = [];
            article.author = user;
            article.notExposed = 'this shouldn\'t be exposed';
            article.createdAt = new Date();

            res = serializer.serializeSingleResponse({}, {
                data: article
            });

            console.log(res);
            console.log(res.data.relationships);

        });

        it("should have a jsonapi object", () => {
            expect(res.jsonapi).toEqual({ version: '1.0' });
        });

        it("should have a data property", () => {
            expect(res.data).not.toBeUndefined();
        });

        it("should have a data object", () => {
            expect(typeof res.data).toEqual('object');
        });

        it("should have a links object in data", () => {
            expect(typeof res.data.links).toEqual('object');
        });

        it("should have a relationships property", () => {
            expect(res.data.relationships).not.toBeUndefined();
        });

        it("should have an array for one-to-many relationship data", () => {
            expect(res.data.relationships.comments.data).toEqual(jasmine.any(Array));
        });

        it("should have an object for one-to-one relationship data", () => {
            expect(res.data.relationships.author.data).toEqual(jasmine.any(Object));
        });
    });


});
