/**
 * This class holds all of the possible internal error codes
 */
class RestError {}

/**
 * Internal Server errors
 */
RestError.INTERNAL_SERVER_ERROR = 0;

/**
 * Specification errors
 */
RestError.SPECIFICATION_INVALID_CONTENT_TYPE = 100;
RestError.SPECIFICATION_INVALID_FORMAT = 101;

/**
 * JSON Body errors
 */
RestError.JSON_EMPTY_BODY = 200;
RestError.JSON_BAD_BODY = 201;

/**
 * Query errors
 */
RestError.QUERY_INCLUDE_INVALID_PATH = 300;

RestError.QUERY_SPARSE_INVALID_PATH = 350;
RestError.QUERY_SPARSE_MISSING_PATH = 351;
RestError.QUERY_SPARSE_INVALID_RESOURCE = 352;

RestError.QUERY_PAGINATION_INVALID_OFFSET = 360;
RestError.QUERY_PAGINATION_INVALID_LIMIT = 361;

RestError.QUERY_SORT_INVALID_PATH = 370;

RestError.QUERY_FILTER_INVALID_PATH = 302;

/**
 * Resource errors
 */
RestError.RESOURCE_INVALID_DATA = 400;
RestError.RESOURCE_INVALID_PERMISSIONS = 401;
RestError.RESOURCE_NOT_FOUND = 404;

/**
 * Request method errors
 */
RestError.METHOD_NOT_ALLOWED = 405;

module.exports = RestError;
