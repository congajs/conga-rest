const _ = require('lodash');
const fs = require('fs-extra');
const http = require('https');
const path = require('path');
const util = require('util');
const request = require('request');
const Kernel = require('@conga/framework/lib/kernel/TestKernel');
const jasmine = require('jasmine');

describe("Simple Upload", () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000000;

    let kernel;

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

            done();

        });

    }, 1000000000);

    afterAll(() => {
        kernel.container.get('express.server').close();
    });

    fit("should upload an image using resumable upload method", (done) => {

        const filePath = path.join(__dirname, 'data', 'assets', 'conga_drums.jpg');
        const fileSize = fs.statSync(filePath).size;
        const fileData = fs.readFileSync(filePath);

        request({

            uri: 'http://localhost:5555/upload/api/files',
            method: 'POST',
            json: {
                data: {
                    type: 'file',
                    attributes: {
                        name: 'my-test-file',
                        description: 'my file description'
                    }
                }
            },
            headers: {
                'content-type': 'application/json',
                'X-Upload-Content-Type': 'image/jpeg',
                'X-Upload-Content-Length': fileSize
            }

        }, (error, response, body) => {

            request({

                uri: response.headers['location'],
                method: 'PUT',
                body: fileData,
                headers: {
                    'content-type': 'image/jpeg',
                    'content-length': fileSize
                }

            }, (error, response, body) => {

                done();

            });

        });

    });

    fit("it should upload a file to resumable upload in chunks", (done) => {

        const chunkSize = 256 * 16;
        const filePath = path.join(__dirname, 'data', 'assets', 'conga_drums.jpg');
        const fileSize = fs.statSync(filePath).size;
        const fileData = fs.readFileSync(filePath);

        request({

            uri: 'http://localhost:5555/upload/api/files',
            method: 'POST',
            json: {
                data: {
                    type: 'file',
                    attributes: {
                        name: 'my-test-file',
                        description: 'my file description'
                    }
                }
            },
            headers: {
                'content-type': 'application/json',
                'X-Upload-Content-Type': 'image/jpeg',
                'X-Upload-Content-Length': fileSize
            }

        }, (error, response, body) => {

            let data = Array.prototype.slice.call(fileData, 0)
            const chunks = _.chunk(data, chunkSize);
            let rangeStart = 0;

            const sendChunk = (chunk) => {

                const rangeHeader = `bytes ${rangeStart}-${rangeStart + chunk.length}/${fileSize}`;

                request({

                    uri: response.headers['location'],
                    method: 'PUT',
                    body: new Buffer(chunk),
                    headers: {
                        'content-type': 'image/jpeg',
                        'content-length': chunk.length,
                        'content-range': rangeHeader
                    }

                }, (error, response, body) => {

                    rangeStart += chunk.length;

                    if (response.statusCode === 201) {

                        body = JSON.parse(body);
                        expect(body.data.attributes.name).toEqual('my-test-file');

                        request(body.data.attributes.url, (error, response, body) => {
                            expect(response.statusCode).toEqual(200);
                            expect(parseInt(response.headers['content-length'])).toEqual(fileSize);
                            done();
                        });

                    } else {
                        sendChunk(chunks.shift());
                    }

                });

            }

            sendChunk(chunks.shift());

        });

    });

});
