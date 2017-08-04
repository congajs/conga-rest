const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const Kernel = require('@conga/framework/lib/kernel/TestKernel');
const jasmine = require('jasmine');
const BassRestController = require('../../lib/controller/BassRestController');
const OffsetPager = require('../../lib/query/pagination/OffsetPager');

describe("Kernel", () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000000;

    let kernel;
    let controller;
    let id;
    let userId;

    beforeAll((done) => {

        const p = path.join(__dirname, '..', '..', 'spec', 'data', 'projects', 'sample', 'var', 'data', 'nedb');

        if (fs.existsSync(p)) {
            fs.removeSync(p);
        }

        kernel = new Kernel(
            path.join(__dirname, '..', '..', 'spec', 'data', 'projects', 'sample'),
            'app',
            'test',
            {}
        );

        kernel.addBundlePaths({
            '@conga/framework-bass': path.join(__dirname, '..', '..', 'node_modules', '@conga', 'framework-bass'),
            '@conga/framework-validation': path.join(__dirname, '..', '..', 'node_modules', '@conga', 'framework-validation'), // CHANGE THIS!!!
            '@conga/framework-rest': path.join(__dirname, '..', '..'),
            'demo-bundle': path.join(__dirname, '..', '..', 'spec', 'data', 'projects', 'sample', 'src', 'demo-bundle'),
        });

        kernel.boot(() => {

            // need to wait a bit to make sure nedb connections are created
            setTimeout(() => {

                kernel.container.get('bass.fixture.runner').runFixtures(
                    path.join(__dirname, '..', 'data', 'projects', 'sample', 'app', 'bass', 'fixtures'),
                    null,
                    () => {
                        controller = kernel.container.get('controller.demo-bundle.ArticleController');
                        done();
                    }
                )

            }, 500);

        });

    }, 1000000000);

    // LIST
    // =============================================================================================
    it("should load a list of resources", (done) => {

        const req = {
            query: {
                page: {
                    offset: 0,
                    limit: 5
                },
                sort: 'reference_id'
            },
            conga: {
                route: {

                }
            }
        };

        const res = {
            return: (data) => {

                expect(data.context).toEqual('ADMIN');
                expect(data.type).toEqual('article');
                expect(data.data.length).toEqual(5);
                expect(data.pager instanceof OffsetPager).toEqual(true);

                id = data.data[0].id;
                userId = data.data[0].author.id;

                done();
            }
        };

        controller.list(req, res);

    });

    // GET
    // =============================================================================================
    it("should load a single resource", (done) => {

        const req = {

            params: {
                id: id
            },

            conga: {
                route: {

                }
            }
        };

        const res = {

            error: (err) => {
                console.log(err);
            },

            return: (data) => {

                expect(data.context).toEqual('ADMIN');
                expect(data.type).toEqual('article');
                expect(data.data.id).toEqual(id);
                done();
            }
        };

        controller.get(req, res);

    });

    // GET 404 ERROR
    // =============================================================================================
    it("should return a 404 error response", (done) => {

        const req = {

            params: {
                id: 'this-is-an-invalid-id'
            },

            conga: {
                route: {

                }
            }
        };

        const res = {

            error: (err) => {
                expect(err.status).toEqual(404);
                done();
            },

            return: (data) => {

            }
        };

        controller.get(req, res);

    });

    // GET 400 ERROR FOR BAD ?include query
    // =============================================================================================
    it("should return a 400 error response for invalid include query", (done) => {

        const req = {

            query: {
                include: "this.is.not.valid"
            },

            params: {
                id: id
            },

            conga: {
                route: {

                }
            }
        };

        const res = {

            error: (err) => {
                expect(err.status).toEqual(400);
                expect(err.data.source).toEqual({ parameter: 'include' });
                expect(err.data.value).toEqual('this.is.not.valid');
                done();
            },

            return: (data) => {

            }
        };

        controller.get(req, res);

    });

    // GET 400 ERROR FOR BAD ?fields query
    // =============================================================================================
    it("should return a 400 error response for invalid sparse query", (done) => {

        const req = {

            query: {
                fields: {
                    article: "title,body,not-valid"
                }
            },

            params: {
                id: id
            },

            conga: {
                route: {

                }
            }
        };

        const res = {

            error: (err) => {
                expect(err.status).toEqual(400);
                expect(err.data.source).toEqual({ parameter: 'fields' });
                expect(err.data.value).toEqual('article:not-valid');
                done();
            },

            return: (data) => {

            }
        };

        controller.get(req, res);

    });

    // POST
    // =============================================================================================
    it("should create a resource", (done) => {

        const req = {

            body: {
                data: {
                    type: "article",
                    attributes: {
                        title: "Created from Controller Test",
                        body: "this is a test",
                        internal_comment: "comment from ADMIN only"
                    },
                    relationships: {
                        author: {
                            data: { type: "user", id: userId }
                        }
                    }
                }
            },

            conga: {
                route: {

                }
            }
        };

        const res = {

            error: (err) => {
                console.log(err);
            },

            return: (data, status) => {
                expect(status).toEqual(201);
                expect(data.context).toEqual('ADMIN');
                expect(data.type).toEqual('article');
                expect(data.data.id).not.toEqual(null);
                done();
            }
        };

        controller.post(req, res);

    });

    // PATCH
    // =============================================================================================
    it("should update a resource", (done) => {

        const req = {

            params: {
                id: id
            },

            body: {
                data: {
                    id: id,
                    type: "article",
                    attributes: {
                        title: "TITLE UPDATED FROM API",
                        body: "BODY UPDATED FROM API",
                        internal_comment: "INTERNAL COMMENT UPDATED FROM API"
                    },
                    relationships: {
                        author: {
                            data: { type: "user", id: userId }
                        }
                    }
                }
            },

            conga: {
                route: {

                }
            }
        };

        const res = {

            error: (err) => {
                console.log(err);
            },

            return: (data, status) => {
                expect(status).toEqual(201);
                expect(data.context).toEqual('ADMIN');
                expect(data.type).toEqual('article');
                expect(data.data.id).toEqual(id);
                expect(data.data.title).toEqual('TITLE UPDATED FROM API');
                expect(data.data.version).toEqual(2);
                done();
            }
        };

        controller.patch(req, res);

    });

    // DELETE
    // =============================================================================================
    it("should delete a resource", (done) => {

        const req = {

            params: {
                id: id
            },

            body: {
                data: {
                    id: id,
                    type: "article",
                    attributes: {
                        title: "TITLE UPDATED FROM API",
                        body: "BODY UPDATED FROM API",
                        internal_comment: "INTERNAL COMMENT UPDATED FROM API"
                    },
                    relationships: {
                        author: {
                            data: { type: "user", id: userId }
                        }
                    }
                }
            },

            conga: {
                route: {

                }
            }
        };

        const res = {

            error: (err) => {
                console.log(err);
            },

            return: (data, status) => {
                expect(status).toEqual(200);
                expect(data.context).toEqual('ADMIN');
                expect(data.type).toEqual('article');
                done();
            }
        };

        controller.delete(req, res);

    });
});
