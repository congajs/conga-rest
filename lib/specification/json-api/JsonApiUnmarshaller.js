
module.exports = class JsonApiUnmarshaller {

    constructor(mapper) {
        this.mapper = mapper;
    }

    /**
     * Deserialize a request body in to a given object
     *
     * @param  {Request} data   the request data
     * @param  {Object}  object the newly created object to deserialize in to
     * @return {Object}         the final object
     */
    unmarshal(type, data) {

        const mapping = this.mapper.getMappingByType(type);

        const normalized = {
            type: null,
            id: null,
            attributes: data.attributes,
            relationships: {}
        };

        let relationship;
        let map;

        for (relationship in data.data.relationship) {
            a
        }

        return normalized;


        // {
        //     id: '123',
        //     attributes: {
        //         title: 'title',
        //         body: 'body'
        //     },
        //     relationships: {
        //         one: {
        //             author: { type: 'user', id: '999' },
        //         },
        //
        //         many: {
        //             comments: [
        //                 { type: 'comment', id: '222' },
        //                 { type: 'comment', id: '333' }
        //             ]
        //         }
        //     }
        // }





    }
}
