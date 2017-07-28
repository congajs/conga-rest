const path = require('path');
const jasmine = require('jasmine');

const ResourceAnnotationCompiler = require('../../lib/annotation/ResourceAnnotationCompiler');
const RestResourceRegistry = require('../../lib/rest/RestResourceRegistry');
const RestNormalizer = require('../../lib/specification/RestNormalizer');
const RestRouter = require('../../lib/router/RestRouter');
const Router = require('@conga/framework/lib/router/Router');


const Article = require('../data/projects/sample/src/demo-bundle/lib/model/Article');
const Comment = require('../data/projects/sample/src/demo-bundle/lib/model/Comment');
const User = require('../data/projects/sample/src/demo-bundle/lib/model/User');

describe("RestNormalizer", () => {

    let normalizer;
    let req;
    let user, article, comment;

    beforeAll(() => {

        const registry = new RestResourceRegistry();
        const compiler = new ResourceAnnotationCompiler();

        const paths = [
            path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'demo-bundle', 'lib', 'model', 'Article.js'),
            path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'demo-bundle', 'lib', 'model', 'Comment.js'),
            path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'demo-bundle', 'lib', 'model', 'User.js'),
        ];

        compiler.compile(
            registry,
            paths,
            'snake'
        );

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
            path: '/api/articles/:id/:attribute' },
        { name: 'conga.rest.Comment.find.one',
          controller: 'controller.demo-bundle.ArticleController',
          action: 'find',
          method: 'GET',
          path: '/api/comments/:id' },
          { name: 'conga.rest.User.find.one',
            controller: 'controller.demo-bundle.ArticleController',
            action: 'find',
            method: 'GET',
            path: '/api/users/:id' },
        ]);

        Article.prototype.__CONGA_REST__.routes = {
            'find.one': 'conga.rest.Article.find.one'
        };

        Comment.prototype.__CONGA_REST__.routes = {
            'find.one': 'conga.rest.Comment.find.one'
        };

        User.prototype.__CONGA_REST__.routes = {
            'find.one': 'conga.rest.User.find.one'
        };

        normalizer = new RestNormalizer(registry, new RestRouter(router));

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

    });


    // it("should normalize a single response", () => {
    //
    //     const normalized = normalizer.normalize(req, {
    //         data: article
    //     });
    //
    //     //console.log(JSON.stringify(normalized, null, 4));
    //
    //     //expect(Article.prototype.__CONGA_REST__).not.toBeUndefined();
    // });

    it("should normalize a single response with sparse fields", () => {

        const normalized = normalizer.normalize(req, {
            data: article,
            sparse: {
                article: ['title', 'created_at'],
                //user: ['email'],
                comment: ['body']
            },
            includes: [
                'comments',
                'comments.user'
            ],
            context: 'DEFAULT'
        });

        console.log(JSON.stringify(normalized, null, 4));

        //expect(Article.prototype.__CONGA_REST__).not.toBeUndefined();
    });

    // it("should normalize a list response", () => {
    //
    //     const normalized = normalizer.normalize(req, {
    //         data: [article]
    //     });
    //
    //     //console.log(JSON.stringify(normalized, null, 4));
    //
    //     //expect(Article.prototype.__CONGA_REST__).not.toBeUndefined();
    // });


});
