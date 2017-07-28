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
        return 3;
    }

    /**
     * Get the name of the model that this fixture is for
     *
     * @return {String}
     */
    getModelName() {
        return 'Comment';
    }

    /**
     * Load the data into the database
     *
     * @param  {Function} next callback once done
     * @return {void}
     */
    load(next) {

        const manager = this.getManager();

        this.mapFromFile(path.join(__dirname, 'data', 'comments.csv'), (model, row, index, cb) => {

            model.referenceId = row.id;
            model.body = row.body;
            model.user = this.getReference('user-' + row.user_id);
            model.publishedAt = new Date(row.created_at);

            this.addReference('comment-' + row.id, model);

            const article = this.getReference('article-' + row.article_id);

            article.comments.push(model);
            //
            manager.persist(model);
            manager.persist(article);

        }, () => {

            manager.flush().then(next).catch((err) => {
                console.log(err);
            })

        });

    }
}
