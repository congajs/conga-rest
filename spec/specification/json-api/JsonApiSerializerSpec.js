const path = require('path');
const Resolver = require('@conga/framework/lib/namespace/Resolver');
const ResourceAnnotationHandler = require('../../../lib/annotation/ResourceAnnotationHandler');
const JsonApiSerializer = require('../../../lib/specification/json-api/JsonApiSerializer');
const RestResourceRegistry = require('../../../lib/rest/RestResourceRegistry');
const RestRouter = require('../../../lib/router/RestRouter');
const Router = require('@conga/framework/lib/router/Router');

const Article = require('../../data/projects/sample/src/demo-bundle/lib/model/Article');
const Comment = require('../../data/projects/sample/src/demo-bundle/lib/model/Comment');
const User = require('../../data/projects/sample/src/demo-bundle/lib/model/User');

describe("JsonApiSerializer", () => {

    let handler;
    let serializer;

    beforeAll(() => {

        const resolver = new Resolver();

        resolver.register(
            'demo-bundle',
            path.join(__dirname, '..', '..', 'data', 'projects', 'sample', 'src', 'demo-bundle')
        );

        handler = new ResourceAnnotationHandler(resolver, new RestResourceRegistry());

        const config = {
            'attribute.inflection': 'snake',
            'model': {
                'paths': [
                    'demo-bundle:model'
                ]
            }
        };

        handler.parse(config);

        const router = new Router();
        router.setRoutes([
          { name: 'conga.rest.Article.list',
            controller: 'controller.demo-bundle.ArticleController',
            action: 'list',
            method: 'GET',
            path: '/api/articles' },
          { name: 'conga.rest.Article.find.one',
            controller: 'controller.demo-bundle.ArticleController',
            action: 'find',
            method: 'GET',
            path: '/api/articles/:id' },
          { name: 'conga.rest.Article.create',
            controller: 'controller.demo-bundle.ArticleController',
            action: 'create',
            method: 'POST',
            path: '/api/articles' },
          { name: 'conga.rest.Article.update',
            controller: 'controller.demo-bundle.ArticleController',
            action: 'update',
            method: 'PATCH',
            path: '/api/articles/:id' },
          { name: 'conga.rest.Article.delete',
            controller: 'controller.demo-bundle.ArticleController',
            action: 'remove',
            method: 'DELETE',
            path: '/api/articles/:id' },
          { name: 'conga.rest.Article.relationships.self',
            controller: 'controller.demo-bundle.ArticleController',
            action: 'findRelationship',
            method: 'GET',
            path: '/api/articles/:id/relationships/:attribute' },
          { name: 'conga.rest.Article.relationships.update',
            controller: 'controller.demo-bundle.ArticleController',
            action: 'updateRelationship',
            method: 'PATCH',
            path: '/api/articles/:id/relationships/:attribute' },
          { name: 'conga.rest.Article.relationships.related',
            controller: 'controller.demo-bundle.ArticleController',
            action: 'findRelationship',
            method: 'GET',
            path: '/api/articles/:id/:attribute' }
        ]);

        serializer = new JsonApiSerializer(config['attribute.inflection'], new RestRouter(router));

    });

    // describe("single response", () => {
    //
    //     let article;
    //     let res;
    //
    //     beforeAll(() => {
    //
    //         let user1 = new User();
    //         user1.id = 'user1';
    //         user1.email = 'user1@gmail.com';
    //         user1.name = 'John Doe';
    //         user1.createdAt = new Date();
    //
    //         let user2 = new User();
    //         user2.id = 'user2';
    //         user2.email = 'user2@gmail.com';
    //         user2.name = 'Mary Jane';
    //         user2.createdAt = new Date();
    //
    //         let comment1 = new Comment();
    //         comment1.id = 'comment1';
    //         comment1.body = "Comment #1";
    //         comment1.user = user1;
    //         comment1.createdAt = new Date();
    //
    //         let comment2 = new Comment();
    //         comment2.id = 'comment2';
    //         comment2.body = "Comment #2";
    //         comment2.user = user2;
    //         comment2.createdAt = new Date();
    //
    //         article = new Article();
    //         article.id = 'article1'
    //         article.title = 'my title';
    //         article.body = 'my body';
    //         article.comments = [comment1, comment2];
    //         article.author = user1;
    //         article.notExposed = 'this shouldn\'t be exposed';
    //         article.createdAt = new Date();
    //
    //     });
    //
    //     describe("normal response", () => {
    //
    //         let res;
    //
    //         beforeAll(() => {
    //
    //             res = serializer.serializeSingleResponse({}, {
    //                 data: article
    //             });
    //
    //         });
    //
    //         it("should have a jsonapi object", () => {
    //             expect(res.jsonapi).toEqual({ version: '1.0' });
    //         });
    //
    //         it("should have a data property", () => {
    //             expect(res.data).not.toBeUndefined();
    //         });
    //
    //         it("should have a data object", () => {
    //             expect(typeof res.data).toEqual('object');
    //         });
    //
    //         it("should have a links object in data", () => {
    //             expect(typeof res.data.links).toEqual('object');
    //         });
    //
    //         it("should have a relationships property", () => {
    //             expect(res.data.relationships).not.toBeUndefined();
    //         });
    //
    //         it("should have an array for one-to-many relationship data", () => {
    //             expect(res.data.relationships.comments.data).toEqual(jasmine.any(Array));
    //         });
    //
    //         it("should have an object for one-to-one relationship data", () => {
    //             expect(res.data.relationships.author.data).toEqual(jasmine.any(Object));
    //         });
    //
    //         it("should have an object with type & id for one-to-one relationship", () => {
    //             expect(res.data.relationships.author.data).toEqual({ type: 'user', id: 'user1' });
    //         });
    //
    //         it("should contain an object with type & id for one-to-many relationship", () => {
    //             expect(res.data.relationships.comments.data[0]).toEqual({ type: 'comment', id: 'comment1' });
    //         });
    //     });
    //
    //     describe("sparse response", () => {
    //
    //         let res;
    //
    //         beforeAll(() => {
    //
    //             res = serializer.serializeSingleResponse({}, {
    //                 data: article,
    //                 sparseFields: { article: ['title', 'body'] }
    //             });
    //
    //         });
    //
    //         it("should not have fields that weren't specified", () => {
    //             expect(res.data.attributes.version).toBeUndefined();
    //             expect(res.data.attributes.created_at).toBeUndefined();
    //         });
    //
    //     });
    //
    //     describe("normal response", () => {
    //
    //         let res;
    //
    //         beforeAll(() => {
    //
    //             res = serializer.serializeSingleResponse({}, {
    //                 data: article,
    //                 includes: [
    //                     ['author'],
    //                     ['comments', 'user']
    //                 ]
    //             });
    //
    //         });
    //
    //         it("should have a 'included' property", () => {
    //             expect(res.included).not.toBeUndefined();
    //         });
    //
    //         it("should contain includes for one-to-one", () => {
    //
    //         });
    //
    //     });
    //
    // });


});
