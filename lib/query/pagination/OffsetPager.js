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
     * Get the pagination info for the first page
     *
     * @return {Object}
     */
    getFirst() {
        return {
            page: {
                offset: 0,
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
        return {
            page: {
                offset: this.offset - this.limit,
                limit: this.limit
            }
        };
    }

    /**
     * Get the pagination info for the next page of results
     *
     * @return {Object}
     */
    getNext() {
        return {
            page: {
                offset: this.offset + this.limit,
                limit: this.limit
            }
        };
    }

    /**
     * Get the pagination info for the last page of results
     *
     * @return {Object}
     */
    getLast() {
        return {
            page: {
                offset: Math.floor(this.maxResults / this.limit) * this.limit,
                limit: this.limit
            }
        };
    }

    /**
     * Check if this is the first page
     *
     * @return {Boolean}
     */
    isFirstPage() {
        return this.offset === 0;
    }

    /**
     * Check if this is the last page
     *
     * @return {Boolean}
     */
    isLastPage() {
        return false;
    }

    /**
     * Check if this is the last page of results
     *
     * @return {Boolean}
     */
    isNextToLastPage() {
        return this.offset + this.limit >= this.maxResults;
    }

    /**
     * Return the meta information about total number of results, etc.
     *
     * @return {Object}
     */
    getMetaInfo() {
        return {
            total: this.maxResults
        }
    }
}
