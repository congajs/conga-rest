module.exports = class GenericIncludes {

    constructor(source) {
        this.source = source;
    }

    parse(req, type) {

        let includes = req.query.include;

        if (typeof includes === 'undefined') {
            return [];
        }

        includes = includes.split(',');

        // for (let i = 0; i < includes.length; i++) {
        //     includes[i] = includes[i].split('.');
        // }

        return includes;

    }
}
