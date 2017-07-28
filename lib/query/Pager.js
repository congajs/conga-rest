/**
 * The Pager is an "abstract" class which should be extended in order to store info
 * parsed from a request for specific pagination strategies.
 */
module.exports = class Pager {

    /**
     * Construct the Pager
     *
     * @param  {Boolean} exists flag to indicate if pagination info was specified in request
     * @param  {Number}  limit  the current limit
     */
    constructor(exists, limit) {
        this.exists = exists;
        this.limit = limit;
        this.maxResults = 0;
    }

    /**
     * Set the max number of results that were found in the current request
     *
     * @param {Number} maxResults
     */
    setMaxResults(maxResults) {
        this.maxResults = maxResults;
    }

    /**
     * Get the calculated offset
     *
     * @return {Number}
     */
    getLimit() {
        return this.limit;
    }

    /**
     * Get the calculated offset
     *
     * @return {Number}
     */
    getOffset() {
        throw new Error('You must implement Pager.getOffset()');
    }

    /**
     * Get the pagination info for the current request
     *
     * @return {Object}
     */
    getCurrent() {
        throw new Error('You must implement Pager.getCurrent()');
    }

    /**
     * Get the pagination info for the previous page of results
     *
     * @return {Object}
     */
    getPrev() {
        throw new Error('You must implement Pager.getPrev()');
    }

    /**
     * Get the pagination info for the next page of results
     *
     * @return {Object}
     */
    getNext() {
        throw new Error('You must implement Pager.getNext()');
    }

    /**
     * Get the pagination info for the last page of results
     *
     * @return {Object}
     */
    getLast() {
        throw new Error('You must implement Pager.getLast()');
    }

    /**
     * Check if this is the first page of results
     *
     * @return {Boolean}
     */
    isFirstPage() {
        throw new Error('You must implement Pager.isFirstPage()');
    }

    /**
     * Check if this is the last page of results
     *
     * @return {Boolean}
     */
    isLastPage() {
        throw new Error('You must implement Pager.isLastPage()');
    }

}
