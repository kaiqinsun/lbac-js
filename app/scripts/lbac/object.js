/**
 * **Let's Build a Compiler** port in Javascript - Preparation
 * Base object for prototypal inheritance and utilities
 */

define(['jquery'], function ($) {
    'use strict';

    return {

        // Extend method used for prototyal inheritance
        extend: function (obj) {
            var newObj = Object.create(this),
                prop;

            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    newObj[prop] = obj[prop];
                }
            }
            return newObj;
        },

        // get the bound main function
        boundMain: function (obj) {
            return obj.main.bind(obj);
        },

        // Helper, covert an array to an object to work as enum
        // e.g. enumerate([a, b]) => { a: 0, b: 1 }
        enumerate: function (arr, start) {
            var result = Object.create(null);

            start = start || 0;
            $.each(arr, function (i, name) {
                result[name] = start + i;
            });
            return result;
        }
    };

});