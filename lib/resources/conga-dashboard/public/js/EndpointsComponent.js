import Vue from 'vue';

export default Vue.extend({

    template: `

        <div class="">

            <article class="message is-primary">
                <div class="message-body">
                    These are all of the mapped resource endpoints.
                </div>
            </article>

            <article v-for="endpoint in endpoints" class="message is-dark">

                <div class="message-header">
                    <p class="is-size-5">{{ endpoint.resource }}</p>
                </div>

                <div class="message-body">

                    <table>
                        <tbody>
                            <tr>
                                <td>Bundle:</td>
                                <td>{{ endpoint.controller.bundle }}</td>
                            </tr>
                            <tr>
                                <td>Controller:</td>
                                <td>{{ endpoint.controller.file }}</td>
                            </tr>
                            <tr>
                                <td>Pagination Enabled:</td>
                                <td><check-icon :value="endpoint.controller.isPaginationEnabled"></check-icon></td>
                            </tr>
                            <tr>
                                <td>Default Limit:</td>
                                <td>{{ endpoint.controller.defaultLimit }}</td>
                            </tr>
                            <tr>
                                <td>Default Sort:</td>
                                <td>{{ endpoint.controller.defaultSort | json }}</td>
                            </tr>
                        </tbody>
                    </table>

                    <hr>

                    <table class="table small-text">
                        <thead>
                            <th>Method</th>
                            <th>Path</th>
                            <th>Controller Action</th>
                        </thead>
                        <tbody>
                            <tr v-for="route in endpoint.routes">
                                <td>{{ route.method }}</td>
                                <td>{{ route.path }}</td>
                                <td>{{ route.action }}()</td>
                            </tr>
                        </tbody>
                    </table>

            </article>


        </div>

    `,

    data: function() {
        return {
            endpoints: []
        }
    },

    created: function() {
        this.$http.get('_conga/api/rest/endpoints').then((response) => {
            this.endpoints = response.body.endpoints;
        }, (response) => {

        });
    }
});
