/**
 * Chapter 1 Introduction
 */

/**
 * 1.2 The cradle
 */

define(['./object', 'io'], function (object, io) {
    'use strict';

   /**
    * const: TAB, CR, LF
    * variable: look
    * function: getChar, error, abort, expected,
    *           match, isAlpha, isDigit, getName, getNum
    *           emit, emitLn, init, main
    */
    return object.extend({

        // Constant declarations
        TAB: '\t',
        CR: '\r',
        LF: '\n',

        // Variable declarations
        look: '',   // lookahead character

        // Read new character from input
        getChar: function () {
            this.look = io.read();
        },

        // Report an error
        error: function (str) {
            io.writeLn('Error: ', str, '.');
        },

        // Report error and halt
        abort: function (str) {
            this.error(str);
            io.halt();
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
            io.write(this.TAB, str);
        },

        // Output a string with tab and newline
        emitLn: function (str) {
            this.emit(str);
            io.writeLn();
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

});