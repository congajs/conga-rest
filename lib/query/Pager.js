module.exports = class Pager {

    constructor(offset, limit, exists) {
        this.offset = offset;
        this.limit = limit;
        this.exists = exists;
    }
}
