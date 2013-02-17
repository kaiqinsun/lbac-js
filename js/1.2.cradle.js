/**
 * Chapter 1.2 The Cradle
 */

var LBAC = LBAC || {};  // Namespace LBAC (Let's Build a Compiler)

// Base object for prototypal inheritance
LBAC.object = (function ($) {
    'use strict';

    return {

        // Extend method for prototyal inheritance
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

        // get the binded main function
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
}(jQuery));

// Program cradle
LBAC.cradle = (function () {
    'use strict';

    /**
     * const: TAB, CR, LF
     * variable: look
     * function: getChar, error, abort, expected,
     *           match, isAlpha, isDigit, getName, getNum
     *           emit, emitLn, init, main
     */
    return LBAC.object.extend({

        // Constant declarations
        TAB: '\t',
        CR: '\r',
        LF: '\n',

        // Variable declarations
        look: '',   // lookahead character

        // Read new character from input
        getChar: function () {
            this.look = read();
        },

        // Report an error
        error: function (str) {
            writeLn('Error: ', str, '.');
        },

        // Report error and halt
        abort: function (str) {
            this.error(str);
            halt();
        },

        // Report what was expected
        expected: function (str) {
            this.abort(str + ' Expected');
        },

        // Match a specific input character
        match: function (x) {
            if (this.look === x) {
                this.getChar();
            } else {
                this.expected('"' + x + '"');
            }
        },

        // Recognize an alpha character
        isAlpha: function (c) {
            return (/[A-Z]/i).test(c);
        },

        // Recognize a decimal digit
        isDigit: function (c) {
            return (/\d/).test(c);
        },

        // Get an identifier
        getName: function () {
            var name;
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            name = this.look.toUpperCase();
            this.getChar();
            return name;
        },

        // Get a number
        getNum: function () {
            var num;
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            num = this.look;
            this.getChar();
            return num;
        },

        // Output a string with tab
        emit: function (str) {
            write(this.TAB + str);
        },

        // Output a string with tab and newline
        emitLn: function (str) {
            this.emit(str);
            writeLn();
        },

        // Initialize
        init: function () {
            this.getChar();
        },

        // Main function
        main: function () {
            this.init();
        }

    });

}());