const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const request = require('request');
const Kernel = require('@conga/framework/lib/kernel/TestKernel');
const jasmine = require('jasmine');

xdescribe("BASIC REST", () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000000;

    let kernel;
    let articleId;

    beforeAll((done) => {

        const p = path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'var', 'data', 'nedb-basic');

        if (fs.existsSync(p)) {
            fs.removeSync(p);
        }

        kernel = new Kernel(
            path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample'),
            'app-basic',
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

            kernel.container.get('bass.fixture.runner').runFixtures(
                path.join(__dirname, 'data', 'projects', 'sample', 'app', 'bass', 'fixtures'),
                null,
                done
            )

        });

    }, 1000000000);

    afterAll(() => {
        kernel.container.get('express.server').close();
    });

    // =============================================================================================
    // LIST
    // =============================================================================================
    it("should load a list of resources", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?page[limit]=1',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            console.log(util.inspect(body, false, null))

            expect(response.statusCode).toEqual(200);
            expect(body.data[0].attributes['title']).toEqual('Operative 3rd generation framework');
            expect(body.data[0].attributes['reference_id']).toEqual(2);
            expect(body.data[0].id).not.toBeUndefined();


            //console.log(util.inspect(body, false, null))
            //
            // process.exit();
            done();
        });

    });

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

            expect(response.statusCode).toEqual(200);
            expect(body.data[0].attributes['title']).toEqual('Operative 3rd generation framework');
            expect(body.data[0].attributes['reference_id']).toEqual(2);
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

            expect(response.statusCode).toEqual(200);

            expect(body.data[0].attributes['title']).toEqual('Compatible impactful utilisation');
            expect(body.data[0].attributes['reference_id']).toEqual(978);
            expect(body.data[0].id).not.toBeUndefined();

            expect(body.data[0].attributes['reference_id']).toEqual(978);
            expect(body.data[1].attributes['reference_id']).toEqual(962);
            expect(body.data[2].attributes['reference_id']).toEqual(959);

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

            expect(body.data[0].attributes['title']).toEqual('Visionary zero defect portal');
            expect(body.data[0].attributes['reference_id']).toEqual(22);
            expect(body.data[0].id).not.toBeUndefined();

            done();
        });

    });

    it("should load a sorted list of resources by an ascending string attribute", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?sort=title',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);

            expect(body.data[0].attributes['title']).toEqual('Advanced fault-tolerant forecast');
            expect(body.data[0].attributes['reference_id']).toEqual(747);
            expect(body.data[0].id).not.toBeUndefined();

            done();
        });

    });

    it("should have included relationships in response with include query parameter set", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?include=author,comments,comments.user',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.included).not.toBeUndefined();
            expect(body.included.length).toEqual(295);

            done();
        });

    });

    it("should limit the results when limit is passed in query string", (done) => {

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

    it("should limit the results when limit is passed in query string", (done) => {

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

    it("should return sparse fields when the fields querystring is passed in", (done) => {

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

    // =============================================================================================
    // FILTERS
    // =============================================================================================
    it("should filter data using an EQUALS filter", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?filter[reference_id]=2',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.data.length).toEqual(1);
            expect(body.data[0].attributes.reference_id).toEqual(2);

            done();

        });

    });

    it("should filter data using a GTE filter", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?filter[reference_id]=gte:900',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.data.length).toEqual(17);

            done();

        });

    });

    it("should filter data using an IN filter", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?filter[title]=in:Visionary zero defect portal,Visionary executive hierarchy,Vision-oriented client-driven system engine',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.data.length).toEqual(2);

            done();

        });

    });

    it("should filter data using a LIKE filter", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?filter[title]=like:re*',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            // body.data.forEach((article) => {
            //     console.log(article.attributes.title);
            // });

            expect(response.statusCode).toEqual(200);
            expect(body.data.length).toEqual(18);

            done();

        });

    });

    it("should filter data using multiple filters", (done) => {

        request({

            uri: 'http://localhost:5555/api/users?filter[name]=like:ma*&filter[gender]=Female&sort=reference_id',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            body.data.forEach((resource) => {
                console.log(resource.attributes.reference_id + ' - ' + resource.attributes.name + ' - ' + resource.attributes.gender);
            });

            expect(response.statusCode).toEqual(200);
            expect(body.data.length).toEqual(2);
            expect(body.data[0].attributes.reference_id).toEqual(16);
            expect(body.data[1].attributes.reference_id).toEqual(30);
            done();

        });

    });

    // =============================================================================================
    // CREATE
    // =============================================================================================
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

            expect(response.statusCode).toEqual(201);
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

    // =============================================================================================
    // RELATIONSHIPS
    // =============================================================================================
    it("should create a resource with a one to one relationship", (done) => {

        request({

            uri: 'http://localhost:5555/api/users',
            method: 'POST',
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            body: {
                data: {
                    type: 'user',
                    attributes: {
                        'email': 'test@test.com',
                        'name': 'Test User',
                        'gender': 'M',
                        'reference_id': 0
                    }
                }
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(201);
            expect(body.data.attributes['email']).toEqual('test@test.com');
            expect(body.data.id).not.toBeUndefined();

            // hang on to the article id
            const userId = body.data.id;

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
                        },
                        relationships: {
                            'author': {
                                data: { type: 'user', id: userId }
                            }
                        }

                    }
                }

            }, (error, response, body) => {

                console.log(util.inspect(body, false, null))

                expect(response.statusCode).toEqual(201);
                expect(body.data.attributes['body']).toEqual('This is a test article');
                expect(body.data.id).not.toBeUndefined();
                expect(body.data.relationships.author.data).not.toBeUndefined();
                expect(body.data.relationships.author.data).not.toBeNull();

                done();
            });


        });


    });

    it("should create a resource with a one to many relationship", (done) => {

        request({

            uri: 'http://localhost:5555/api/comments',
            method: 'POST',
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            body: {
                data: {
                    type: 'comment',
                    attributes: {
                        'body': 'this is a new comment',
                        'reference_id': 0
                    }
                }
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(201);
            expect(body.data.attributes['body']).toEqual('this is a new comment');
            expect(body.data.id).not.toBeUndefined();

            // hang on to the article id
            const commentId = body.data.id;

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
                        },
                        relationships: {
                            'comments': {
                                data: [{ type: 'comment', id: commentId }]
                            }
                        }

                    }
                }

            }, (error, response, body) => {

                //console.log(util.inspect(body, false, null))

                expect(response.statusCode).toEqual(201);
                expect(body.data.attributes['body']).toEqual('This is a test article');
                expect(body.data.id).not.toBeUndefined();
                expect(body.data.relationships.comments.data).not.toBeUndefined();
                expect(body.data.relationships.comments.data).not.toBeNull();

                done();
            });

        });

    });

    it("should load a one to one relationship", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles/?filter[reference_id]=7',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.data[0].relationships.author.data).not.toBeUndefined();

            const relatedUrl = body.data[0].relationships.author.links.related;

            request({

                uri: body.data[0].relationships.author.links.self,
                method: 'GET',
                json: true,
                headers: {
                    'content-type': 'application/json'
                }

            }, (error, response, body) => {

                expect(response.statusCode).toEqual(200);
                expect(body.data.type).toEqual('user');

                request({

                    uri: relatedUrl,
                    method: 'GET',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    }

                }, (error, response, body) => {

                    expect(response.statusCode).toEqual(200);
                    expect(body.data.type).toEqual('user');
                    expect(body.data.attributes).not.toBeUndefined();

                    done();
                });
            });


        });

    });


    it("should load a one to many relationship", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles/?filter[reference_id]=7',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.data[0].relationships.comments.data).not.toBeUndefined();
            expect(body.data[0].relationships.comments.data.length).toEqual(2);
            expect(body.data[0].relationships.comments.data[0].type).toEqual('comment');

            const relatedUrl = body.data[0].relationships.comments.links.related;

            request({

                uri: body.data[0].relationships.comments.links.self,
                method: 'GET',
                json: true,
                headers: {
                    'content-type': 'application/json'
                }

            }, (error, response, body) => {

                expect(response.statusCode).toEqual(200);
                expect(body.data.length).toEqual(2);
                expect(body.data[0].type).toEqual('comment');

                request({

                    uri: relatedUrl,
                    method: 'GET',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    }

                }, (error, response, body) => {

                    expect(response.statusCode).toEqual(200);
                    expect(body.data.length).toEqual(2);
                    expect(body.data[0].attributes).not.toBeUndefined();

                    done();
                });
            });

        });

    });



    it("should update a one to many relationship", (done) => {

        request({

            uri: 'http://localhost:5555/api/comments',
            method: 'POST',
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            body: {
                data: {
                    type: 'comment',
                    attributes: {
                        'body': 'this is a new comment',
                        'reference_id': 0
                    }
                }
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(201);
            expect(body.data.attributes['body']).toEqual('this is a new comment');
            expect(body.data.id).not.toBeUndefined();

            // hang on to the article id
            const commentId = body.data.id;

            request({

                uri: 'http://localhost:5555/api/articles?filter[reference_id]=2',
                method: 'GET',
                json: true,
                headers: {
                    'content-type': 'application/json'
                }

            }, (error, response, body) => {

                const articleId = body.data[0].id;

                request({

                    uri: 'http://localhost:5555/api/articles/' + articleId + '/relationships/comments',
                    method: 'PATCH',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {
                        data: [{ type: 'comment', id: commentId }]
                    }

                }, (error, response, body) => {

                    expect(response.statusCode).toEqual(202);
                    expect(body.data.length).toEqual(1);
                    expect(body.data[0].id).toEqual(commentId);

                    done();
                });

            });

        });

    });





    it("should update a one to one relationship", (done) => {

        request({

            uri: 'http://localhost:5555/api/users',
            method: 'POST',
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            body: {
                data: {
                    type: 'user',
                    attributes: {
                        'email': 'test@test.com',
                        'reference_id': 0
                    }
                }
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(201);
            expect(body.data.attributes['email']).toEqual('test@test.com');
            expect(body.data.id).not.toBeUndefined();

            // hang on to the article id
            const userId = body.data.id;

            request({

                uri: 'http://localhost:5555/api/articles?filter[reference_id]=2',
                method: 'GET',
                json: true,
                headers: {
                    'content-type': 'application/json'
                }

            }, (error, response, body) => {

                const articleId = body.data[0].id;

                request({

                    uri: 'http://localhost:5555/api/articles/' + articleId + '/relationships/author',
                    method: 'PATCH',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {
                        data: { type: 'user', id: userId }
                    }

                }, (error, response, body) => {

                    expect(response.statusCode).toEqual(202);
                    expect(body.data.id).toEqual(userId);
                    expect(body.data.type).toEqual('user');

                    done();
                });

            });

        });

    });



    it("should delete a one to one relationship", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?filter[reference_id]=770',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            const articleId = body.data[0].id;
            const userId = body.data[0].relationships.author.data.id;

            request({

                uri: 'http://localhost:5555/api/articles/' + articleId + '/relationships/author',
                method: 'DELETE',
                json: true,
                headers: {
                    'content-type': 'application/json'
                },
                body: {
                    data: { type: 'user', id: userId }
                }

            }, (error, response, body) => {

                expect(response.statusCode).toEqual(202);
                expect(body.data).toEqual(null);

                done();
            });

        });


    });











    // =============================================================================================
    // ERRORS
    // =============================================================================================
    it("should return a 404 error for a resource", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles/111111111111',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(404);

            done();
        });

    });

    it("should return a 400 error for an invalid include path", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?include=NOT-VALID,NOT_VALID_EITHER',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(400);
            expect(body.errors[0].title).toEqual('Invalid Query Parameter');
            expect(body.errors[1].title).toEqual('Invalid Query Parameter');

            done();
        });

    });

    it("should return a 400 error for invalid sparse fields", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?fields[article]=title,not-valid&fields[user]=&fields[fake]=foo',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(400);
            expect(body.errors[0].title).toEqual('Invalid Query Parameter');
            expect(body.errors[1].title).toEqual('Invalid Query Parameter');
            expect(body.errors[2].title).toEqual('Invalid Query Parameter');

            done();
        });

    });

    it("should return a 400 error for a invalid page parameters", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?page[offset]=NOT_VALID&page[limit]=NOT_VALID_EITHER',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(400);
            expect(body.errors[0].title).toEqual('Invalid Query Parameter');
            expect(body.errors[1].title).toEqual('Invalid Query Parameter');

            done();
        });

    });

    it("should return a 400 error for a invalid sort parameters", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?sort=-id,title,NOT_VALID',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(400);
            expect(body.errors[0].title).toEqual('Invalid Query Parameter');

            done();
        });

    });

    it("should return a 422 error for invalid post data", (done) => {

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
                        'title': 'abc',
                        'body': '',
                        'hello-world': 'test',
                        'reference_id': 0
                    }
                }
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(422);
            expect(body.errors[0].code).toEqual('400');
            expect(body.errors[0].source.pointer).toEqual('/data/attributes/title');
            expect(body.errors[0].detail).toEqual('This value must be at least 4 characters long');

            done();
        });

    });






    // =============================================================================================
    // BULK
    // =============================================================================================
    it("should bulk create resources", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles',
            method: 'POST',
            json: true,
            headers: {
                'content-type': 'application/json; ext=bulk'
            },
            body: {
                data: [
                    {
                        type: 'article',
                        attributes: {
                            'title': 'bulk #1',
                            'body': 'bulk #1 body',
                            'reference_id': 2000
                        }
                    },
                    {
                        type: 'article',
                        attributes: {
                            'title': 'bulk #2',
                            'body': 'bulk #2 body',
                            'reference_id': 2001
                        }
                    },
                ]
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(201);
            expect(body.data[0].attributes['title']).toEqual('bulk #1');
            expect(body.data[0].attributes['body']).toEqual('bulk #1 body');
            expect(body.data[0].id).not.toBeUndefined();

            expect(body.data[1].attributes['title']).toEqual('bulk #2');
            expect(body.data[1].attributes['body']).toEqual('bulk #2 body');
            expect(body.data[1].id).not.toBeUndefined();

            done();
        });

    });


    it("should bulk update resources", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?page[limit]=2',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            body.data[0].attributes.title = 'updated #1';
            body.data[1].attributes.title = 'updated #2'

            request({

                uri: 'http://localhost:5555/api/articles',
                method: 'PATCH',
                json: true,
                headers: {
                    'content-type': 'application/json; ext=bulk'
                },
                body: body

            }, (error, response, body) => {

                console.log(util.inspect(body, false, null))

                expect(response.statusCode).toEqual(200);
                expect(body.data[0].attributes['title']).toEqual('updated #1');
                expect(body.data[0].id).not.toBeUndefined();
                expect(body.data[1].attributes['title']).toEqual('updated #2');
                expect(body.data[1].id).not.toBeUndefined();

                done();
            });

        });

    });


    it("should bulk delete resources", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?page[limit]=2',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            const deleteBody = { data: [] };

            body.data.forEach((resource) => {
                deleteBody.data.push({
                    type: resource.type,
                    id: resource.id
                });
            });

            request({

                uri: 'http://localhost:5555/api/articles',
                method: 'DELETE',
                json: true,
                headers: {
                    'content-type': 'application/json; ext=bulk'
                },
                body: deleteBody

            }, (error, response, body) => {

                console.log(util.inspect(body, false, null))

                expect(response.statusCode).toEqual(200);
                expect(body.data).toEqual(null);

                done();
            });

        });

    });


    // =============================================================================================
    // CREATE ERRORS
    // =============================================================================================

    it("should throw validation errors on create", (done) => {

        request({

            uri: 'http://localhost:5555/api/comments',
            method: 'POST',
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            body: {
                data: {
                    type: 'article',
                    attributes: {
                        'body': null
                    }
                }
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(422);
            expect(body.errors[0].code).toEqual('400');
            expect(body.errors[0].source.pointer).toEqual('/data/attributes/body');
            expect(body.errors[0].detail).toEqual('This value should not be blank');

            done();
        });

    });

    it("should throw validation errors on patch", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?page[limit]=1&page[offset]=10',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            console.log(util.inspect(body, false, null))

            const data = body.data[0];
            data.attributes.title = 'abc';

            request({

                uri: 'http://localhost:5555/api/articles/' + data.id,
                method: 'PATCH',
                json: true,
                headers: {
                    'content-type': 'application/json; ext=bulk'
                },
                body: {
                    data: data
                }

            }, (error, response, body) => {

                console.log(util.inspect(body, false, null))

                expect(response.statusCode).toEqual(422);
                expect(body.errors[0].code).toEqual('400');
                expect(body.errors[0].source.pointer).toEqual('/data/attributes/title');
                expect(body.errors[0].detail).toEqual('This value must be at least 4 characters long');

                done();
            });

        });

    });

    it("should throw error on patching non-existant resource", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles/aaaaaaaaaaaaaaaaaaaaaaaaaaa',
            method: 'PATCH',
            json: true,
            headers: {
                'content-type': 'application/json; ext=bulk'
            },
            body: {
                data: {
                    attributes: {
                        title: 'my title'
                    }
                }
            }

        }, (error, response, body) => {

            console.log(util.inspect(body, false, null))

            expect(response.statusCode).toEqual(404);
            expect(body.errors[0].code).toEqual('404');
            expect(body.errors[0].title).toEqual('Resource Not Found');

            done();
        });

    });

    it("should throw error on resource permission check when patching", (done) => {

        request({

            uri: 'http://localhost:5555/api/articles?filter[title]=NO_PERMISSION',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            console.log(util.inspect(body, false, null))

            const data = body.data[0];

            request({

                uri: 'http://localhost:5555/api/articles/' + data.id,
                method: 'PATCH',
                json: true,
                headers: {
                    'content-type': 'application/json; ext=bulk'
                },
                body: {
                    data: data
                }

            }, (error, response, body) => {

                console.log(util.inspect(body, false, null))

                expect(response.statusCode).toEqual(401);
                expect(body.errors[0].code).toEqual('401');
                expect(body.errors[0].title).toEqual('Invalid Resource Permissions');

                done();
            });

        });


    });
});
