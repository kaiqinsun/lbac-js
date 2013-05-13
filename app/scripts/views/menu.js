/*global define*/

define([
    'jquery',
    'lodash',
    'backbone',
    'templates',
    'models/menu',
    'data/toc'
], function ($, _, Backbone, JST, Menu, toc) {
    'use strict';

    // Accordion menu view consists of chapter <div>'s
    // and section subviews (<ul> for each chapter).
    var MenuView = Backbone.View.extend({
        chapterTemplate: JST['app/scripts/templates/chapterItem.ejs'],
        sectionTemplate: JST['app/scripts/templates/sectionItem.ejs'],

        events: {
            'click .disabled a': function () { return false; },
            'click .accordion-toggle': 'chapterClicked'
        },

        initialize: function () {
            this.model = new Menu();

            this.listenTo(this.model, 'change:ch', this.toggleCh);
            this.listenTo(this.model, 'change:active', this.toggleActive);
        },

        // Render the accordion menu.
        render: function () {
            var chapterTemplate = this.chapterTemplate,
                sectionTemplate = this.sectionTemplate;

            var html = _.map(toc, function (chapter) {
                chapter.sectionTemplate = sectionTemplate;
                return chapterTemplate(chapter);
            }).join('');

            this.$el.html(html);
        },

        // Update the menu state
        update: function (ch, sec) {
            this.model.set('ch', ch);

            if (sec) {
                this.model.set('active', '#sec' + sec.replace(/\./g, '-'));
            } else {
                this.model.set('active', '#chapter' + ch);
            }
        },

        // Extra work to remedy the flicker when switching to chapter
        chapterClicked: function (e) {
            var href = $(e.target).attr('href');
            this.trigger('click:chapter', href);
            e.preventDefault();
        },

        // Toggle the accordian menu
        toggleCh: function (menu, ch) {
            this.$('#ch' + menu.previous('ch')).collapse('hide');
            this.$('#ch' + ch).collapse('show');
        },

        // Toggle the class of previous/current active items
        toggleActive: function (menu, active) {
            this.$(menu.previous('active')).removeClass('btn-primary');
            this.$(active).addClass('btn-primary');
        }
    });

    return MenuView;
});
