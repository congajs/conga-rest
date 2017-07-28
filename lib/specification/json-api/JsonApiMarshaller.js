const util = require('util');

module.exports = class JsonApiMarshaller {

    marshal(req, normalized, data) {

        const obj = {};

        obj.jsonapi = {
            version: "1.0"
        };

        obj.data = normalized.data;

        let included = null;

        if (typeof data.includes !== 'undefined' && data.includes !== null) {
            included = this.marshalIncluded(normalized.included);
        } else {
            data.includes = null;
        }

        if (util.isArray(normalized.data)) {

            normalized.data.forEach((item) => {
                this.marshalSingle(item, data.includes, included);
            });

        } else {

            this.marshalSingle(normalized.data, data.includes, included)
        }

        if (included !== null) {
            obj.included = included;
        }

        return obj;
    }

    marshalSingle(normalized, includes, included) {

        // make sure id is a string
        normalized.id = normalized.id + '';

        // one
        if (normalized.relationships && Object.keys(normalized.relationships['one']).length > 0) {

            let attribute;

            for (attribute in normalized.relationships['one']) {

                let data = null;

                if (normalized.relationships['one'][attribute].data !== null) {
                    data = {
                        type: normalized.relationships['one'][attribute].data.type,
                        id: normalized.relationships['one'][attribute].data.id + ''
                    }
                }

                normalized.relationships[attribute] = {

                    links: normalized.relationships['one'][attribute].links,
                    data: data

                };

            }

        }

        // many
        if (normalized.relationships && Object.keys(normalized.relationships['many']).length > 0) {

            let attribute;

            for (attribute in normalized.relationships['many']) {

                normalized.relationships[attribute] = {
                    links: normalized.relationships['many'][attribute].links,
                    data: []
                };

                normalized.relationships['many'][attribute].data.forEach((obj) => {

                    normalized.relationships[attribute].data.push({
                        type: obj.type,
                        id: obj.id + ''
                    });

                });
            }
        }

        // remove relationship keys
        if (normalized.relationships) {
            delete normalized.relationships['one'];
            delete normalized.relationships['many'];
        }

        return normalized;
    }

    marshalIncluded(included) {

        const result = [];

        let i, j;

        for (i in included) {

            for (j in included[i]) {

                result.push(Object.assign({}, this.marshalSingle(included[i][j])));
            }
        }

        return result;
    }

    /**
     * Serialize the included data
     *
     * @param  {Object} data          the input data
     * @param  {Array}  includes      the array of types to include
     * @return {Object}
     */
    serializeIncluded(data, includes) {

        const included = [];
        const cache = [];

        /**
         * Recursively walk through the object tree to find included elements
         * and serialize them
         *
         * @param  {Object} obj  the current node in the tree
         * @param  {Array}  path the remaining attribute path to walk
         * @return {void}
         */
        const walk = (obj, path) => {

            const prop = path.shift();

            obj = obj[prop];

            if (util.isArray(obj)) {

                for (let i = 0, j = obj.length; i < j; i++) {

                    const tmp = obj[i];
                    const key = tmp.type + ':' + tmp.id;

                    if (cache.indexOf(key) === -1){
                        included.push(tmp);
                        cache.push(key);
                    }

                    if (path.length > 0){
                        walk(tmp, path.slice(0));
                    }
                };

            } else {

                if (obj !== null && typeof obj !== 'undefined') {

                    const key = obj.type + ':' + obj.id;

                    if (cache.indexOf(key) === -1){
                        included.push(obj);
                        cache.push(key);
                    }

                    if (path.length > 0){
                        walk(obj, path);
                    }
                }
            }
        };

        // loop through all data and recursively serialize includes
        if (util.isArray(data)) {
            for (let i = 0, j = data.length; i < j; i++) {
                for (let k = 0, l = includes.length; k < l; k++) {
                    walk(data[i], includes[k].slice(0)); // <-- cloning array here
                }
            }
        } else {
            for (let k = 0, l = includes.length; k < l; k++) {
                walk(data, includes[k].slice(0)); // <-- cloning array here
            }
        }

        return included;
    }


    unmarshal() {

    }
}
