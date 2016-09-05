var qs = require('qs');

var OffsetBasedPagination = function(){};

OffsetBasedPagination.prototype = {

	/**
	 * Get the sort and limit information from the request
	 * 
	 * @param  {Object} req
	 * @return {Object}
	 */
	getOffsetAndLimitInfoFromRequest: function(req){

		var exists = false;
		var offset = null;
		var limit = null;
		var page = req.query.page;

		if (typeof page !== 'undefined' && page !== null){

			if (typeof page.offset !== 'undefined'){
				exists = true;
				offset = parseInt(page.offset);	
			}

			if (typeof page.limit !== 'undefined'){
				limit = parseInt(page.limit);
			}
		}

		return {
			type: 'offset',
			exists: exists,
			offset: offset,
			limit: limit
		};

	},

	/**
	 * Build response of pagination info
	 * 
	 * @param  {Object} req              
	 * @param  {Object} sortAndLimitInfo 
	 * @param  {Number} count            
	 * @return {Object}                 
	 */
	buildPaginationInfo: function(req, offset, limit, count){

try {

		var query = req.query;
		var baseUrl = req.protocol + '://' + req.get('host') + req.path;
		var currentUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var currentPage = null,
			previousPage = null,
			nextPage = null,
			firstPage = null,
			lastPage = null;

		var lastOffset = Math.floor(count/limit) * limit;

		if (typeof query.page === 'undefined'){
			query.page = {
				limit: limit
			};
		}

		if (offset > 0){
			query.page.offset = offset - limit;
			previousPage = baseUrl + '?' + qs.stringify(query);
		}

		if (offset + limit < count){
			query.page.offset = offset + limit;
			nextPage = baseUrl + '?' + qs.stringify(query);
		}

		query.page.offset = 0;
		firstPage = baseUrl + '?' + qs.stringify(query);

		query.page.offset = lastOffset
		lastPage = baseUrl + '?' + qs.stringify(query);

		return {
			currentPage: currentUrl,
			previousPage: previousPage,
			nextPage: nextPage,
			firstPage: firstPage,
			lastPage: lastPage
		};

} catch (err){
	console.log(err);
	}
}

};

OffsetBasedPagination.constructor = OffsetBasedPagination;

module.exports = OffsetBasedPagination;