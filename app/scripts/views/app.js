/*global define*/

define([
    'jquery',
    'backbone',
    'templates',
    'views/menu',
    'views/content'
], function ($, Backbone, JST, MenuView, ContentView) {
    'use strict';

    var isFirstUpdate = true;

    // Top level application view
    var AppView = Backbone.View.extend({
        el: 'body',

        initialize: function () {
            this.$content = $('#content');
            this.menuView = new MenuView({ el: '#menu' });
            this.contentView = new ContentView({ el: this.$content });
        },

        render: function () {
            this.menuView.render();
            this.contentView.render();
            this.$('#loading').remove();
            this.$('#footer').show();
        },

        // Update the menu and content views
        update: function (ch, sec) {
            this.menuView.update(ch, sec);
            this.contentView.update(ch, sec);

            // Scroll top if the view is not the first update.
            if (isFirstUpdate) {
                isFirstUpdate = false;
            } else {
                $('html, body').scrollTop(this.$content.offset().top - 20);
            }
        }
    });

    return AppView;
});
