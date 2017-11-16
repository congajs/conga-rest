const RestError = require('../../rest/RestError');

module.exports = class JsonApiErrorFormatter {

    constructor(mapper) {

        this.mapper = mapper;

        this.messages = {
            [RestError.QUERY_INCLUDE_INVALID_PATH]: "The resource does not have a '{{ error.value }}' relationship path.'",
            [RestError.QUERY_SPARSE_INVALID_PATH]: "The '{{ error.resource }}' resource does not have a '{{ error.value }}' path.",
            [RestError.QUERY_SPARSE_INVALID_RESOURCE]: "'{{ error.resource }}' is not a valid resource."
        };
    }

    format(error) {

        console.log(error);
        console.log('=============================');

        const final = {
            jsonapi: {
                version: "1.0"
            },
            errors: []
        };

        error.data.errors.forEach((err) => {

            console.log(err.type);

            // invalid query parameters
            if (err.type >= 300 && err.type < 400) {
                final.errors.push({
                    code: err.type + '',
                    source: err.source,
                    title: "Invalid Query Parameter",
                    detail: this.messages[err.type]
                });
            }

            if (err.type === RestError.RESOURCE_NOT_FOUND) {
                final.errors.push({
                    code: err.type + '',
                    //source: err.source,
                    title: "Resource Not Found",
                    //detail: this.messages[err.type]
                });
            }

            if (err.type === RestError.RESOURCE_INVALID_DATA) {

                const source = err.source;
                source.pointer = '/data/attributes/' + this.mapper.convertPropertyToAttribute(err.resource, source.pointer);

                final.errors.push({
                    code: err.type + '',
                    source: source,
                    detail: err.detail
                });
            }

            // switch (err.type) {
            //
            //     case RestError.QUERY_INCLUDE_INVALID_PATH:
            //
            //         final.errors.push({
            //             code: error.type,
            //             source: err.source,
            //             title: "Invalid Query Parameter",
            //             detail: "The resource does not have a '" + err.value + "' relationship path."
            //         });
            //
            //         break;
            //
            //     case RestError.QUERY_SPARSE_INVALID_PATH:
            //
            //         final.errors.push({
            //             code: error.type,
            //             source: err.source,
            //             title: "Invalid Query Parameter",
            //             detail: "The '" + err.resource + "' resource does not have a '" + err.value + "' path."
            //         });
            //
            //         break;
            //
            //     case RestError.QUERY_SPARSE_INVALID_RESOURCE:
            //
            //         final.errors.push({
            //             code: error.type,
            //             source: err.source,
            //             title: "Invalid Query Parameter",
            //             detail: "'" + err.resource + "' is not a valid resource."
            //         });
            //
            //         break;
            //
            //     case RestError.QUERY_SPARSE_MISSING_PATH:
            //
            //         final.errors.push({
            //             code: error.type,
            //             source: err.source,
            //             title: "Invalid Query Parameter",
            //             detail: "The '" + err.resource + "' resource parameter is missing a path."
            //         });
            //
            //         break;
            //
            //     case RestError.QUERY_PAGINATION_INVALID_OFFSET:
            //
            //         final.errors.push({
            //             code: error.type,
            //             source: err.source,
            //             title: "Invalid Query Parameter",
            //             detail: "The offset '" + err.value + "' is not valid."
            //         });
            //
            //         break;
            //
            //     case RestError.QUERY_PAGINATION_INVALID_LIMIT:
            //
            //         final.errors.push({
            //             code: error.type,
            //             source: err.source,
            //             title: "Invalid Query Parameter",
            //             detail: "The limit '" + err.value + "' is not valid."
            //         });
            //
            //         break;
            //
            //     case RestError.QUERY_SORT_INVALID_PATH:
            //
            //         final.errors.push({
            //             code: error.type,
            //             source: err.source,
            //             title: "Invalid Query Parameter",
            //             detail: "The '" + err.resource + "' resource does not have a '" + err.value + "' path."
            //         });
            //
            //         break;
            //
            // }
        });

        console.log(final);

        return final;
    }
}
