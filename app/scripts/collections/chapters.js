/*global define*/

define([
    'backbone',
    'models/chapter'
], function (Backbone, Chapter) {
    'use strict';

    var Chapters = Backbone.Collection.extend({
        model: Chapter
    });

    return Chapters;
});
