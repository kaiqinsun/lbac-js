/* global define */

/**
 * Chapter 1 Introduction
 * ======================
 * 1.1 Introduction
 * ----------------
 * This series of articles is a tutorial on the theory and
 * practice of developing language parsers and compilers.
 * Before we are finished, we will have covered every aspect of
 * compiler construction, designed a new programming language,
 * and built a working compiler.
 *
 * 1.2 The cradle
 * --------------
 * The `cradle` is a boiler plate that consists of some *I/O routines*,
 * an *error-handling routine* and a *skeleton, null main program*.
 *
 * **A short list of the cradle**
 * ```
 * const:    TAB, CR, LF
 * variable: look
 * function: getChar, error, abort, expected,
 *           match, isAlpha, isDigit, getName, getNum
 *           emit, emitLn, init, main
 * ```
 */

define(['./object', 'io'], function (object, io) {
    'use strict';

    var cradle = object.extend({

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

    return cradle;
});
