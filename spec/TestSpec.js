const fs = require('fs');
const path = require('path');
const request = require('request');
const Kernel = require('@conga/framework/lib/kernel/TestKernel');
const jasmine = require('jasmine');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe("Kernel", () => {

    let kernel;
    let articleId;

    beforeAll((done) => {

        const p = path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'var', 'data', 'nedb', 'articles.db');

        if (fs.existsSync(p)) {
            fs.unlinkSync(p);
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
                    () => {
                        setTimeout(done, 500); // wait again to make sure all inserts are done
                    }
                )

            }, 500);

        });

    });



    it("should create a new resource", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles',
            method: 'POST',
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            body: {
                data: {
                    type: 'article',
                    attributes: {
                        'title': 'Test Title',
                        'body': 'This is a test article',
                        'hello-world': 'test',
                        'reference_id': 0
                    }
                }
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);

            expect(body.data.attributes['title']).toEqual('Test Title');
            expect(body.data.attributes['body']).toEqual('This is a test article');
            expect(body.data.id).not.toBeUndefined();

            // hang on to the article id
            articleId = body.data.id;

            done();
        });

    });

    it("should load a resource", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles/' + articleId,
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);

            expect(body.data.attributes['title']).toEqual('Test Title');
            expect(body.data.attributes['body']).toEqual('This is a test article');
            expect(body.data.id).not.toBeUndefined();

            done();
        });

    });

    it("should load a list of resources", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);

            expect(body.data[0].attributes['title']).toEqual('Test Title');
            expect(body.data[0].attributes['body']).toEqual('This is a test article');
            expect(body.data[0].id).not.toBeUndefined();

            done();
        });

    });

    it("should load a sorted list of resources by a descending numeric attribute", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?sort=-reference_id',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            console.log(body.data[0].relationships.comments);


            expect(response.statusCode).toEqual(200);

            expect(body.data[0].attributes['title']).toEqual('harness 24/365 experiences');
            expect(body.data[0].attributes['reference_id']).toEqual(100);
            expect(body.data[0].id).not.toBeUndefined();

            done();
        });

    });

    it("should load a sorted list of resources by a descending string attribute", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?sort=-title',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);

            expect(body.data[0].attributes['title']).toEqual('zzz empower killer partnerships');
            expect(body.data[0].attributes['reference_id']).toEqual(95);
            expect(body.data[0].id).not.toBeUndefined();

            done();
        });

    });

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
    //         expect(body.data[0].attributes['title']).toEqual('zzz empower killer partnerships');
    //         expect(body.data[0].attributes['reference_id']).toEqual(95);
    //         expect(body.data[0].id).not.toBeUndefined();
    //
    //         done();
    //     });
    //
    // });










    it("should have included relationships in response with include query parameter set", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?include=author,comments,comments.user',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            //console.log(body.included);

            expect(response.statusCode).toEqual(200);
            expect(body.included).not.toBeUndefined();

            // expect(body.data[0].attributes['title']).toEqual('zzz empower killer partnerships');
            // expect(body.data[0].attributes['reference_id']).toEqual(95);
            // expect(body.data[0].id).not.toBeUndefined();

            done();
        });

    });




    it("should limit the results when limit is paased in query string", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?page[limit]=10&page[offset]=0',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);

            expect(body.data.length).toEqual(10);

            done();
        });

    });



    it("should return sparse fields when the fields querystring gis passed in", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?fields[article]=title&fields[user]=email&include=author',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.data[0].attributes.body).toBeUndefined();
            expect(body.data[0].attributes.created_at).toBeUndefined();
            expect(body.included[0].attributes.email).not.toBeUndefined();
            expect(body.included[0].attributes.name).toBeUndefined();
            done();

        });

    });








});
