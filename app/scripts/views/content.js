/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'models/content',
    'models/setting',
    'views/pager',
    'views/setting',
    'views/console',
    'data/toc'
], function ($, _, Backbone, JST, Content, Setting, PagerView, SettingView, ConsoleView, toc) {
    'use strict';

    // Contents view
    var ContentView = Backbone.View.extend({
        infoTemplate: JST['app/scripts/templates/info.ejs'],

        initialize: function () {

            // cache the elements
            this.$info = this.$('#info');
            this.$doc = this.$('#doc');
            this.$editorArea = this.$('#editor-area');
            this.$console = this.$('#console');
            this.$codeArea = this.$('#code-area');
            this.$code = this.$('#code');

            this.content = new Content();
            this.setting = new Setting();

            this.topPagerView = new PagerView({ el: '#top-pager' });
            this.bottomPagerView = new PagerView({ el: '#bottom-pager' });

            this.listenTo(this.content, 'change:doc', this.renderDoc);
            this.listenTo(this.content, 'change:code', this.renderCode);
            this.listenTo(this.content, 'change:hasEditor', this.toggleEditor);
            this.listenTo(this.content, 'change:hasConsole', this.toggleConsole);
            this.listenTo(this.setting, 'change:editor', this.toggleEditor);
            this.listenTo(this.setting, 'change:console', this.toggleConsole);

            this.render();
        },

        render: function () {
            this.$info.show();
            this.settingView = new SettingView({ model: this.setting });
            this.consoleView = new ConsoleView({ el: '#console' });
            this.$codeArea.show();
        },

        // Update the content view
        update: function (ch, sec) {
            this.topPagerView.update(ch, sec);
            this.bottomPagerView.update(ch, sec);
            this.$info.html(this.infoTemplate({
                ch: ch,
                title: toc[ch].title.toUpperCase().replace(/ /g, '&nbsp;')
            }));
            this.content.update(ch, sec);
            this.updateConsole(ch, sec);
        },

        // Update the console view and the content model.
        updateConsole: function (ch, sec) {
            var hasConsole,
                section;

            if (sec) {
                hasConsole = this.consoleView.update(ch, sec);
                this.content.set('hasConsole', hasConsole);

                section = _.find(toc[ch].sections, function (section) {
                    return section.sec === sec;
                });
                this.content.set('hasEditor', !!section.editor);
            } else {
                this.content.set('hasConsole', false);
                this.content.set('hasEditor', false);
            }
        },

        // Render the doc
        renderDoc: function (content) {
            this.settingView.$el.detach();
            this.$doc.html(content.get('doc'));
            this.$doc.children(':first-child').after(this.settingView.el);
        },

        // Render the code
        renderCode: function (content) {
            this.$code.html(content.get('code'));
        },

        // Toggle the editor
        toggleEditor: function () {
            var visible = this.content.get('hasEditor') &&
                    this.setting.get('editor');
            this.$editorArea.toggle(visible);
        },

        // Toggle the console
        toggleConsole: function () {
            var visible = this.content.get('hasConsole') &&
                    this.setting.get('console');
            this.$console.toggle(visible);
        }
    });

    return ContentView;
});
