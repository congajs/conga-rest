const RestSpecification = require('../RestSpecification');

//const JsonApiDeserializer = require('./JsonApiDeserializer');
const JsonApiSerializer = require('./JsonApiSerializer');

/**
 * This class contains all of the components to handle the JsonApi specification
 *
 * http://jsonapi.org/
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class JsonApiRestSpecification extends RestSpecification {

    /**
     * Initialize the specification
     *
     * @return {void}
     */
    initialize() {

        this.serializer = new JsonApiSerializer(this.config['attribute.inflection']);
        //this.deserializer = new JsonApiDeserializer(this.config['attribute.inflection']);

    }

    /**
     * Return the content type for the specification
     *
     * @return {String}
     */
    getContentType() {
        return 'application/vnd.api+json';
    }

    /**
     * Do any required validation of a request
     *
     * @param  {Request} req           the request
     * @param  {String}  resourceType  the name of the resource
     * @return {Promise}
     */
    validateRequest(req, resourceType) {

        return new Promise((resolve, reject) => {

            if (req.method === 'POST' || req.method === 'PUT') {

                // make sure body isn't empty
                if (req.body === null) {
                    return reject('The request body cannot be empty');
                }

        		// make sure that type in body matches current type
        		if (req.body.data.type !== resourceType.type) {
         			return reject('Incorrect resource type "' + req.body.data.type + '" was posted');
        		}
            }

            resolve();
        });
    }

    /**
     * Deserialize a request in to a given object
     *
     * @param  {Request} req    the request
     * @param  {Object}  object the object to deserialize in to
     * @return {void}
     */
    deserializeRequestInToObject(req, object) {
        this.serializer.deserializeRequestInToObject(req, object);
    }

    /**
     * Serialize a single response type (get one, create one, etc.)
     *
     * @param  {Request} req   the original request
     * @param  {Object}  data  the response data
     * @return {Object}
     */
    serializeSingleResponse(req, data) {
        return this.serializer.serializeSingleResponse(req, data);
    }

}
