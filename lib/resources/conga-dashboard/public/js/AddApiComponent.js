import Vue from 'vue';

const defaultApi = {
    className: '',
    resource: '',
    route: '',
    bundle: '',
    attributes: [{
        name: '',
        type: 'String',
        expose: true,
        updatable: true
    }],
    relationships: [],
    allowedMethods: [
        'list',
        'get',
        'post',
        'patch',
        'delete'
    ],
    bulk: true
};

export default Vue.extend({

    template: `

        <div class="">

            <article class="message is-primary">
                <div class="message-body">
                    Use this form to automatically generate an API resource/bass.js model and controller.
                </div>
            </article>

            <div>
                <div class="field is-horizontal">
                    <div class="field-label">
                        <label class="label">Class Name</label>
                    </div>
                    <div class="field-body">
                        <div class="field">
                            <div class="control">
                                <input class="input" v-model="api.className" placeholder="The class name for your resource/model (i.e. User)">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="field is-horizontal">
                    <div class="field-label">
                        <label class="label">Resource Name</label>
                    </div>
                    <div class="field-body">
                        <div class="field">
                            <div class="control">
                                <input class="input" v-model="api.resource" placeholder="The class name for your resource/model (i.e. user)">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="field is-horizontal">
                    <div class="field-label">
                        <label class="label">API Path</label>
                    </div>
                    <div class="field-body">
                        <div class="field">
                            <div class="control">
                                <input class="input" v-model="api.route" placeholder="The API path for your resource (i.e. /api/users)">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="field is-horizontal">
                    <div class="field-label">
                        <label class="label">Target Bundle</label>
                    </div>
                    <div class="field-body">
                        <div class="field">
                            <div class="control">
                                <div class="select">
                                    <select v-model="api.bundle">
                                        <option v-for="bundle in bundles">{{ bundle.name }}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="field is-horizontal">
                    <div class="field-label">
                        <label class="label">Allow Bulk Methods</label>
                    </div>
                    <div class="field-body">
                        <div class="field">
                            <div class="control">
                                <input type="checkbox" id="bulk" :value="true" v-model="api.bulk">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="field is-horizontal">
                    <div class="field-label">
                        <label class="label">Allowed Methods</label>
                    </div>
                    <div class="field-body">
                        <div class="field">
                            <div class="control" v-for="method in methods">
                                <input type="checkbox" :id="method.name" :value="method.name" v-model="api.allowedMethods" :disabled="method.bulk && !api.bulk">
                                <label :for="method.name">{{ method.method }} {{ method.path }}</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="field is-horizontal">
                    <div class="field-label">
                        <label class="label">Attributes</label>
                    </div>
                    <div class="field-body">
                        <div class="field">

                            <table class="table">
                                <thead>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Expose</th>
                                    <th>Updatable</th>
                                    <th>&nbsp;</th>
                                </thead>

                                <tbody>
                                    <tr v-for="(attribute, index) in api.attributes">
                                        <td>
                                            <div class="control">
                                                <input class="input" v-model="attribute.name" placeholder="">
                                            </div>
                                        </td>
                                        <td>
                                            <div class="control">
                                                <div class="select">
                                                    <select v-model="attribute.type">
                                                        <option>String</option>
                                                        <option>Number</option>
                                                        <option>Boolean</option>
                                                        <option>Date</option>
                                                        <option disabled="disabled">----</option>
                                                        <option>Array</option>
                                                        <option>Object</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="control">
                                                <input
                                                    type="checkbox"
                                                    v-model="attribute.expose"
                                                >
                                            </div>
                                        </td>
                                        <td>
                                            <div class="control">
                                                <input
                                                    type="checkbox"
                                                    v-model="attribute.updatable"
                                                >
                                            </div>
                                        </td>
                                        <td>
                                            <a v-on:click="deleteAttribute(index)">
                                                <i class="fa fa-trash" />
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <p>
                                <a v-on:click="addAttribute">+ Add Attribute</a>
                            </p>

                        </div>
                    </div>
                </div>


                <div class="field is-horizontal">
                    <div class="field-label">
                        <label class="label">Relationships</label>
                    </div>
                    <div class="field-body">
                        <div class="field">

                            <table class="table">
                                <thead>
                                    <th>Attribute</th>
                                    <th>Type</th>
                                    <th>Related Resource</th>
                                    <th>&nbsp;</th>
                                </thead>

                                <tbody>
                                    <tr v-for="(relationship, index) in api.relationships">
                                        <td>
                                            <div class="control">
                                                <input class="input" v-model="relationship.name" placeholder="">
                                            </div>
                                        </td>
                                        <td>
                                            <div class="control">
                                                <div class="select">
                                                    <select v-model="relationship.type">
                                                        <option value="one">One</option>
                                                        <option value="many">Many</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="control">
                                                <div class="select">
                                                    <select v-model="relationship.relatedResource">
                                                        <option v-for="resource in resources">{{ resource.name }}</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <a v-on:click="deleteRelationship(index)">
                                                <i class="fa fa-trash" />
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <p>
                                <a v-on:click="addRelationship">+ Add Relationship</a>
                            </p>

                        </div>
                    </div>
                </div>

                <button v-on:click="create" class="button is-primary" :disabled="saving">Create API</button>

            </div>

        </div>

    `,

    data: function() {

        return {
            saving: false,
            api: Object.assign({}, defaultApi),
            bundles: [],
            resources: [],
            methods: []
        }
    },

    methods: {

        addAttribute: function() {
            this.api.attributes.push({
                name: '',
                type: 'String',
                expose: true,
                updatable: true
            });
        },

        deleteAttribute: function(index) {
            this.api.attributes.splice(index, 1);
        },

        addRelationship: function() {
            this.api.relationships.push({
                name: '',
                type: 'one',
                relatedResource: ''
            });
        },

        deleteRelationship: function(index) {
            this.api.relationships.splice(index, 1);
        },

        create: function() {
            this.saving = true;
            this.$http.post('_conga/api/rest/api', {
                api: this.api
            }).then((response) => {
                this.saving = false;
                this.$modal.alert('New API Created', 'Your new API has been created in your project!');
                Object.assign(this.api, defaultApi);
                this.api.bundle = this.defaultBundle;
            }, (response) => {

            });
        }
    },

    created: function() {
        this.$http.get('_conga/api/rest/resources').then((response) => {
            this.resources = response.body.resources;
        }, (response) => {

        });

        this.$http.get('_conga/api/rest/bundles').then((response) => {
            this.bundles = response.body.bundles;
            this.defaultBundle = this.bundles[0].name;
            this.api.bundle = this.defaultBundle;
        }, (response) => {

        });

        this.$http.get('_conga/api/rest/methods').then((response) => {
            this.methods = response.body.methods;
        }, (response) => {

        });

    }
});
