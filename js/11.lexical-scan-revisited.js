/**
 * Chapter 11 Lexical scan revisited
 */

var LBAC = LBAC || {};

LBAC.lexicalScanRevisited = (function () {
    'use strict';

    var boundMain = LBAC.object.boundMain,
        theSolution,                // 11.4.1
        singleCharacterOperators;   // 11.4.2

    // 11.1 Introduction

    // 11.2 background

    // 11.3 The problem

    // 11.4 The solution
    theSolution = LBAC.cradle.extend({

        // Recognize an alphanumeric character
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
        },

        // Recognize white space
        isWhite: function (c) {
            return c === ' ' || c === this.TAB ||
                   c === this.CR || c === this.LF;
        },

        // Skip over leading white space
        skipWhite: function () {
            while (this.isWhite(this.look)) {
                this.getChar();
            }
        },

        // Get an identifier
        getName: function () {
            this.skipWhite();
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            this.token = 'x';
            this.value = '';
            do {
                this.value += this.look.toUpperCase();
                this.getChar();
            } while (this.isAlNum(this.look));
        },

        // Get a Number
        getNum: function () {
            this.skipWhite();
            if (!this.isDigit(this.look)) {
                this.expected('Number');
            }
            this.token = '#';
            this.value = '';
            do {
                this.value += this.look;
                this.getChar();
            } while (this.isDigit(this.look));
        },

        // Get an operator
        getOp: function () {
            this.token = this.look;
            this.value = '';
            do {
                this.value += this.look;
                this.getChar();
            } while (!this.isAlpha(this.look) && !this.isDigit(this.look) &&
                     !this.isWhite(this.look));
        },

        // Get the next input token
        next: function () {
            this.skipWhite();
            if (this.isAlpha(this.look)) {
                this.getName();
            } else if (this.isDigit(this.look)) {
                this.getNum();
            } else {
                this.getOp();
            }
        },

        // Main program
        main: function () {
            this.init();
            do {
                this.next();
                writeLn(this.token, ' ', this.value);
            } while (this.token !== '.');
        }

    });

    // 11.4.2 Single-character operators
    // e.g. (a+b)*(c+d), problem of op: ')*(' is fixed.
    singleCharacterOperators = theSolution.extend({

        // Get an operator
        getOp: function () {
            this.token = this.look;
            this.value = this.look;
            this.getChar();
        },

        // Scan the current identifier for keywords
        scan: function () {
            if (this.token === 'x') {
                this.token = this.keywordCode(this.value);
            }
        },

        // Match a specific input string
        matchString: function (str) {
            if (this.value !== str) {
                this.expected('"' + str + '"');
            }
        }

    });

    // 11.5 Fixing up the compiler

    // 11.6 Conclusion
    // in file: tiny-1.1.js


    // return main functions for executions
    return {

        theSolution: boundMain(theSolution),
        singleCharacterOperators: boundMain(singleCharacterOperators)

    };

}());