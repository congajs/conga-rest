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
 * The @Rest:Object annotation is used to identify an
 * object that needs to be transformed for REST operations
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param {Object} data
 */
module.exports = Annotation.extend({

	annotation: 'Rest:Object',
	targets: [Annotation.CONSTRUCTOR]

});