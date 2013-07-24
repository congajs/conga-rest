/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local modules
var Annotation = require('conga-annotations').Annotation;

/**
 * The @RestController annotation specifies that a controller should
 * automatically be decorated with REST actions that get proxied
 * to a given service within the application DIC container
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 */
module.exports = Annotation.extend({

	/**
	 * Define the annotation string to find
	 * 
	 * @var {String}
	 */
	annotation: 'Rest:Controller',

	/**
	 * Define the targets that the annotation can be applied to
	 * 
	 * @var {Array}
	 */
	targets: [Annotation.CONSTRUCTOR],

	/**
	 * The REST adapter to use
	 * 
	 * @type {String}
	 */
	adapter: null,

	/**
	 * The model that the REST controller is a representation of
	 * 
	 * @var {String}
	 */
	model: null,

	/**
	 * [wrappedPagination description]
	 * @type {Boolean}
	 */
	wrappedPagination: false,

	/**
	 * Optional parameters that a specific adapter implementation may need
	 * 
	 * @type {Object}
	 */
	options: null,


	init: function(data){

		delete data.adapter;
		delete data.annotation;
		delete data.model;
		delete data.wrappedPagination;

		this.options = data;
	}

});