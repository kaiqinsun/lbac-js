/*global define*/

define([
    'backbone'
], function (Backbone) {
    'use strict';

    var PagerItem = Backbone.Model.extend({
        defaults:{
            className: '',
            href: '#',
            title: 'Untitled',
            text: 'Untitled',
            placement: ''   // tooltip placement
        }
    });

    return PagerItem;
});
