module.exports = class ConjunctionFilter {

    constructor(property, filters, conjunction) {
        this.property = property;
        this.filters = filters;
        this.conjunction = conjunction;
    }
}
