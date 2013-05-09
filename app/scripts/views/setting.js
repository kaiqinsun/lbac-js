/*global define*/

define([
    'jquery',
    'backbone',
    'templates'
], function ($, Backbone, JST) {
    'use strict';

    // Settings dropdown menu with custom checkbox itmes
    var SettingView = Backbone.View.extend({
        className: 'clearfix',
        template: JST['app/scripts/templates/setting.ejs'],
        events: {
            'click #toggle-editor': 'toggleEditorItem',
            'click #toggle-console': 'toggleConsoleItem'
        },

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(this.template(this.model.attributes));
            this.$toggleEditor = this.$('#toggle-editor');
            this.$toggleConsole = this.$('#toggle-console');
            this.$toggleEditor.tooltip({ html: true });
            this.$toggleConsole.tooltip({ html: true });
            return this;
        },

        // Toggle the check icon and update the tooltip
        toggleEditorItem: function (e) {

            // Update model
            this.model.toggle('editor');
            e.preventDefault();

            // Update check icon and tooltip
            this.$('#toggle-editor i')
                    .toggleClass('icon-ok', this.model.get('editor'));
            this.$toggleEditor.tooltip('destroy').tooltip({
                title: this.model.get('editorTitle'),
                html: true
            });
        },

        // Toggle the check icon and update the tooltip
        toggleConsoleItem: function (e) {

            // Update model
            this.model.toggle('console');
            e.preventDefault();

            // Update check icon and tooltip
            this.$('#toggle-console i')
                    .toggleClass('icon-ok', this.model.get('console'));
            this.$toggleConsole.tooltip('destroy').tooltip({
                title: this.model.get('consoleTitle'),
                html: true
            });
        }
    });

    return SettingView;
});
