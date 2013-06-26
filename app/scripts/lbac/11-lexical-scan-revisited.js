/*global define*/

/**
 * Chapter 11 Lexical Scan Revisited
 * ==================================
 */

define(['./1.2-cradle', 'io'], function (cradle, io) {
    'use strict';

    /**
     * 11.1 Introduction
     * ------------------
     * A way to simplify and improve the lexical scanning part of the
     * compiler.
     */

    /**
     * 11.2 Background
     * ----------------
     */

    /**
     * 11.3 The problem
     * -----------------
     * The problem begins to show itself in procedure Block.
     * At each pass through the loop, we know that we are at the beginning
     * of a statement. We exit the block when we have scanned an `END` or
     * an `ELSE`.
     *
     * But suppose that we see a semicolon instead. The procedure as it’s
     * shown above can’t handle that, because procedure Scan only expects
     * and can only accept tokens that begin with a letter.
     */

    /**
     * 11.4 The solution
     * ------------------
     * Verify that you can separate a program into a series of tokens,
     * and that you get the right encoding for each token.
     *
     * For example
     * ```
     * if foo>=bar
     *     bar=10*foo
     * endif
     * (a+b)*(c+d)
     * end
     * .
     * ```
     * This ALMOST works, but not quite. There are two potential problems:
     * - First, in KISS/TINY almost all of our operators are
     * single-character operators. The only exceptions are the relops
     * `>=`, `<=`, and `<>`.
     * - Second, and much more important, the thing doesn’t WORK when two
     * operators appear together, as in `(a+b)*(c+d)`. Here the string
     * following `b` would be interpreted as a single operator `)*(`.
     */
    var theSolution = cradle.extend({

        // Recognize an alphanumeric character.
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
        },

        // Recognize white space.
        isWhite: function (c) {
            return c === ' ' || c === this.TAB ||
                   c === this.CR || c === this.LF;
        },

        // Skip over leading white space.
        skipWhite: function () {
            while (this.isWhite(this.look)) {
                this.getChar();
            }
        },

        // Get an identifier.
        getName: function () {
            this.skipWhite();                           // <--
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            this.token = 'x';                           // <--
            this.value = '';
            do {                                        // <--
                this.value += this.look.toUpperCase();
                this.getChar();
            } while (this.isAlNum(this.look));          // <
        },

        // Get a Number.
        getNum: function () {
            this.skipWhite();                           // <--
            if (!this.isDigit(this.look)) {
                this.expected('Number');
            }

            this.token = '#';                           // <--
            this.value = '';                            // <
            do {                                        // <
                this.value += this.look;                // <
                this.getChar();
            } while (this.isDigit(this.look));          // <
        },

        // Get an operator.
        getOp: function () {
            this.token = this.look;
            this.value = '';
            do {
                this.value += this.look;
                this.getChar();
            } while (!this.isAlpha(this.look) && !this.isDigit(this.look) &&
                     !this.isWhite(this.look));
        },

        // Get the next input token.
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

        // Main program.
        main: function () {
            this.init();
            do {
                this.next();
                io.writeLn(this.token, ' ', this.value);
            } while (this.token !== '.');
        }
    });

    /**
     * ### 11.4.2 Single-character operators ###
     * Since almost all the operators are single characters, let’s just
     * treat them that way, and let `getOp` get only one character at a time.
     */
    var singleCharacterOperators = theSolution.extend({

        // Get an operator.
        getOp: function () {
            this.token = this.look;
            this.value = this.look;
            this.getChar();
        },

        // Scan the current identifier for keywords.
        scan: function () {
            if (this.token === 'x') {
                this.token = this.keywordCode(this.value);
            }
        },

        // Match a specific input string.
        matchString: function (str) {
            if (this.value !== str) {
                this.expected('"' + str + '"');
            }

            this.next();                            // <--
        }
    });

    /**
     * 11.5 Fixing up the compiler
     * ----------------------------
     * in file: `11.6-tiny-1.1.js`
     *
     * 11.6 Conclusion
     * ----------------
     * in file: `11.6-tiny-1.1.js`
     */


    return {

        // 11.4.1
        theSolution: theSolution,

        // 11.4.2
        singleCharacterOperators: singleCharacterOperators
    };

});
