/*global define*/

define([
    'jquery',
    'backbone',
    'templates',
    'views/menu',
    'views/content'
], function ($, Backbone, JST, MenuView, ContentView) {
    'use strict';

    var isFirstUpdate = false;

    // Top level application view
    var AppView = Backbone.View.extend({
        el: 'body',

        initialize: function () {
            this.menuView = new MenuView();
            this.$content = $('#content');

            this.render();
        },

        render: function () {
            this.$('#menu').html(this.menuView.el);
            this.contentView = new ContentView({ el: this.$content });
            this.$('#footer').show();
            this.$('#loading').remove();
        },

        // Update the menu and content views
        update: function (ch, sec) {
            this.menuView.update(ch, sec);
            this.contentView.update(ch, sec);

            // Scroll top if the view is not the first update.
            if (isFirstUpdate) {
                $('html, body').scrollTop(this.$content.offset().top - 20);
            } else {
                isFirstUpdate = true;
            }
        }
    });

    return AppView;
});
