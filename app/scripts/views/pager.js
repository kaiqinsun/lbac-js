/*global define*/

define([
    'jquery',
    'backbone',
    'templates'
], function ($, Backbone, JST) {
    'use strict';

    // Pager view, to be simple,
    // the pager only renders after collection been reset.
    var PagerView = Backbone.View.extend({
        itemTemplate: JST['app/scripts/templates/pagerItem.ejs'],

        events: {
            'click a': 'itemClicked'
        },

        initialize: function () {
            this.listenTo(this.collection, 'reset', this.render);
        },

        render: function () {
            var itemTemplate = this.itemTemplate,
                html = this.collection.map(function (item) {
                    return itemTemplate(item.attributes);
                }).join('');
            this.$el.html(html).find('a').tooltip();
        },

        // Extra work to remedy the flicker on click.
        itemClicked: function (e) {
            var href = $(e.target).attr('href');
            this.trigger('click:item', href);
            return false;
        }
    });

    return PagerView;
});
