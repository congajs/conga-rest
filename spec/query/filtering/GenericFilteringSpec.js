const path = require('path');
const qs = require('query-string');
const jasmine = require('jasmine');

const ConjunctionFilter = require('../../../lib/query/ConjunctionFilter');
const Filter = require('../../../lib/query/Filter');
const FilterSet = require('../../../lib/query/FilterSet');

const GenericFiltering = require('../../../lib/query/filtering/GenericFiltering');
const Serializer = require('../../../lib/specification/Serializer');
const RestMapper = require('../../../lib/rest/RestMapper');
const RestResourceRegistry = require('../../../lib/rest/RestResourceRegistry');
const ResourceAnnotationCompiler = require('../../../lib/annotation/ResourceAnnotationCompiler');
describe("GenericFiltering", () => {

    let filters;
    let parser;

    beforeAll(() => {

        const registry = new RestResourceRegistry();
        const compiler = new ResourceAnnotationCompiler();

        const paths = [
            path.join(__dirname, '..', '..', 'data', 'projects', 'sample', 'src', 'demo-bundle', 'lib', 'model', 'Profile.js'),
        ];

        compiler.compile(
            registry,
            paths,
            'snake'
        );

        mapper = new RestMapper(registry);

        parser = new GenericFiltering(
            'query',
            mapper
        );

        const query = {
            gender: 'F',
            age: 'gte:18+AND+lt:40',
            state: 'in:CA,OR,NV',
            name: 'like:M*',
            hobbies: 'contains:djing,music',
            created_at: 'gte:2017-01-01 00:00:00',
            is_cool: 'true',
            'work.status': 'WORKING'
        };


        const req = {
            query: {
                filter: query
            }
        };

        filters = parser.parse(req, 'profile');

        // console.log(filters);
        // console.log(filters.get('age').filters);
    });

    it('should have created a FilterSet', () => {
        expect(filters instanceof FilterSet).toBeTruthy();
    });

    it('should have created an equals filter', () => {
        expect(filters.get('gender') instanceof Filter).toBeTruthy();
        expect(filters.get('gender').comparison).toEqual(Filter.EQUALS);
        expect(filters.get('gender').value).toEqual('F');
    });

    it('should have created a like filter', () => {
        expect(filters.get('name') instanceof Filter).toBeTruthy();
        expect(filters.get('name').comparison).toEqual(Filter.LIKE);
        expect(filters.get('name').value).toEqual('M*');
    });

    it('should have created an equals filter with a boolean value', () => {
        expect(filters.get('isCool') instanceof Filter).toBeTruthy();
        expect(filters.get('isCool').comparison).toEqual(Filter.EQUALS);
        expect(filters.get('isCool').value).toEqual(true);
    });

    it('should have created a conjunction filter', () => {
        expect(filters.get('age') instanceof ConjunctionFilter).toBeTruthy();
        expect(filters.get('age').conjunction).toEqual(Filter.AND);

        expect(filters.get('age').filters[0] instanceof Filter).toBeTruthy();
        expect(filters.get('age').filters[0].comparison).toEqual(Filter.GTE);
        expect(filters.get('age').filters[0].value).toEqual(18);

        expect(filters.get('age').filters[1] instanceof Filter).toBeTruthy();
        expect(filters.get('age').filters[1].comparison).toEqual(Filter.LT);
        expect(filters.get('age').filters[1].value).toEqual(40);
    });

    it('should have created an IN filter', () => {
        expect(filters.get('state') instanceof Filter).toBeTruthy();
        expect(filters.get('state').comparison).toEqual(Filter.IN);
        expect(filters.get('state').value).toEqual(['CA', 'OR', 'NV']);
    });

    it('should have created a contains filter', () => {
        expect(filters.get('hobbies') instanceof Filter).toBeTruthy();
        expect(filters.get('hobbies').comparison).toEqual(Filter.CONTAINS);
        expect(filters.get('hobbies').value).toEqual(['djing', 'music']);
    });

    it('should have created a GTE filter', () => {
        expect(filters.get('createdAt') instanceof Filter).toBeTruthy();
        expect(filters.get('createdAt').comparison).toEqual(Filter.GTE);
        expect(filters.get('createdAt').value).toEqual('2017-01-01 00:00:00');
    });
});
