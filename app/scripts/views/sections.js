/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'collections/sections'
], function ($, _, Backbone, JST, Sections) {
    'use strict';

    // The content of the accordion-body
    var SectionsView = Backbone.View.extend({
        tagName: 'ul',
        className: 'accordion-inner nav nav-tabs nav-stacked',
        template: JST['app/scripts/templates/sectionItem.ejs'],

        initialize: function (sections, ch) {
            _.each(sections, function (section) {
                section.ch = ch;
            });
            this.collection = new Sections(sections);
            this.render();
        },

        render: function () {
            var that = this;
            this.collection.each(function (section) {
                that.$el.append(that.template(section.attributes));
            });
            return this;
        }
    });

    return SectionsView;
});
