module.exports = class Filter {

    // comparison operators
    static get EQUALS() { return 'eq' };
    static get LIKE() { return 'like' };
    static get IN() { return 'in' };
    static get LT() { return 'lt' };
    static get LTE() { return 'lte' };
    static get GT() { return 'gt' };
    static get GTE() { return 'gte' };
    static get NOT() { return 'not' };
    static get CONTAINS() { return 'contains' };

    // conjunction operators
    static get AND() { return 'and' };
    static get OR() { return 'or' };

    constructor(property, value, comparison) {
        this.property = property;
        this.value = value;
        this.comparison = comparison;
    }

    isType(type) {
        return type === this.comparison;
    }
}
