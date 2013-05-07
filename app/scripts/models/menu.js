/*global define*/

define([
    'backbone',
], function (Backbone) {
    'use strict';

    // Menu model to keep the menu state
    var Menu = Backbone.Model.extend({
        defaults:{
            ch: -1,     // curent ch
            active: ''   // current selector of active item
        }
    });

    return Menu;
});
