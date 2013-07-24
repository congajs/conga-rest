/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var Annotation = require('conga-annotations').Annotation;

/**
 * The @RestModifyCriteria annotation specifies a method
 * that should be run within a controller to modify the
 * criteria used to retrieve objects.
 *
 * This can be used to limit results to the logged in user, etc.
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = Annotation.extend({

	/**
	 * Define the annotation string to find
	 * 
	 * @var {String}
	 */
	annotation: 'Rest:ModifyCriteria',

	/**
	 * Define the targets that the annotation can be applied to
	 * 
	 * @var {Array}
	 */
	targets: [Annotation.METHOD]

});