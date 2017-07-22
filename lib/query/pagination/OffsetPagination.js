const Pager = require('../Pager');

module.exports = class OffsetPagination {

    constructor(source) {
        this.source = source;
    }

    parse(req, defaultLimit) {

        let exists = false;
        let offset = 0;
        let limit = defaultLimit;
        let page = req.query.page;

        if (typeof page !== 'undefined' && page !== null) {

            if (typeof page.offset !== 'undefined') {
                exists = true;
                offset = parseInt(page.offset);
            }

            if (typeof page.limit !== 'undefined') {
                limit = parseInt(page.limit);
            }
        }

        return new Pager(offset, limit, exists);

    }
}
