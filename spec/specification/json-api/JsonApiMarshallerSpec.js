const path = require('path');
const jasmine = require('jasmine');

const JsonApiMarshaller = require('../../../lib/specification/json-api/JsonApiMarshaller');
const ResourceAnnotationCompiler = require('../../../lib/annotation/ResourceAnnotationCompiler');
const RestResourceRegistry = require('../../../lib/rest/RestResourceRegistry');
const RestNormalizer = require('../../../lib/specification/RestNormalizer');
const RestRouter = require('../../../lib/router/RestRouter');
const Router = require('@conga/framework/lib/router/Router');
const RestMapper = require('../../../lib/rest/RestMapper');

const Article = require('../../data/projects/sample/src/demo-bundle/lib/model/Article');
const Comment = require('../../data/projects/sample/src/demo-bundle/lib/model/Comment');
const User = require('../../data/projects/sample/src/demo-bundle/lib/model/User');

describe("JsonApiMarshaller", () => {

    let marshaller;
    let normalizer;
    let req;
    let user, article, comment;


    beforeAll(() => {

        const registry = new RestResourceRegistry();
        const compiler = new ResourceAnnotationCompiler();

        const paths = [
            path.join(__dirname, '..', '..', 'data', 'projects', 'sample', 'src', 'demo-bundle', 'lib', 'model', 'Article.js'),
            path.join(__dirname, '..', '..', 'data', 'projects', 'sample', 'src', 'demo-bundle', 'lib', 'model', 'Comment.js'),
            path.join(__dirname, '..', '..', 'data', 'projects', 'sample', 'src', 'demo-bundle', 'lib', 'model', 'User.js'),
        ];

        compiler.compile(
            registry,
            paths,
            'snake'
        );

        const router = new Router();
        router.setRoutes([
            {
                name: 'conga.rest.Article.list',
                controller: 'controller.demo-bundle.ArticleController',
                action: 'list',
                method: 'GET',
                path: '/api/articles'
            },
            {
                name: 'conga.rest.Article.find.one',
                controller: 'controller.demo-bundle.ArticleController',
                action: 'find',
                method: 'GET',
                path: '/api/articles/:id'
            },
            {
                name: 'conga.rest.Article.create',
                controller: 'controller.demo-bundle.ArticleController',
                action: 'create',
                method: 'POST',
                path: '/api/articles'
            },
            {
                name: 'conga.rest.Article.update',
                controller: 'controller.demo-bundle.ArticleController',
                action: 'update',
                method: 'PATCH',
                path: '/api/articles/:id'
            },
            {
                name: 'conga.rest.Article.delete',
                controller: 'controller.demo-bundle.ArticleController',
                action: 'remove',
                method: 'DELETE',
                path: '/api/articles/:id'
            },
            {
                name: 'conga.rest.Article.relationships.get',
                controller: 'controller.demo-bundle.ArticleController',
                action: 'findRelationship',
                method: 'GET',
                path: '/api/articles/:id/:attribute'
            },
            {
                name: 'conga.rest.Article.related',
                controller: 'controller.demo-bundle.ArticleController',
                action: 'getRelatedResource',
                method: 'GET',
                path: '/api/articles/:id/:attribute'
            },

            // Comment
            {
                name: 'conga.rest.Comment.find.one',
                controller: 'controller.demo-bundle.ArticleController',
                action: 'find',
                method: 'GET',
                path: '/api/comments/:id'
            },
            {
                name: 'conga.rest.Comment.relationships.get',
                controller: 'controller.demo-bundle.CommentController',
                action: 'findRelationship',
                method: 'GET',
                path: '/api/comments/:id/relationships/:attribute'
            },
            {
                name: 'conga.rest.Comment.related',
                controller: 'controller.demo-bundle.CommentController',
                action: 'getRelatedResource',
                method: 'GET',
                path: '/api/articles/:id/:attribute'
            },

            // User
            {
                name: 'conga.rest.User.find.one',
                controller: 'controller.demo-bundle.UserController',
                action: 'find',
                method: 'GET',
                path: '/api/users/:id'
            },
            {
                name: 'conga.rest.User.related',
                controller: 'controller.demo-bundle.UserController',
                action: 'getRelatedResource',
                method: 'GET',
                path: '/api/articles/:id/:attribute'
            },
        ]);

        Article.prototype.__CONGA_REST__.routes = {
            'find.one': 'conga.rest.Article.find.one',
            'relationships.get': 'conga.rest.Article.relationships.get',
            'related': 'conga.rest.Article.related'
        };

        Comment.prototype.__CONGA_REST__.routes = {
            'find.one': 'conga.rest.Comment.find.one',
            'relationships.get': 'conga.rest.Comment.relationships.get',
            'related': 'conga.rest.Comment.related'
        };

        User.prototype.__CONGA_REST__.routes = {
            'find.one': 'conga.rest.User.find.one',
            'relationships.get': 'conga.rest.User.relationships.get',
            'related': 'conga.rest.User.related'
        };

        const mapper = new RestMapper(registry, router);

        normalizer = new RestNormalizer(mapper, new RestRouter(router, registry));

        req = {
            protocol: 'http',
            get: (param) => {
                return 'localhost';
            }
        };

        user = new User();
        user.id = 888;
        user.referenceId = 1;
        user.email = 'foo@bar.com';
        user.name = 'John Doe';
        user.password = 'abc';
        user.gender = 'Male';
        user.createdAt = new Date();

        comment = new Comment();
        comment.id = 999;
        comment.referendId = 1;
        comment.user = user;
        comment.body = 'this is a comment';
        comment.createdAt = new Date();

        article = new Article();
        article.id = 'abc123',
        article.referenceId = 1;
        article.accountId = 1;
        article.title = 'my title';
        article.body = 'my body';
        article.createdAt = new Date();
        article.author = user;
        article.comments = [comment];

        marshaller = new JsonApiMarshaller(mapper);
    });


    it("should marshal a single response", () => {

        const data = {
            data: article,
            includes: [
                'author',
                'comments',
                'comments.user'
            ]
        };

        const normalized = normalizer.normalize(req, data);

        console.log(JSON.stringify(normalized, null, 4));
        console.log('========================================================');

        const marshalled = marshaller.marshal(req, normalized, data);


        console.log(JSON.stringify(marshalled, null, 4));

        //expect(Article.prototype.__CONGA_REST__).not.toBeUndefined();
    });

    it("should unmarshal a request", () => {

        const req = {
            body: {
                type: "article",
                data: {
                    "title": "Test title",
                    "body": "Test body"
                }
            }
        };

        const article = new Article();

        marshaller.unmarshal(req, article);

        console.log(article);

    });


});
