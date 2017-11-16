export default [

    {
        path: "/rest",
        component: require('./RestComponent').default,

        children: [
            {
                name: "rest",
                path: "",
                component: require('./SpecificationComponent').default
            },
            {
                name: "rest.resources",
                path: "resources",
                component: require('./ResourcesComponent').default
            },
            {
                name: "rest.endpoints",
                path: "endpoints",
                component: require('./EndpointsComponent').default
            },
            {
                name: "rest.add.api",
                path: "add-api",
                component: require('./AddApiComponent').default
            },
        ]
    }

];
