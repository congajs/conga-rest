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
            done();
        });

    }, 1000000000);

    afterAll(() => {
        kernel.container.get('express.server').close();
    });

    it("should upload an image using simple upload method", (done) => {

        const filePath = path.join(__dirname, 'data', 'assets', 'conga_drums.jpg');
        const fileSize = fs.statSync(filePath).size;
        const fileData = fs.readFileSync(filePath);

        request({

            uri: 'http://localhost:5555/upload/api/avatars',
            method: 'POST',
            body: fileData,
            headers: {
                'content-type': 'image/jpeg',
                'content-length': fileSize
            }

        }, (error, response, body) => {

            body = JSON.parse(body);

            expect(response.statusCode).toEqual(201);

            request(body.data.attributes.url, (error, response, body) => {

                expect(response.statusCode).toEqual(200);
                expect(parseInt(response.headers['content-length'])).toEqual(fileSize);
                done();
            });

        });

    });

});
