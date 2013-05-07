/*global define*/

define([
    'backbone',
    'models/section'
], function (Backbone, Section) {
    'use strict';

    var Sections = Backbone.Collection.extend({
        model: Section
    });

    return Sections;
});
