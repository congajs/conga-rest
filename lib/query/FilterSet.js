module.exports = class FilterSet {

    constructor() {
        this.filters = {};
    }

    add(filter) {
        this.filters[filter.property] = filter;
    }

    isEmpty() {
        return Object.keys(this.filters).length === 0;
    }

    has(property) {
        return typeof this.filters[property] !== 'undefined';
    }

    get(property) {
        return this.filters[property];
    }

    map(fn) {

        let i;
        let filter;

        for (i in this.filters) {

            filter = this.filters[i];

            if (filter.constructor.name === 'ConjunctionFilter') {

                fn(null, filter);

            } else {

                fn(filter, null);
            }

        };

    }
}
