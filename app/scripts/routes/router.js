/*global define*/

define([
    'jquery',
    'lodash',
    'backbone',
    'common',
    'cookie'
], function ($, _, Backbone, common) {
    'use strict';

    var AppRouter = Backbone.Router.extend({
        routes: {
            'ch:ch(/:sec)': 'update',
            '*any': 'restorePage'
        },

        update: function (ch, sec) {
            if (!common.isValid(ch, sec)) {
                this.restorePage();
                return;
            }
            this.trigger('update', _.parseInt(ch), sec);

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
        }
    });

    return AppRouter;
});
