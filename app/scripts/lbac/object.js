/*global define*/

/**
 * Prologue
 * ========
 * This is a JavaScript port of **Let's Build a Compiler**,
 * *a non-technical introduction to compiler construction*,
 * written from 1988 to 1995 by Jack W. Crenshaw.
 * Please refer to the [original tutorial][original]
 * or alternatively a [LaTeX typeset PDF version][latex].
 *
 * [original]: http://compilers.iecc.com/crenshaw/
 * [latex]: http://www.stack.nl/~marcov/compiler.pdf
 *
 * The JavaScript code was ported section by section based on
 * *prototypal inheritance*.
 * It aims to be translated as direct as possible to the
 * [original Pascal version][original].
 * Some text is taken from the original tutorial to help you to follow
 * the context.
 * A tiny console with an editor when needed is provided
 * for user interactions.
 *
 * The base object
 * ------------
 * The base `object` provides the `object.extend` method
 * for *prototypal inheritance*.
 *
 */

define(function () {
    'use strict';

    var object = {

        // Extend the object (prototyal inheritance).
        extend: function (obj) {
            var newObj = Object.create(this),
                prop;

            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    newObj[prop] = obj[prop];
                }
            }
            return newObj;
        }
    };

    return object;
});
