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
 * The @RestProperty annotation is used to identify an
 * object property that should be exposed through REST
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class AttributeAnnotation extends Annotation {

	/**
	 * Define the annotation string to find
	 * 
	 * @var {String}
	 */
	static get annotation() { return 'Rest:Attribute'; }

    /**
     * The possible targets
     *
     * (Annotation.DEFINITION, Annotation.CONSTRUCTOR, Annotation.PROPERTY, Annotation.METHOD)
     *
     * @type {Array}
     */
    static get targets() { return [Annotation.PROPERTY, Annotation.METHOD] }


    constructor(data, filePath) {

    	super(data, filePath);

		/**
		 * The property name through REST
		 * 
		 * @type {String}
		 */
		//this.property = null;

		/**
		 * Specify if the target property can be updated through REST
		 * 
		 * @type {Boolean}
		 */
		//this.update = true;

		/**
		 * Specify the type that this property should be deserialized to
		 * from a PUT/POST
		 * 
		 * @type {String}
		 */
		//this.type = null;

		/**
		 * Specify if this is a setter method to deserialize a value
		 * 
		 * @type {Boolean}
		 */
		//this.setter = false;

		/**
		 * Specify if this attribute should be returned in responses or not
		 * 
		 * @type {Boolean}
		 */
		//this.expose = true;

	}

	init(data) {
		this.property = data.property || null;
		this.update = data.update || true;
		this.type = data.type || null;
		this.setter = data.setter || false;
		this.expose = typeof data.expose === 'undefined' ? true : data.expose;
	}

}