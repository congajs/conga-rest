module.exports = class GenericErrorHandler {

    constructor(errorFormatter) {
        this.errorFormatter = errorFormatter;
    }

    handleError(req, res, error, cb) {
        cb(this.errorFormatter.format(error));
    }
}
