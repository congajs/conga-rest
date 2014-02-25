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
 * The @RestProperty annotation is used to identify an
 * object property that should be exposed through REST
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = Annotation.extend({

	/**
	 * Define the annotation string to find
	 * 
	 * @var {String}
	 */
	annotation: 'Rest:Property',

	/**
	 * Define the targets that the annotation can be applied to
	 * 
	 * @var {Array}
	 */
	targets: [Annotation.PROPERTY, Annotation.METHOD],

	/**
	 * The property name through REST
	 * 
	 * @type {String}
	 */
	property: null,

	/**
	 * Specify if the target property can be updated through REST
	 * 
	 * @type {Boolean}
	 */
	update: true,

	/**
	 * Specify the type that this property should be deserialized to
	 * from a PUT/POST
	 * 
	 * @type {String}
	 */
	type: null,

	/**
	 * Specify if this is a setter method to deserialize a value
	 * 
	 * @type {Boolean}
	 */
	setter: false


});