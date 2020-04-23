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
 * given RestSpecification implementation
 */
module.exports = class RestResponseHandler {

    /**
     * Set the RestSpecification
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
     * @return {Void}
     */
    onRenderResponse(req, res, data, status, cb) {
        cb(null, null);
    }

    /**
     * Send the final response
     *
     * @param  {Request}   req
     * @param  {Response}  res
     * @param  {Object}    data
     * @param  {String}    body
     * @param  {Number}    status
     * @return {Void}
     */
    onSendResponse(req, res, data, body, status) {
        if (!res.headersSent) {
            res.setHeader('Content-Type', this.specification.getContentType());
            res.status(status).json(
                this.specification.serializeResponse(req, data)
            );
        }
    }

    /**
     * Handle an error response
     *
     * @param  {Request}       req
     * @param  {Response}      res
     * @param  {ErrorResponse} data
     * @return {Void}
     */
    onErrorResponse(req, res, error) {
        if (!res.headersSent) {
            res.setHeader('Content-Type', this.specification.getContentType());
            this.specification.handleError(req, res, error, (final) => {
                res.status(error.status).json(final);
            });
        }
    }
};
