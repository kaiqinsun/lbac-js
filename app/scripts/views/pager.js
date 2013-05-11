/*global define*/

define([
    'jquery',
    'backbone',
    'templates'
], function ($, Backbone, JST) {
    'use strict';

    // Pager view
    var PagerView = Backbone.View.extend({
        template: JST['app/scripts/templates/pagerItem.ejs'],

        events: {
            'click a': 'itemClicked'
        },

        initialize: function () {
            this.listenTo(this.collection, 'reset', this.render);
        },

        render: function () {
            var template = this.template,
                html = this.collection.map(function (item) {
                    return template(item.attributes);
                }).join('');
            this.$el.html(html).find('a').tooltip();
        },

        // Extra work to remedy the flicker when switching to chapter
        itemClicked: function (e) {
            var href = $(e.target).attr('href');
            this.trigger('click:item', href);
            return false;
        }
    });

    return PagerView;
});
