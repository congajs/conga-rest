import Vue from 'vue';


const types = {

    pagination: 'The pagination query parser defines how list endpoints handle paginating results.',
    sorting: 'The sorting query parser defines how list endpoints handle sorting results',
    filtering: 'The filtering query parser defines how list endpoints handle filtering results',
    sparse: 'The sparse query parser defines how GET requests can return specific attributes in the response',
    includes: 'The include query parser defines how GET requests can include related resources in the response'
};



export default Vue.extend({

    template: `

        <div v-if="specification !== null">

            <p>
                <router-link :to="{ name: 'rest.add.api' }" class="button is-primary">
                    Add API
                </router-link>
            </p>

            <article class="message is-primary">
                <div class="message-body">
                    <p>The Specification defines the formatting of request / responses for your API.</p>

                    <p>
                        (<a href="#" target="_blank">view documentation</a>)
                    </p>
                </div>
            </article>

            <section class="content">

                <table>
                    <tbody>
                        <tr>
                            <td>Content Type:</td>
                            <td>{{ specification['content-type'] }}</td>
                        </tr>
                        <tr>
                            <td>Inflection:</td>
                            <td>{{ specification.inflection }}</td>
                        </tr>
                        <tr>
                            <td>Default Date Format:</td>
                            <td>
                                {{ specification['date-format'] }}
                                &nbsp;
                                <span class="is-size-7">
                                    (<a href="https://momentjs.com/docs/#/displaying/format/" target="_blank">uses moment.js date formats</a>)
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td>Query Source:</td>
                            <td>{{ specification.query.source }}</td>
                        </tr>
                    </tbody>
                </table>

                <hr>

                <h2 class="is-size-5">Query Parsers</h2>

                <article class="message is-warning">
                    <div class="message-body">
                        <p>These are the registered parsers to handle pagination, filtering, etc.</p>
                    </div>
                </article>

                <box v-for="(message, type) in types" :key="type">

                    <span slot="header">
                        <p>
                            <strong>{{ type.toUpperCase() }}</strong> - {{ specification.query[type].service }}
                        </p>
                    </span>

                    <span slot="body">
                        <p>{{ message }}</p>
                        <pre><code class="lang-javascript">// querystring usage\n{{ specification.query[type].examples.querystring }}\n\n// body request usage\n{{ specification.query[type].examples.body }}</code></pre>
                    </span>

                </box>

            </section>

        </div>

    `,

    data: function() {
        return {
            specification: null,
            types: types
        }
    },

    created: function() {
        this.$http.get('_conga/api/rest/specification').then((response) => {
            this.specification = response.body.specification;
        }, (response) => {

        });
    },

    updated: function() {
        window.hljs.initHighlighting.called = false;
        window.hljs.initHighlighting();
    }
});
