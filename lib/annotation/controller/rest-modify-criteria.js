/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Annotation = require('conga-annotations').Annotation;

/**
 * The @RestModifyCriteria annotation specifies a method
 * that should be run within a controller to modify the
 * criteria used to retrieve objects.
 *
 * This can be used to limit results to the logged in user, etc.
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class ModifyCriteriaAnnotation extends Annotation {

	/**
	 * Define the annotation string to find
	 * 
	 * @var {String}
	 */
	static get annotation() { return 'Rest:ModifyCriteria'; }

    /**
     * The possible targets
     *
     * (Annotation.DEFINITION, Annotation.CONSTRUCTOR, Annotation.PROPERTY, Annotation.METHOD)
     *
     * @type {Array}
     */
    static get targets() { return [Annotation.METHOD] }

}