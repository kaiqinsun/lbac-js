/*global define*/

define([
    'jquery',
    'backbone',
    'templates',
    'models/menu',
    'collections/chapters',
    'views/sections',
    'data/toc'
], function ($, Backbone, JST, Menu, Chapters, SectionsView, toc) {
    'use strict';

    // Accordion menu view consists of chapter <div>'s
    // and section subviews (<ul> for each chapter).
    var MenuView = Backbone.View.extend({
        className: 'accordion-group',
        template: JST['app/scripts/templates/chapterItem.ejs'],

        events: {
            'click .disabled a': 'preventDefault',
            'click .accordion-toggle': 'chapterClicked'
        },

        initialize: function () {
            this.model = new Menu();
            this.chapters = new Chapters(toc);

            this.listenTo(this.model, 'change:ch', this.toggleCh);
            this.listenTo(this.model, 'change:active', this.toggleActive);

            this.render();
        },

        render: function () {
            var that = this;

            this.chapters.each(function (chapter) {
                var sectionsView;
                chapter = chapter.attributes;

                // Append the chapter item
                that.$el.append(that.template(chapter));

                // Append the section list
                sectionsView = new SectionsView(chapter.sections, chapter.ch);
                that.$('#ch' + chapter.ch).append(sectionsView.el);
            });
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

        // Prevent default for the click event of disalbed menu items
        preventDefault: function (e) {
            e.preventDefault();
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
