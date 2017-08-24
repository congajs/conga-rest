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
 * The @Rest:MapAttribute annotation is used to automatically map internal
 * values to an exposed value
 *
 * Example:
 *
 *      @Rest:Attribute
 *      @Rest:MapAttribute({
 *          0: "INACTIVE",
 *          1: "ACTIVE",
 *          2: "PENDING"
 *      })
 *     this.status = 1;
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestMapAttributeAnnotation extends Annotation {

    /**
     * Define the annotation string to find
     *
     * @var {String}
     */
    static get annotation() { return 'Rest:MapAttribute'; }

    /**
     * The possible targets
     *
     * (Annotation.DEFINITION, Annotation.CONSTRUCTOR, Annotation.PROPERTY, Annotation.METHOD)
     *
     * @type {Array}
     */
    static get targets() { return [Annotation.PROPERTY] }

    init(data) {

    }

}
