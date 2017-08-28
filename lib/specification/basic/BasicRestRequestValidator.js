/**
 * The BasicRestRequestValidator validates requests for basic api specifications
 */
module.exports = class BasicRestRequestValidator {

    /**
     * Validate a request
     *
     * @param  {Request} req          the request
     * @param  {String}  resourceType the name of the resource
     * @return {Promise}
     */
    validateRequest(req, resourceType) {
        return Promise.resolve();
    }

}
