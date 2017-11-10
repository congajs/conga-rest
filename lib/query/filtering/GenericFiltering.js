const QueryParser = require('../QueryParser');

const ConjunctionFilter = require('../ConjunctionFilter');
const Filter = require('../Filter');
const FilterSet = require('../FilterSet');

/**
 * This is a filtering parser which handles querystring filters in the following style:
 *
 * ?filter[status]=ACTIVE&filter[age]=gte:30+AND+lte:40&filter[position]=like:*Engineer&filter[language]=in:[javascript,python]&filter[hobbies]=contains:djing,programming
 *
 * @type {[type]}
 */
module.exports = class GenericFiltering extends QueryParser {

    /**
     * Get the name of the query parameter
     *
     * @return {String}
     */
    getName() {
        return 'filter';
    }

    /**
     * Get an example of using a querystring
     *
     * @return {String}
     */
    getQuerystringExample() {
        return `?filter[status]=ACTIVE&filter[age]=gte:30+AND+lte:40&filter[position]=like:*Engineer&filter[language]=in:[javascript,python]&filter[hobbies]=contains:djing,programming`;
    }

    /**
     * Get an example of using a body query
     *
     * @return {Object}
     */
    getBodyQueryExample() {
        return {
            query: {
                filter: {
                    status: 'ACTIVE',
                    age: { gte: 30 },
                    position: { like: '*Engineer' },
                    language: { in: ['javascript', 'python']},
                    hobbies: { contains: ['djing', 'programming']}
                }
            }
        };
    }

    parse(req, type) {

        const query = this.getValueFromRequest(req);
        const set = new FilterSet();

        try {

            for (let property in query) {
                set.add(this.createFilter(type, property, query[property]));
            }

        } catch (e) {
            console.log(e);
        }

        return set;
    }

    createFilter(type, attribute, data) {

        if (data.includes('+AND+') || data.includes('+OR+')) {
            return this.createConjunctionFilter(type, attribute, data);
        } else {
            return this.createNormalFilter(type, attribute, data);
        }

    }

    createConjunctionFilter(type, attribute, data) {

        let conjunction;
        let parts;

        if (data.includes('+AND+')) {
            conjunction = Filter.AND;
            parts = data.split('+AND+');
        } else {
            conjunction = Filter.OR;
            parts = data.split('+OR+');
        }

        const filters = parts.map((part) => {
            return this.createNormalFilter(type, attribute, part);
        });

        return new ConjunctionFilter(
            this.mapper.convertAttributeToProperty(type, attribute),
            filters,
            conjunction
        );
    }

    createNormalFilter(type, attribute, data) {

        let value;
        let comparison;

        if (data.includes(':')) {

            const parts = data.split(/:(.+)/);
            const c = parts[0];

            value = parts[1];

            if (c === 'in' || c === 'contains') {
                value = value.split(',');
            }

            comparison = Filter[c.toUpperCase()];

        } else {

            comparison = Filter.EQUALS;
            value = data;
        }

        // convert booleans
        if (typeof value === 'string') {
            if (value.toLowerCase() === 'true') {
                value = true;
            } else if (value.toLowerCase() === 'false') {
                value = false;
            }
        }

        // make sure numbers are numbers
        if (!isNaN(value) && typeof value !== 'boolean') {
            value = Number(value);
        }

        return new Filter(
            this.mapper.convertAttributeToProperty(type, attribute),
            value,
            comparison
        );
    }
}
