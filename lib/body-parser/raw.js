const bodyParser = require('body-parser');

module.exports = bodyParser.raw({
    type: "*/*"
});

// module.exports = bodyParser.urlencoded({ extended: true })

// module.exports = function(req, res, next) {
//
// console.log('in body parser');
// //console.log(req);
//   req.rawBody = '';
//   //req.setEncoding('utf8');
//
//   req.on('data', function(chunk) {
//      console.log(chunk);
//      console.log('=====================');
//     req.rawBody += chunk;
//   });
//
//   req.on('end', function() {
//       console.log('in end');
//     next();
//   });
// };
