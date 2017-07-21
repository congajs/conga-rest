/*
 * This file is part of the conga-full-demo project.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
const path = require('path');

const AbstractFixture = require('@conga/framework-bass').AbstractFixture;

/**
 * This fixture loads in all of the initial Articles
 */
module.exports = class ArticleFixture extends AbstractFixture {

    /**
     * Get the order index to run this fixture
     *
     * @return {Number}
     */
    getOrder() {
        return 2;
    }

    /**
     * Get the name of the model that this fixture is for
     *
     * @return {String}
     */
    getModelName() {
        return 'Article';
    }

    /**
     * Load the data into the database
     *
     * @param  {Function} next callback once done
     * @return {void}
     */
    load(next) {

        const manager = this.getManager();

        this.mapFromFile(path.join(__dirname, 'data', 'articles.json'), (model, row, index, cb) => {

            model.referenceId = parseInt(row.reference_id.replace('post-', ''));
            model.title = row.title;
            model.body = row.body;
            model.user = this.getReference('user-' + row.user_id);

            this.addReference(row.reference_id, model);

            manager.persist(model);

        }, () => {

            manager.flush().then(next).catch((err) => {
                console.log(err);
            })

        });

    }
}
