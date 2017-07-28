/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Annotation = require('@conga/annotations').Annotation;

/**
 * The @Rest:Attribute annotation is used to identify an
 * object property that should be exposed through REST
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestGroupAnnotation extends Annotation {

    /**
     * Define the annotation string to find
     *
     * @var {String}
     */
    static get annotation() { return 'Rest:Group'; }

    /**
     * The possible targets
     *
     * (Annotation.DEFINITION, Annotation.CONSTRUCTOR, Annotation.PROPERTY, Annotation.METHOD)
     *
     * @type {Array}
     */
    static get targets() { return [Annotation.PROPERTY, Annotation.METHOD] }

    init(data) {

        /**
         * Specify contexts which are allowed to view this attribute
         *
         * example:
         *
         *     @Rest:Group(read=["ADMIN"])
         *
         * @type {Object}
         */
        this.read = data.read || null;

        /**
         * Specify contexts which are allowed to update this attribute
         *
         * example:
         *
         *     @Rest:Group(write=["ADMIN"])
         *
         * @type {Object}
         */
        this.write = data.write || null;
    }

}
