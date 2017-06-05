/*
 * This file is part of the conga-rest module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The RestResponseHandler handles taking data and serializing it using the
 * configured REST serializer
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RestResponseHandler {

    /**
     * Set the RestSpecification implementation
     *
     * @param  {RestSpecification} specification
     */
    setSpecification(specification) {
        this.specification = specification;
    }

    /**
     * Render the final response
     *
     * @param  {Request}   req
     * @param  {Response}  res
     * @param  {Object}    data
     * @param  {Number}    status
     * @param  {Function}  cb
     *
     * @return {Void}
     */
    onRenderResponse(req, res, data, status, cb) {
        cb(null, null);
    }

    /**
     * Send the final response
     *
     * @param  {Response}  res
     * @param  {Object}    data
     * @param  {String}    body
     * @param  {Number}    status
     * @param  {Function}  cb
     *
     * @return {Void}
     */
    onSendResponse(req, res, data, body, status) {

        const r = this.specification.serializeResponse(req, data);

        res.setHeader('Content-Type', 'application/json');
        res.status(status).json(JSON.stringify(r));
    }
}
