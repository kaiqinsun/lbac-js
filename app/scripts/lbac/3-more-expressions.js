/*global define*/

/**
 * Chapter 3 More Expressions
 * ==========================
 */

define(['./2-expression-parsing'], function (expressionParsing) {
    'use strict';

    /**
     * 3.1 Introduction
     * ----------------
     * In this chapter we will extend what we've done to deal with
     *
     * - variables
     * - function calls
     * - assignment statements
     * - multi-character tokens (variables/numbers)
     * - white space
     */

    /**
     * 3.2 Variables
     * --------------
     * Most expressions that we see in practice involve variables, such as
     * ```
     * b * b + 4 * a * c
     * ```
     * It probably won’t come as too much of a surprise that a variable is
     * just another kind of factor.
     *
     * **In BNF notation**
     * ```
     * <factor> ::= <number> | (<expression>) | <variable>
     * ```
     * The format for a load in 68000 is
     * ```
     * MOVE X(PC), D0
     * ```
     * where `X` is the variable name.
     */
    var variables = expressionParsing.unaryMinus.extend({

        // Parse and translate a math factor.
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.expression();
                this.match(')');
            } else if (this.isAlpha(this.look)) {   // <--
                this.emitLn('MOVE ' + this.getName() + '(PC), D0');
            } else {
                this.emitLn('MOVE #' + this.getNum() + ' ,D0');
            }
        }
    });

    /**
     * 3.3 Functions
     * -------------
     * We don’t yet have a mechanism for declaring types,
     * so let’s use the **C rule** for now. We also don’t have a mechanism
     * to deal with parameters, we can only handle empty lists,
     * so for now our function calls will have the form `x()`.
     *
     * **In BNF**
     * ```
     * <identifier> ::= <variable> | <function>
     * <factor> ::= <number> | (<expression>) | <identifier>
     * ```
     * Test this version. Does it parse all legal expressions?
     * Does it correctly flag badly formed ones?
     *
     * Before going to the next section, try the input line
     * ```
     * 1 + 2 <space> 3 + 4
     * ```
     * See how the space was treated as a terminator?
     */
    var functions = variables.extend({

        // Parse and translate an identifier.
        identifier: function () {
            var name = this.getName();
            if (this.look === '(') {    // <-- <function>
                this.match('(');
                this.match(')');
                this.emitLn('BSR ' + name);
            } else {                    // <-- <variable>
                this.emitLn('MOVE ' + name + '(PC), D0');
            }
        },

        // Parse and translate a math factor.
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.expression();
                this.match(')');
            } else if (this.isAlpha(this.look)) {
                this.identifier();  // <--
            } else {
                this.emitLn('MOVE #' + this.getNum() + ', D0');
            }
        }
    });

    /**
     * 3.4 More on error handling
     * --------------------------
     * *Assert that the expression should end with an end-of-line.*
     * Try again
     * ```
     * 1 + 2 <space> 3 + 4
     * ```
     * Verify that it does what it’s supposed to.
     */
    var moreOnErrorHandling = functions.extend({

        // Main program.
        main: function () {
            this.init();
            this.expression();
            if (this.look !== this.LF) {   // <--
                this.expected('Newline');   // <--
            }
        }
    });

    /**
     * 3.5 Assignment statements
     * --------------------------
     * Expressions *USUALLY* (but not always) appear in assignment statements.
     *
     * **In BNF**
     * ```
     * <assignment> ::= <ident> = <expression>
     * ```
     * Note again that the code below exactly parallels the BNF.
     * And notice further that the error checking was
     * painless, handled by `getName` and `match`.
     */
    var assignmentStatements = moreOnErrorHandling.extend({

        // Parse and translate an assignment statement.
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.expression();
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
        },

        // Main program.
        main: function () {
            this.init();
            this.assignment();  // <--
            if (this.look !== this.LF) {
                this.expected('Newline');
            }
        }
    });

    /**
     * 3.6 Multi-character tokens
     * --------------------------
     * We can handle the multi-character tokens that we need by
     * very slight and very local modifications to `getName`  and `getNum`.
     */
    var multiCharacterTokens = assignmentStatements.extend({

        // Recognize and alphanumeric.
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
        },

        // Get an identifier.
        getName: function () {
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            var token = '';                     // <--
            while (this.isAlNum(this.look)) {   // <--
                token += this.look.toUpperCase(); // <--
                this.getChar();
            }
            return token;                       // <--
        },

        // Get a number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var value = '';                     // <--
            while (this.isDigit(this.look)) {   // <--
                value += this.look;             // <--
                this.getChar();
            }
            return value;                       // <--
        }
    });

    /**
     * 3.7 White space
     * ----------------
     * The key to easy handling of white space is to come up with a simple
     * rule for how the parser should treat the input stream,
     * and to enforce that rule everywhere.
     *
     * Fortunately, because we’ve been careful to use `getName`, `getNum`,
     * and `match` for most of our input processing, it is only those
     * three routines (plus `Init`) that we need to modify.
     */
    var whiteSpace = multiCharacterTokens.extend({

        // Recognize white space.
        isWhite: function (c) {
            return c === ' ' || c === this.TAB;
        },

        // Skip over leading white space.
        skipWhite: function () {
            while (this.isWhite(this.look)) {
                this.getChar();
            }
        },

        // Match a specific input character.
        match: function (x) {
            if (this.look !== x) {
                this.expected('"' + x + '"');
            }

            this.getChar();
            this.skipWhite();   // <--
        },

        // Get an identifier.
        getName: function () {
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            var token = '';
            while (this.isAlNum(this.look)) {
                token += this.look.toUpperCase();
                this.getChar();
            }
            this.skipWhite();   // <--
            return token;
        },

        // Get a number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var value = '';
            while (this.isDigit(this.look)) {
                value += this.look;
                this.getChar();
            }
            this.skipWhite();   // <--
            return value;
        },

        // Initialize.
        init: function () {
            this.getChar();
            this.skipWhite();   // <--
        }
    });


    return {

        // 3.2
        // <factor> ::= <number> | (<expression>) | <variable>
        variables: variables,

        // 3.3
        // <identifier> ::= <variable> | <function>
        // <factor> ::= <number> | (<expression>) | <identifier>
        functions: functions,

        // 3.4
        // Assert that the expression should end with an end-of-line
        moreOnErrorHandling: moreOnErrorHandling,

        // 3.5
        // <assignment> ::= <ident> = <expression>
        assignmentStatements: assignmentStatements,

        // 3.6
        multiCharacterTokens: multiCharacterTokens,

        // 3.7
        whiteSpace: whiteSpace
    };
});
