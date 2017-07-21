/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const RestSpecification = require('./specification/RestSpecification');

/**
 * The RestManager keeps track of Restful objects
 * and handles thier serialization
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestManager {

	/**
	 * Parse out all of the REST annotations from objects
	 * and store the information for lookup later on
	 *
	 * @param {Object}   event
	 * @param {Function} next
	 */
	onKernelCompile(event, next) {

		this.container = event.container;
		const config = this.container.get('config').get('rest');

		if (typeof config === 'undefined') {
			next();
			return;
		}

		// make sure that the conga-validation validator exists
		if (!this.container.get('validator')) {
			throw new Error('conga-rest requires the @conga/framework-validation bundle to be configured in your project');
		}

		this.createSpecification(config);

		// parse all of the configured resource paths
		this.container.get('conga.rest.resource.annotation.handler').parse(config);

		// move on
		next();
	}

	/**
	 * Create the configured RestSpecification implementation and set on container
	 *
	 * @param  {Object}    config
	 * @return {void}
	 */
	createSpecification(config) {

        const c = config.specification;

        const serializer = this.instantiateService(
            c.serializer,
            [
                this.container.get('conga.rest.resource.registry'),
                c.inflection,
                this.container.get('conga.rest.router')
            ]
        );

		const specification = new RestSpecification(
            c['content-type'],
            serializer,
            this.instantiateService(c.validator, []),
            this.instantiateService(c.query.pagination, [c.query.source]),
            this.instantiateService(c.query.filtering, [c.query.source]),
            this.instantiateService(c.query.sorting, [c.query.source, serializer]),
            this.instantiateService(c.query.sparse, [c.query.source]),
            this.instantiateService(c.query.includes, [c.query.source]),
            this.instantiateService(c.error.formatter, [c.query.source])
        );

		this.container.set('conga.rest.specification', specification);

		// need to set the specification on the response handler also
		this.container.get('conga.rest.response.handler').setSpecification(specification);
	}

    /**
     * Instantiate a namespaced service
     *
     * @param  {String} namespace
     * @param  {Array} args
     * @return {Object}
     */
    instantiateService(namespace, args = []) {

        const Service = require(
			this.container.get('namespace.resolver').resolveWithSubpath(namespace, 'lib') + '.js'
		);

        args.unshift('conga!');

        return new (Service.bind.apply(Service, args));
    }

}
