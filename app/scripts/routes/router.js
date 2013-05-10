/*global define*/

define([
    'jquery',
    'lodash',
    'backbone',
    'models/app'
], function ($, _, Backbone, App) {
    'use strict';

    var AppRouter = Backbone.Router.extend({
        routes: {
            'ch/:ch(/:sec)': 'saveState',
            '*any': 'restorePage'
        },

        initialize: function () {
            this.model = new App({ id: 1 });

            this.listenTo(this.model, 'sync', this.triggerUpdate);
            this.listenTo(this.model, 'invalid', this.restorePage);
        },

        // Save the app state.
        saveState: function (ch, sec) {
            this.model.save({ ch: ch, sec: sec });
        },

        // Restore the page state for invalid state.
        restorePage: function () {
            this.model.fetch();
            var fragment = 'ch/' + this.model.get('ch');

            if (this.model.get('sec')) {
                fragment += '/' + this.model.get('sec');
            }
            this.navigate(fragment, { replace: true });
        },

        // Trigger update event to be observed by AppView.
        triggerUpdate: function () {
            var ch = _.parseInt(this.model.get('ch')),
                sec = this.model.get('sec');
            this.trigger('update', ch, sec);
        }
    });

    return AppRouter;
});
