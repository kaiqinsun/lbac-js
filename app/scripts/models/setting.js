/*global define*/

define([
    'backbone',
], function (Backbone) {
    'use strict';

    var Setting = Backbone.Model.extend({
        defaults:{
            editor: true,
            editorTitle: '',
            console: true,
            consoleTitle: ''
        },

        initialize: function () {
            this.setTitle('editor');
            this.setTitle('console');
        },

        // Toggle the editor or console check state
        // and return the new state
        toggle: function (what) {
            var newState = !this.get(what);
            this.set(what, newState);
            this.setTitle(what);

            return newState;
        },

        // Set the tooltip title of editorTitle or consoleTitle
        // based on what (editor or console)
        setTitle: function (what) {
            var checked = this.get(what);
            if (checked) {
                this.set(what + 'Title', '<div>The ' + what + ' is shown when available.</div><div>Uncheck to hide the ' + what + '.</div>');
            } else {
                this.set(what + 'Title', '<div>Check to show the ' + what + '</div><div>when available.</div>');
            }
        }
    });

    return Setting;
});
