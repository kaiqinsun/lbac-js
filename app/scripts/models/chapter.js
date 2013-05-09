/*global define*/

define([
    'backbone',
], function (Backbone) {
    'use strict';

    var Chapter = Backbone.Model.extend({
        defaults: {
            ch: 0,
            title: 'Untitled'
        }
    });

    return Chapter;
});
