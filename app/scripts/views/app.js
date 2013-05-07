/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'views/menu',
    'views/content'
], function ($, _, Backbone, JST, MenuView, ContentView) {
    'use strict';

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
            $('html, body').scrollTop(this.$content.offset().top - 20);
        }
    });

    return AppView;
});
