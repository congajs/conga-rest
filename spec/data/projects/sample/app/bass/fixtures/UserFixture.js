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
 * This fixture loads in all of the initial Users
 */
module.exports = class UserFixture extends AbstractFixture {

    /**
     * Get the order index to run this fixture
     *
     * @return {Number}
     */
    getOrder() {
        return 1;
    }

    /**
     * Get the name of the model that this fixture is for
     *
     * @return {String}
     */
    getModelName() {
        return 'User';
    }

    /**
     * Load the data into the database
     *
     * @param  {Function} next callback once done
     * @return {void}
     */
    load(next) {

        const manager = this.getManager();

        //console.log(manager);

        this.mapFromFile(path.join(__dirname, 'data', 'users.csv'), (model, row, index, cb) => {

            model.email = row.email;
            model.name = row.name;
            model.gender = row.gender;
            model.ipAddress = row.ip_address;
            model.avatar = row.avatar

            // @todo - encrypt this with the security bundle
            model.password = row.password;

            this.addReference(row.reference_id, model);

            manager.persist(model);

        }, () => {

            manager.flush().then(next).catch((err) => {
                console.log(err);
            });
        });

    }
}
