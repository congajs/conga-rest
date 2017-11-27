module.exports = {

    upload: function(req, res) {

        const path = require('path');

        var writeable = require('fs').createWriteStream(
            path.join(this.container.getParameter('kernel.var_path'), 'uploaded.jpg')
        );

        writeable.on('finish', function(){
            res.json('ok');
        });

        writeable.end(req.body);

    }

}
