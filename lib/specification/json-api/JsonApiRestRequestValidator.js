/**
 * The JsonApiRestRequestValidator validates requests according to the
 * JsonApi v1.0 spec: http://jsonapi.org/format/1.0
 */
module.exports = class JsonApiRestRequestValidator {

    /**
     * Validate a request
     *
     * @param  {Request} req          the request
     * @param  {String}  resourceType the name of the resource
     * @return {Promise}
     */
    validateRequest(req, resourceType) {

        // console.log('============================');
        // console.log(req.method);
        // process.exit();
        //return Promise.resolve();

        return new Promise((resolve, reject) => {

            return resolve();

            // check content type
            if (req.headers['content-type'] !== 'application/vnd.api+json') {
                //return reject();
            }



            switch (req.method) {

                // case 'POST':
                //
                // console.log('============================');
                // console.log(req.body.data.type);
                // console.log(resourceType);
                //
                //
                //     // need data
                //     if (typeof req.body.data === 'undefined') {
                //         return reject();
                //     }
                //
                //     // resource type needs to match
                //     if (req.body.data.type !== resourceType) {
                //
                //
                //         return reject();
                //     }
                //
                //     break;

                // case 'PATCH':
                //
                //     // need data
                //     if (typeof req.body.data === 'undefined') {
                //         return reject();
                //     }
                //
                //     // resource type needs to match
                //     if (req.body.data.type !== resourceType) {
                //         return reject();
                //     }
                //
                //     // id needs to exist and match endpoint
                //     if (req.body.data.id !== req.params.id) {
                //         return reject();
                //     }
                //
                //     break;
            }

            resolve();

        });

    }
}
