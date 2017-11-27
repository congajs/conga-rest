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
 * The @Rest:Upload annotation ...
 */
module.exports = class RestUploadAnnotation extends Annotation {

    /**
     * Define the annotation string to find
     *
     * @var {String}
     */
    static get annotation() { return 'Rest:Upload'; }

    /**
     * The possible targets
     *
     * (Annotation.DEFINITION, Annotation.CONSTRUCTOR, Annotation.PROPERTY, Annotation.METHOD)
     *
     * @type {Array}
     */
    static get targets() { return [Annotation.DEFINITION] }

    init(data){

        // set defaults

        /**
         * The uri prefix
         *
         * @type {String}
         */
        this.uriPrefix = data.uriPrefix || '/upload';

        /**
         * The upload type (simple, multipart, resumable)
         *
         * @type {String}
         */
        this.uploadType = data.uploadType || 'simple';

        /**
         * The allowed mime types
         *
         * Example: ['image/jpeg']
         *
         * @type {Array}
         */
        this.allowedMimeTypes = data.allowedMimeTypes || [];

        /**
         * The max allowed upload size in bytes
         *
         * @type {Number}
         */
        this.maxSize = data.maxSize || 1024;

        /**
         * Enabled chunking
         *
         * @type {Boolean}
         */
        this.chunked = data.chunked || false;
    }

}
