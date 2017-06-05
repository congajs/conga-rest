/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Annotation = require('conga-annotations').Annotation;

/**
 * The @Rest:Relationship annotation is used to identify a class property which
 * should be handled as a REST relationship
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestRelationshipAnnotation extends Annotation {

	/**
	 * Define the annotation string to find
	 *
	 * @var {String}
	 */
	static get annotation() { return 'Rest:Relationship'; }

    /**
     * The possible targets
     *
     * (Annotation.DEFINITION, Annotation.CONSTRUCTOR, Annotation.PROPERTY, Annotation.METHOD)
     *
     * @type {Array}
     */
    static get targets() { return [Annotation.PROPERTY, Annotation.METHOD] }


    constructor(data, filePath){

    	super(data, filePath);

		/**
		 * The related type
		 *
		 * @type {String}
		 */
		//this.type = null;

		/**
		 * The related REST type
		 * @type {String}
		 */
		//this.relatedType = null;
	}
}
