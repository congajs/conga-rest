# conga-rest [![Build Status](https://secure.travis-ci.org/congajs/conga-rest.png)](http://travis-ci.org/congajs/conga-rest)

## Overview

This is a bundle for the [conga.js](https://github.com/congajs/conga) framework which adds REST functionality to a project.

The goal of this bundle is to make it as simple as possible to create RESTful APIs while mitigating the need to worry about serialization, parsing query parameters, handling resource relationships, etc.

It aims to provide a solid foundation to handle as many common use cases as possible with minimal configuration while still giving you complete control to customize any part.

Combined with conga-bass it is trivial to quickly spin up a REST API for a configured database.

## Core Concepts

### Resource Annotations

    /**
     * @Rest:Resource(type="user")
     */
    class User {

        constructor() {

            /**
             * @Rest:ID
             */
            this.id = null;

            /**
             * @Rest:Attribute
             */
            this.email = null;

            /**
             * @Rest:Attribute(expose=false)
             */
            this.password = null;

            /**
             * @Rest:Attribute(update=false)
             */
            this.status = 'ACTIVE';

            /**
             * @Rest:Attribute(name="internal_note")
             * @Rest:Group(read=["ADMIN"], write=["ADMIN"])
             */
            this.note = null;

            /**
             * @Rest:Attribute(type="Date", format="Y-m-d h:i:s", update=false)
             */
            this.createdAt = null;

            /**
             * @Rest:Attribute(type="Date", format="Y-m-d h:i:s", update=false)
             */
            this.updatedAt = null;

        }
    }

### Controllers

    /**
     * @Route("/api/v1/users")
     * @Rest:Controller(
     *     resource="user",
     *     isPaginationEnabled=true,
     *     defaultLimit=100,
     *     defaultSort={id:1}
     * )
     */
    module.exports = class UserController extends RestController {

        /**
         * @Route("/me", methods=["GET"])
         */
        me(req, res) {

            res.return({
                data: req.user
            });

        }

        /**
         * @Route("/me", methods=["PATCH"])
         */
        updateMe(req, res) {

            const user = req.user;
            this.unmarshalIntoObject(req, user);

            // persist user
            // .....

            res.return({
                data: user
            });
        }
    }

### Specification

Conga REST is built around the central concept of a "specification" which can be completely configured via conga's yml configuration.

A specification defines everything about your API including:

* Attribute inflection (snake_case, camelCase, hyphen-case, PascalCase, CONSTANT_CASE)

* Allowed content type (application/json, application/vnd.api+json, etc.)

* Serialization format

* Query formats (pagination, filtering, sorting, sparse fields, including related resources, etc)

* Error handling / mapping / formatting

* Request validation

## Installation

Inside your conga.js project, run:

    $ npm install --save @conga/framework-rest

## Enable bundle

    // app/config/bundles

    bundles:

        all:

            # core conga bundles
            - "@conga/framework-bass"
            - "@conga/framework-rest"
            - "@conga/framework-validation"

(note: @conga/framework-validation is required and @conga/framework-bass is recommended to easily map REST controllers to your database)

## Configuration

Example:

    // config.yml


## Usage

// @todo
