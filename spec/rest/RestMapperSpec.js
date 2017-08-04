const path = require('path');
const jasmine = require('jasmine');

const ResourceAnnotationCompiler = require('../../lib/annotation/ResourceAnnotationCompiler');
const RestResourceRegistry = require('../../lib/rest/RestResourceRegistry');
const RestMapper = require('../../lib/rest/RestMapper');
const RestNormalizer = require('../../lib/specification/RestNormalizer');
const RestRouter = require('../../lib/router/RestRouter');
const Router = require('@conga/framework/lib/router/Router');


const Article = require('../data/projects/sample/src/demo-bundle/lib/model/Article');
const Comment = require('../data/projects/sample/src/demo-bundle/lib/model/Comment');
const User = require('../data/projects/sample/src/demo-bundle/lib/model/User');

describe("RestMapper", () => {

    let mapper;

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
            'pascal'
        );

        mapper = new RestMapper(registry);

    });

    it("should build pointer cache", () => {

        mapper.buildPointerCache();

    });

});
