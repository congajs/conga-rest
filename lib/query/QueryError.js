module.exports = class QueryError extends Error {

    constructor(errors) {
        super();
        this.errors = errors;
    }
}
