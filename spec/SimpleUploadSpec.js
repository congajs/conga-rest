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

            // kernel.container.get('bass.fixture.runner').runFixtures(
            //     path.join(__dirname, 'data', 'projects', 'sample', 'app', 'bass', 'fixtures'),
            //     null,
            //     done
            // )

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

            uri: 'http://localhost:5555/api/avatars/upload',
            method: 'POST',
            body: fileData,
            headers: {
                'content-type': 'image/jpeg',
                'content-length': fileSize,
                'foo': 'bar'
            }

        }, (error, response, body) => {

            //console.log(body);
            //console.log(response);

            expect(response.statusCode).toEqual(200);

            const savedPath = path.join(kernel.container.getParameter('kernel.var_path'), 'uploaded.jpg');

            fs.stat(savedPath, (err, stats) => {
                expect(err).toEqual(null);
                expect(stats.size).toEqual(fileSize);
                done();
            });


        });

    });

    fit("should upload an mp3 file using simple upload method", (done) => {

        const filePath = path.join(kernel.container.getParameter('kernel.var_path'), 'test.mp3');

        const file = fs.createWriteStream(filePath);
        const request = http.get("https://download.imp3juices.com/@download/320-5a1c2280284fc-8640000/mp3/NiM4QET2B7k/J%2BHus%2B-%2BBouf%2BDaddy%2B%2528Common%2BSense%2BAlbum%2529.mp3", function(response) {
            response.pipe(file);
        });

        request.on('finish', (err) => {

            const fileSize = fs.statSync(filePath).size;
            const fileData = fs.readFileSync(filePath);

            console.log(err);
            console.log('finished');
            console.log(fileSize);

            // request({
            //
            //     uri: 'http://localhost:5555/api/avatars/upload',
            //     method: 'POST',
            //     body: fileData,
            //     headers: {
            //         'content-type': 'image/jpeg',
            //         'content-length': fileSize,
            //         'foo': 'bar'
            //     }
            //
            // }, (error, response, body) => {
            //
            //     //console.log(body);
            //     //console.log(response);
            //
            //     expect(response.statusCode).toEqual(200);
            //
            //     const savedPath = path.join(kernel.container.getParameter('kernel.var_path'), 'uploaded.jpg');
            //
            //     fs.stat(savedPath, (err, stats) => {
            //         expect(err).toEqual(null);
            //         expect(stats.size).toEqual(fileSize);
            //         done();
            //     });
            //
            //
            // });


        });



    });

});
