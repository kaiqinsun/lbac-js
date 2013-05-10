/*global define*/

define([
    'lodash',
    'backbone',
    'data/toc',
    'localstorage'
], function (_, Backbone, toc) {
    'use strict';

    // App model used by AppRouter to store the page state in localStorage.
    var App = Backbone.Model.extend({
        localStorage: new Backbone.LocalStorage('lbac-app'),
        defaults: {
            ch: 0,
            sec: ''
        },

        // Validate ch and sec against toc
        validate: function (attrs) {
            var ch = attrs.ch,
                sec = attrs.sec;

            // Validate ch
            if (ch !== _.parseInt(ch).toString() || !toc[ch]) {
                return 'Invalid chapter: ' + ch;
            }
            // Validate sec
            if (sec && !_.any(toc[ch].sections, { sec: sec })) {
                return 'Invalid section: ' + sec;
            }
        }
    });

    return App;
});
