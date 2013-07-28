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
 * The @Rest:Property annotation is used to identify an
 * object property that should be exposed through REST
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param {Object} data
 */
module.exports = Annotation.extend({

	annotation: 'Rest:Property',
	targets: [Annotation.CONSTRUCTOR]

});