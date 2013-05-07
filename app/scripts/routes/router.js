/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'data/toc',
    'cookie'
], function ($, _, Backbone, toc) {
    'use strict';

    var AppRouter = Backbone.Router.extend({
        routes: {
            'ch:ch(/:sec)': 'update',
            '*any': 'restorePage'
        },

        update: function (ch, sec) {
            if (!this.validate(ch, sec)) {
                return;
            }
            this.trigger('update', parseInt(ch, 10), sec);

            // save the menu state with cookie
            $.cookie('ch', ch, { expires: 60 });
            $.cookie('sec', sec || '', { expires: 60 });
        },

        // Restore the page state using cookie
        restorePage: function () {
            var ch = $.cookie('ch') || 0,
                sec = ch ? $.cookie('sec') : '',
                fragment;

            fragment = 'ch' + ch;
            if (sec) {
                fragment += '/' + sec;
            }
            this.navigate(fragment, {
                trigger: true,
                replace: true
            });
        },

        // Validate the ch and sec params, restore page if invalid.
        validate: function (ch, sec) {
            var secIsValid;

            // Validate ch
            if (ch !== parseInt(ch, 10).toString() || !toc[ch]) {
                this.restorePage();
                return false;
            }

            // Validate sec
            if (sec) {
                secIsValid = _.some(toc[ch].sections, function (section) {
                    return section.sec === sec;
                });
                if (!secIsValid) {
                    this.restorePage();
                    return false;
                }
            }

            return true;
        }
    });

    return AppRouter;
});
