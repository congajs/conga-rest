const Pager = require('../Pager');

/**
 * The OffsetPager is a Pager implmentation which stores information for offset based
 * pagination strategies
 */
module.exports = class OffsetPager extends Pager {

    /**
     * Construct the Pager
     *
     * @param  {Boolean} exists flag to indicate if pagination info was specified in request
     * @param  {Number}  limit  the current limit
     * @param  {Number}  offset the current offset
     */
    constructor(exists, limit, offset) {
        super(exists, limit);
        this.offset = offset;
    }

    getOffset() {
        return this.offset;
    }

    /**
     * Get the pagination info for the current request
     *
     * @return {Object}
     */
    getCurrent() {
        return {
            page: {
                offset: this.offset,
                limit: this.limit
            }
        };
    }

    /**
     * Get the pagination info for the previous page of results
     *
     * @return {Object}
     */
    getPrev() {

    }

    /**
     * Get the pagination info for the next page of results
     *
     * @return {Object}
     */
    getNext() {

    }

    /**
     * Get the pagination info for the last page of results
     *
     * @return {Object}
     */
    getLast() {

    }

    isFirstPage() {
        return this.offset === 0;
    }

    isLastPage() {
        return false;
    }
}
