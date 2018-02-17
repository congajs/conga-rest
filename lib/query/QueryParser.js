module.exports = class QueryParser {

    /**
     * Construct the parser with a source
     *
     * @param  {String} source  the source (either query or body)
     */
    constructor(source, mapper) {
        this.source = source;
        this.mapper = mapper;
    }

    /**
     * Get the query parameter value from whichever source this parser was configured with
     *
     * @param  {Object} req       the request object
     * @return {Mixed}
     */
    getValueFromRequest(req) {

        if (typeof req[this.source] === 'undefined') {
            return null;
        }

        const name = this.getName();

        if (typeof req[this.source][name] === 'undefined') {
            return null;
        }

        return req[this.source][name];
    }

    /**
     * Get the name of the query parameter
     *
     * @return {String}
     */
    getName() {
        throw new Error('You must implement QueryParser:getName()');
    }
}
