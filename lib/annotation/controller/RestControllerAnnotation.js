/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local modules
const Annotation = require('@conga/annotations').Annotation;

/**
 * The @Rest:Controller annotation specifies that a controller should
 * automatically be decorated with REST actions that get proxied
 * to a given service within the application DIC container
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 *
 */
module.exports = class RestControllerAnnotation extends Annotation {

    /**
     * Define the annotation string to find
     *
     * @var {String}
     */
    static get annotation() { return 'Rest:Controller'; }

    /**
     * The possible targets
     *
     * (Annotation.DEFINITION, Annotation.CONSTRUCTOR, Annotation.PROPERTY, Annotation.METHOD)
     *
     * @type {Array}
     */
    static get targets() { return [Annotation.DEFINITION] }

    constructor(data, filePath){

        super(data, filePath);

        /**
         * The REST adapter to use
         *
         * @type {String}
         */
        //this.adapter = null;

        /**
         * Any options to pass along to the adapter
         *
         * @type {Object}
         */
        //this.adapterOptions = null;

        /**
         * The rest type that the REST controller is a representation of
         *
         * @var {String}
         */
        //this.type = null;

        /**
         * Array of method names that are allowed
         *
         * @type {Array}
         */
        //this.allowedMethods = null;

        /**
         * Should the list results be paginated?
         *
         * @type {Boolean}
         */
        //this.isPaginationEnabled = true;

        /**
         * The default limit for paginated list results
         *
         * @type {Number}
         */
        //this.defaultLimit = 500;
    }

    init(data){

        // set defaults
        this.path = data.path || null;
        this.model = data.model || null;
        this.isPaginationEnabled = data.isPaginationEnabled || true;
        this.defaultLimit = data.defaultLimit || 500;
        this.allowedMethods = data.allowedMethods || null;
        this.defaultSort = data.defaultSort || {};
    }

}
