module.exports = class GenericSparse {

    constructor(source) {
        this.source = source;
    }

    parse(req) {

        let sparseFields = req.query.fields;

        if (typeof sparseFields !== 'undefined') {
            for (let i in sparseFields) {
                sparseFields[i] = sparseFields[i].split(',');
            }
        } else {
            sparseFields = null;
        }

        return sparseFields;

    }
}
