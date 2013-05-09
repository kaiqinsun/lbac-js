/*global define*/

/**
 * Chapter 12 Miscellany
 * ======================
 */

define(['./11.6-tiny-1.1'], function (tiny11) {
    'use strict';

    var dealingWithSemicolons;          // 12.4

    /**
     * 12.1 Introduction
     * ------------------
     */

    /**
     * 12.2 Semicolons
     * ----------------
     */

    /**
     * 12.3 Syntactic sugar
     * ---------------------
     */

    /**
     * 12.4 Dealing with semicolons
     * -----------------------------
     * In **Pascal**, semicolon is a statement *SEPARATOR*
     * ```
     * <block> ::= <statement> (';' <statement>)*
     * <statement> ::= <assignment> | <if> | <while> ... | null
     * ```
     * In **C** and **Ada**, semicolon is a statement *TERMINATOR*
     * ```
     * <block> ::= (<statement> ';')*
     * ```
     */
    dealingWithSemicolons = tiny11.object.extend({

        // Match a semicolon
        semi: function () {
            this.matchString(';');
        },

        // Recognize and translate a statement block
        block: function () {
            while (this.token !== 'e' && this.token !== 'l') {
                switch (this.token) {
                case 'i':
                    this.doIf();
                    break;
                case 'w':
                    this.doWhile();
                    break;
                case 'R':
                    this.doRead();
                    break;
                case 'W':
                    this.doWrite();
                    break;
                case 'x':   // <--
                    this.assignment();
                    break;
                }
                this.semi();    // <--
                this.scan();
            }
        },

        // Parse and translate global declarations
        topDecls: function () {
            this.scan();
            while (this.token === 'v') {
                this.alloc();
                while (this.token === ',') {
                    this.alloc();
                }
                this.semi();    // <--
                this.scan();    // <--
            }
        },

        // Main function
        main: function () {
            this.init();
            this.matchString('PROGRAM');
            this.semi();        // <--
            this.header();
            this.topDecls();
            this.matchString('BEGIN');
            this.prolog();
            this.block();
            this.matchString('END');
            this.epilog();
        }
    });


    return {
        dealingWithSemicolons: dealingWithSemicolons
    };

});
