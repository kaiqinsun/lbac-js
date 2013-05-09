/* requirejs configuration */
require.config({
    paths: {

        // components
        jquery: '../components/jquery/jquery',
        text: '../components/requirejs-text/text',
        backbone: '../components/backbone/backbone',
        lodash: '../components/lodash/lodash',
        bootstrap: 'vendor/bootstrap',
        cookie: '../components/jquery.cookie/jquery.cookie',
        prettify: '../components/google-code-prettify/src/prettify',
        marked: '../components/marked/lib/marked',

        // helpers
        common: 'helpers/common',
        io: 'helpers/io',

        // data
        src: '../../data/lbac.src.txt'
    },
    shim: {
        backbone: {
            deps: [
                'lodash',
                'jquery'
            ],
            exports: 'Backbone'
        },
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        },
        cookie: {
            deps: ['jquery'],
            exports: 'jquery'
        }
    },
    packages: ['lbac']
});

require(['app']);
