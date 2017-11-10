import Vue from 'vue';

export default Vue.extend({

    template: `

        <div>

            <hero>

                <span slot="hero-title">REST</span>
                <span slot="hero-subtitle">@conga/framework-rest</span>

                <div class="container" slot="hero-foot">

                    <tab-container>
                        <tab route="rest" label="Specification"></tab>
                        <tab route="rest.resources" label="Resources"></tab>
                        <tab route="rest.endpoints" label="Endpoints"></tab>
                    </tab-container>

                </div>

            </hero>

            <main-section>

                <div class="content">
                    <router-view></router-view>
                </div>

            </main-section>

        </div>

    `,

    components: {
        //'navbar-component': NavbarComponent
    }
});
