/*global define*/

define([
    'backbone',
], function (Backbone) {
    'use strict';

    var Section = Backbone.Model.extend({
        defaults:{
            sec: '',
            title: 'Untitled',
            disabled: false
        }
    });

    return Section;
});
