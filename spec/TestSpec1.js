const fs = require('fs');
const path = require('path');
const request = require('request');
const Kernel = require('conga-framework/lib/kernel/TestKernel');

describe("Kernel", () => {

    let kernel;

    beforeEach(() => {

        const p = path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'var', 'data', 'nedb', 'articles.db');

        // if (fs.existsSync(p)) {
        //     fs.unlinkSync(p);
        // }

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
            'conga-rest': path.join(__dirname, '..')
        });
    });

    it("should boot", (done) => {

        kernel.boot(() => {

            setTimeout(() => {

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
                    expect(json.data.attributes['hello-world']).toEqual('test');
                    expect(json.data.id).not.toBeUndefined();
                    //expect(body).toEqual('{"foo":"bar"}');
                    done();
                });


            }, 100);



        });

    });


});
