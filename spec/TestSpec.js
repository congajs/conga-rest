const fs = require('fs');
const path = require('path');
const request = require('request');
const Kernel = require('@conga/framework/lib/kernel/TestKernel');

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
            'conga-bass': path.join(__dirname, '..', 'node_modules', 'conga-bass'),
            'conga-validation': path.join(__dirname, '..', '..', 'conga-validation'), // CHANGE THIS!!!
            //'bass-nedb': path.join(__dirname, '..', 'node_modules', 'bass-nedb'),
            'demo-bundle': path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'src', 'demo-bundle'),
            '@conga/framework-rest': path.join(__dirname, '..')
        });


        kernel.boot(() => {

            // need to wait a bit to make sure nedb connections are created
            setTimeout(() => {

                done();

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
                        'hello-world': 'test'
                    }
                }
            }

        }, (error, response, body) => {
            expect(response.statusCode).toEqual(200);

            const json = JSON.parse(body);

            expect(json.data.attributes['title']).toEqual('Test Title');
            expect(json.data.attributes['body']).toEqual('This is a test article');
            expect(json.data.id).not.toBeUndefined();

            // hang on to the article id
            articleId = json.data.id;

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

            const json = JSON.parse(body);

            expect(json.data.attributes['title']).toEqual('Test Title');
            expect(json.data.attributes['body']).toEqual('This is a test article');
            expect(json.data.id).not.toBeUndefined();

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

            const json = JSON.parse(body);

            console.log(body);

            expect(json.data[0].attributes['title']).toEqual('Test Title');
            expect(json.data[0].attributes['body']).toEqual('This is a test article');
            expect(json.data[0].id).not.toBeUndefined();

            done();
        });

    });

});
