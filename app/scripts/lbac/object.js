/**
 * Prologue
 * ========
 * This is a JavaScript port of **Let's Build a Compiler**,
 * *a non-technical introduction to compiler construction*,
 * written from 1988 to 1995 by Jack W. Crenshaw.
 * Please refer to the [original context][original]
 * or alternatively a [LaTeX typeset PDF version][latex].
 *
 * [original]: http://compilers.iecc.com/crenshaw/
 * [latex]: http://www.stack.nl/~marcov/compiler.pdf
 *
 * The JavaScript code was ported section by section based on
 * *prototypal inheritance*.
 * It aims to be as similar to the [original Pascal version][original]
 * as possible.
 * A tiny console is provided with necessary I/O routines and
 * for user interactions.
 *
 * The base object
 * ------------
 * The base `object` defined here provides the `object.extend` method
 * for *prototypal inheritance* and some other helper functions.
 *
 */

define(['jquery'], function ($) {
    'use strict';

    // Polyfill
    if (!Object.create) {
        Object.create = function (o) {
            if (arguments.length > 1) {
                throw new Error('Object.create implementation only accepts the first parameter.');
            }
            function F() {}
            F.prototype = o;
            return new F();
        };
    }

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

        /**
         * Helper functions
         */

        // get the bound main function
        boundMain: function (obj) {
            return obj.main.bind(obj);
        },

        // Convert an array to an object to work as enum
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
