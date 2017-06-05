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
 * The @Rest:Resource annotation is used to tag a class as being exposed
 * as a REST resource
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestResourceAnnotation extends Annotation {

	/**
	 * Define the annotation string to find
	 *
	 * @var {String}
	 */
	static get annotation() { return 'Rest:Resource'; }

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

	}

	init(data) {

		if (typeof data.type === 'undefined'){
			throw new Error('Type must be defined in Rest:Resource (' + this.filePath + ')');
		}
	}

}
