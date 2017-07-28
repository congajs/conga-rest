/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The RestResourceRegistry holds all of the metadata for the annotated
 * resources that were parsed in the current project
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestResourceRegistry {

    /**
     * Construct the registry
     */
    constructor() {

        /**
         * Hash of resource/model name to it's prototype (with metadata attached)
         *
         * @type {Object}
         */
        this.nameToProtoMap = {};

        /**
         * Hash of resource/model type to it's prototype (with metadata attached)
         *
         * @type {Object}
         */
        this.typeToProtoMap = {};
    }

    /**
     * Add a prototype for a resource name
     *
     * @param {String}   name     the resource/model name
     * @param {Function} proto  the resource prototype
     */
    add(name, proto) {
        this.nameToProtoMap[name] = proto;
        this.typeToProtoMap[proto.type] = proto;
    }

    /**
     * Get a prototype by class name
     *
     * @param  {String}   name the class name
     * @return {Function}
     */
    get(name) {

        if (typeof this.nameToProtoMap[name] === 'undefined') {
            throw new Error('Mapping data not found for: ' + name);
        }

        return this.nameToProtoMap[name];
    }

    /**
     * Get a prototype by it's type name
     *
     * @param  {String}   type the resource type
     * @return {Function}
     */
    getByType(type) {

        if (typeof this.typeToProtoMap[type] === 'undefined') {
            throw new Error('Mapping data not found for type: ' + type);
        }

        return this.typeToProtoMap[type];
    }
}
