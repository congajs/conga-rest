module.exports = class QueryParser {

    /**
     * Construct the parser with a source
     *
     * @param  {String} source  the source (either query or body)
     */
    constructor(source) {
        this.source = source;
    }

    /**
     * Get the query parameter from whichever source this parser was configured with
     *
     * @param  {Object} req       the request object
     * @param  {String} parameter the parameter name
     * @return {Mixed}
     */
    getParameter(req, parameter) {

        if (typeof req[this.source][parameter] === 'undefined') {
            return null;
        }

        return req[this.source][parameter];
    }
}
