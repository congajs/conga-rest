const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const Kernel = require('@conga/framework/lib/kernel/TestKernel');
const jasmine = require('jasmine');

describe("Kernel", () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000000;

    let kernel;
    let articleId;

    beforeAll((done) => {

        const p = path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'var', 'data', 'nedb');

        if (fs.existsSync(p)) {
            fs.removeSync(p);
        }

        kernel = new Kernel(
            path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample'),
            'app',
            'test',
            {}
        );

        kernel.addBundlePaths({
            '@conga/framework-bass': path.join(__dirname, '..', 'node_modules', '@conga', 'framework-bass'),
            '@conga/framework-validation': path.join(__dirname, '..', 'node_modules', '@conga', 'framework-validation'), // CHANGE THIS!!!
            '@conga/framework-rest': path.join(__dirname, '..'),
            'demo-bundle': path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'src', 'demo-bundle'),
        });

        kernel.boot(() => {

            // need to wait a bit to make sure nedb connections are created
            setTimeout(() => {

                kernel.container.get('bass.fixture.runner').runFixtures(
                    path.join(__dirname, 'data', 'projects', 'sample', 'app', 'bass', 'fixtures'),
                    null,
                    done
                )

            }, 500);

        });

    }, 1000000000);

    // =============================================================================================
    // LIST
    // =============================================================================================
    it("should load a list of resources", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            //console.log(body.data[0].attributes);

            expect(response.statusCode).toEqual(200);

            expect(body.data[0].attributes['title']).toEqual('Operative 3rd generation framework');
            expect(body.data[0].attributes['reference_id']).toEqual(2);
            expect(body.data[0].id).not.toBeUndefined();

            done();
        });

    });

    // it("should load a sorted list of resources by a descending numeric attribute", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?sort=-reference_id',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //
    //         expect(body.data[0].attributes['title']).toEqual('Compatible impactful utilisation');
    //         expect(body.data[0].attributes['reference_id']).toEqual(978);
    //         expect(body.data[0].id).not.toBeUndefined();
    //
    //         expect(body.data[0].attributes['reference_id']).toEqual(978);
    //         expect(body.data[1].attributes['reference_id']).toEqual(962);
    //         expect(body.data[2].attributes['reference_id']).toEqual(959);
    //
    //         done();
    //     });
    //
    // });


    // it("should load a sorted list of resources by a descending string attribute", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?sort=-title',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //
    //         expect(body.data[0].attributes['title']).toEqual('Visionary zero defect portal');
    //         expect(body.data[0].attributes['reference_id']).toEqual(22);
    //         expect(body.data[0].id).not.toBeUndefined();
    //
    //         done();
    //     });
    //
    // });
    //
    // it("should load a sorted list of resources by an ascending string attribute", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?sort=title',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //
    //         expect(body.data[0].attributes['title']).toEqual('Advanced fault-tolerant forecast');
    //         expect(body.data[0].attributes['reference_id']).toEqual(747);
    //         expect(body.data[0].id).not.toBeUndefined();
    //
    //         done();
    //     });
    //
    // });
    //
    // it("should have included relationships in response with include query parameter set", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?include=author,comments,comments.user',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //         expect(body.included).not.toBeUndefined();
    //         expect(body.included.length).toEqual(295);
    //
    //         done();
    //     });
    //
    // });
    //
    // it("should limit the results when limit is passed in query string", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?page[limit]=10&page[offset]=0',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //
    //         expect(body.data.length).toEqual(10);
    //
    //         done();
    //     });
    //
    // });
    //
    // it("should limit the results when limit is passed in query string", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?page[limit]=10&page[offset]=0',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //
    //         expect(body.data.length).toEqual(10);
    //
    //         done();
    //     });
    //
    // });
    //
    // it("should return sparse fields when the fields querystring is passed in", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?fields[article]=title&fields[user]=email&include=author',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         console.log(JSON.stringify(body, null, 4));
    //
    //
    //         expect(response.statusCode).toEqual(200);
    //
    //         expect(body.data[0].attributes.body).toBeUndefined();
    //         expect(body.data[0].attributes.created_at).toBeUndefined();
    //         expect(body.included[0].attributes.email).not.toBeUndefined();
    //         expect(body.included[0].attributes.name).toBeUndefined();
    //         done();
    //
    //     });
    //
    // });
    //
    // // =============================================================================================
    // // FILTERS
    // // =============================================================================================
    // it("should filter data using an EQUALS filter", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?filter[reference_id]=2',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //         expect(body.data.length).toEqual(1);
    //         expect(body.data[0].attributes.reference_id).toEqual(2);
    //
    //         done();
    //
    //     });
    //
    // });
    //
    // it("should filter data using a GTE filter", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?filter[reference_id]=gte:900',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //         expect(body.data.length).toEqual(17);
    //
    //         done();
    //
    //     });
    //
    // });
    //
    // it("should filter data using an IN filter", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?filter[title]=in:Visionary zero defect portal,Visionary executive hierarchy,Vision-oriented client-driven system engine',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //         expect(body.data.length).toEqual(3);
    //
    //         done();
    //
    //     });
    //
    // });
    //
    // it("should filter data using a LIKE filter", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles?filter[title]=like:re*',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         // body.data.forEach((article) => {
    //         //     console.log(article.attributes.title);
    //         // });
    //
    //         expect(response.statusCode).toEqual(200);
    //         expect(body.data.length).toEqual(18);
    //
    //         done();
    //
    //     });
    //
    // });
    //
    // it("should filter data using multiple filters", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/users?filter[name]=like:ma*&filter[gender]=Female&sort=reference_id',
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         body.data.forEach((resource) => {
    //             console.log(resource.attributes.reference_id + ' - ' + resource.attributes.name + ' - ' + resource.attributes.gender);
    //         });
    //
    //         expect(response.statusCode).toEqual(200);
    //         expect(body.data.length).toEqual(2);
    //         expect(body.data[0].attributes.reference_id).toEqual(16);
    //         expect(body.data[1].attributes.reference_id).toEqual(30);
    //         done();
    //
    //     });
    //
    // });
    //
    // // =============================================================================================
    // // CREATE
    // // =============================================================================================
    // it("should create a new resource", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles',
    //         method: 'POST',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         },
    //         body: {
    //             data: {
    //                 type: 'article',
    //                 attributes: {
    //                     'title': 'Test Title',
    //                     'body': 'This is a test article',
    //                     'hello-world': 'test',
    //                     'reference_id': 0
    //                 }
    //             }
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //
    //         expect(body.data.attributes['title']).toEqual('Test Title');
    //         expect(body.data.attributes['body']).toEqual('This is a test article');
    //         expect(body.data.id).not.toBeUndefined();
    //
    //         // hang on to the article id
    //         articleId = body.data.id;
    //
    //         done();
    //     });
    //
    // });
    //
    //
    //
    //
    // it("should load a resource", (done) => {
    //
    //     request({
    //
    //         uri: 'http://localhost:5555/api/articles/' + articleId,
    //         method: 'GET',
    //         json: true,
    //         headers: {
    //             'content-type': 'application/json'
    //         }
    //
    //     }, (error, response, body) => {
    //
    //         expect(response.statusCode).toEqual(200);
    //
    //         expect(body.data.attributes['title']).toEqual('Test Title');
    //         expect(body.data.attributes['body']).toEqual('This is a test article');
    //         expect(body.data.id).not.toBeUndefined();
    //
    //         done();
    //     });
    //
    // });





});
