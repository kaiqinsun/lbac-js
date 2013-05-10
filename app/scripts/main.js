/* requirejs configuration */
require.config({
    paths: {

        // components
        jquery: '../components/jquery/jquery',
        text: '../components/requirejs-text/text',
        backbone: '../components/backbone-amd/backbone',
        localstorage: '../components/backbone.localStorage/backbone.localStorage',
        lodash: '../components/lodash/lodash',
        bootstrap: 'vendor/bootstrap',
        prettify: '../components/google-code-prettify/src/prettify',
        marked: '../components/marked/lib/marked',

        // helpers
        common: 'helpers/common',
        io: 'helpers/io',

        // data
        src: '../../data/lbac.src.txt'
    },
    shim: {
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        }
    },
    map: {
        '*': {
            underscore: 'lodash'
        }
    },
    packages: ['lbac']
});

require(['app']);
