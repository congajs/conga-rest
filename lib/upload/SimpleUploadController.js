const path = require('path');

const generateId = () => {

    let text = '';
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 16; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

module.exports = {

    upload: function(req, res) {

        // get the bass manager
        const session = this.container.get('bass').createSession();
        const manager = this.getManagerForCurrentResource(session);

        const filename = generateId() + '.jpg';
        const destination = path.join(this.container.getParameter('kernel.var_path'), filename);
        const writeable = require('fs').createWriteStream(destination);

        writeable.on('finish', () => {

            const data = {
                relationships: {
                    one: {},
                    many: {}
                }
            };

            const file = {
                mimeType: req.headers['content-type'],
                destination: destination,
                filename: filename,
                size: req.headers['content-length'],
                stream: req.body
            };

            this.createSingle(req, res, data, session, manager).then((resource) => {

                this.onUploadComplete(req, res, resource, file).then(() => {

                    manager.flush().then(() => {

                        return this.sendSuccessResponse(
                            req,
                            res,
                            resource,
                            null,
                            201
                        );

                    }).catch((error) => {
                        return this.sendInternalServerError(res, error);
                    });

                });

            });

        });

        writeable.end(req.body);

    }

}
