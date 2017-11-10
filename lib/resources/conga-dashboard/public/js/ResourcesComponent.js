import Vue from 'vue';

export default Vue.extend({

    template: `

        <div class="">

            <article class="message is-primary">
                <div class="message-body">
                    These are all of the mapped resources.
                </div>
            </article>

            <article v-for="resource in resources" class="message is-dark">

                <div class="message-header">
                    <p>
                      <strong>{{ resource.type }}</strong> - <span class="has-text-primary is-size-6">({{ resource.file }})</span>
                    </p>
                </div>

                <div class="message-body">

                    <h3 class="is-size-6">Attributes</h3>

                    <section>
                        <table class="table small-text">
                            <thead>
                                <th>Attribute</th>
                                <th>Type</th>
                                <th>
                                    Updatable
                                    <info-tip label="Allow attribute to be created/updated in requests"></info-tip>
                                </th>
                                <th>Exposed</th>
                                <th>Target</th>
                            </thead>
                            <tbody>
                                <tr v-for="property in resource.properties">
                                    <td>{{ property.attribute }}</td>
                                    <td>{{ property.type }}</td>
                                    <td align="center"><check-icon :value="property.update"></check-icon></td>
                                    <td align="center"><check-icon :value="property.expose"></check-icon></td>
                                    <td>{{ property.target }}{{ property.targetType === 'method' ? '()' : '' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>


                    <section v-if="resource.relationships.length > 0">

                        <hr>

                        <h3 class="is-size-6">Relationships</h3>

                        <table class="table small-text">
                            <thead>
                                <th>Attribute</th>
                                <th>Target</th>
                                <th>Type</th>
                                <th>Related Resource</th>
                            </thead>
                            <tbody>
                                <tr v-for="relationship in resource.relationships">
                                    <td>{{ relationship.attribute }}</td>
                                    <td>{{ relationship.target }}</td>
                                    <td>{{ relationship.type }}</td>
                                    <td>{{ relationship.relatedType }}</td>
                                </tr>
                            </tbody>
                        </table>

                    </section>

                </div>

            </article>

        </div>

    `,

    data: function() {
        return {
            resources: []
        }
    },

    created: function() {
        this.$http.get('_conga/api/rest/resources').then((response) => {
            this.resources = response.body.resources;
        }, (response) => {

        });
    }
});
