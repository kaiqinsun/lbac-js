/**
 * Chapter 3 More Expressions
 */

var LBAC = LBAC || {};

LBAC.moreExpressions = (function () {
    'use strict';

    var boundMain = LBAC.cradle.boundMain,
        variables,              // 3.2
        functions,              // 3.3
        moreOnErrorhandling,    // 3.4
        assignmentStatements,   // 3.5
        multiCharacterTokens,   // 3.6
        whiteSpace;             // 3.7

    /**
     * 3.2 Variables
     * e.g. b * b + 4 * a * c
     * In BNF notation:
     * <factor> ::= <number> | (<expression>) | <variable>
     */
    variables = LBAC.expressionParsing.unitaryMinusObject.extend({

        // Parse and translate a math factor
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.expression();
                this.match(')');
            } else if (this.isAlpha(this.look)) {
                this.emitLn('MOVE ' + this.getName() + '(PC), D0');
            } else {
                this.emitLn('MOVE #' + this.getNum() + ' ,D0');
            }
        }

    });

    /**
     * 3.3 Functions
     * e.g. x(), C form with an empty parameter list
     * In BNF:
     * <identifier> ::= <variable> | <function>
     * <factor> ::= <number> | (<expression>) | <identifier>
     */
    functions = variables.extend({

        // Parse and translate an identifier
        identifier: function () {
            var name = this.getName();
            if (this.look === '(') {
                this.match('(');
                this.match(')');
                this.emitLn('BSR ' + name);
            } else {
                this.emitLn('MOVE ' + name + '(PC), D0');
            }
        },

        // Parse and translate a math factor
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.expression();
                this.match(')');
            } else if (this.isAlpha(this.look)) {
                this.identifier();
            } else {
                this.emitLn('MOVE #' + this.getNum() + ' ,D0');
            }
        }

    });

    /**
     * 3.4 More on error handling
     * assert that the expression should end with an end-of-line
     */
    moreOnErrorhandling = functions.extend({

        // Main function
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
     * In BNF:
     * <assignment> ::= <identifier> = <expression>
     */
    assignmentStatements = moreOnErrorhandling.extend({

        // Parse and translate an assignment statement
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.expression();
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
        },

        // Main function
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
     */
    multiCharacterTokens = assignmentStatements.extend({

        // Recognize and alphanumeric
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
        },

        // Get an identifier
        getName: function () {
            var token = ''; // <--
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            while (this.isAlNum(this.look)) { // <--
                token += this.look.toUpperCase(); // <--
                this.getChar();
            }
            return token;   // <--
        },

        // Get a number
        getNum: function () {
            var value = ''; // <--
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            while (this.isDigit(this.look)) { // <--
                value += this.look; // <--
                this.getChar();
            }
            return value;   // <--
        }

    });

    /**
     * 3.7 White space
     */
    whiteSpace = multiCharacterTokens.extend({

        // Recognize white space
        isWhite: function (c) {
            return c === ' ' || c === this.TAB;
        },

        // Skip over leading white space
        skipWhite: function () {
            while (this.isWhite(this.look)) {
                this.getChar();
            }
        },

        // Match a specific input character
        match: function (x) {
            if (this.look === x) {
                this.getChar();
                this.skipWhite();   // <--
            } else {
                this.expected('"' + x + '"');
            }
        },

        // Get an identifier
        getName: function () {
            var token = '';
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            while (this.isAlNum(this.look)) {
                token += this.look.toUpperCase();
                this.getChar();
            }
            this.skipWhite();   // <--
            return token;
        },

        // Get a number
        getNum: function () {
            var value = '';
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            while (this.isDigit(this.look)) {
                value += this.look;
                this.getChar();
            }
            this.skipWhite();   // <--
            return value;
        },

        // Initialize
        init: function () {
            this.getChar();
            this.skipWhite();   // <--
        }

    });

    // return main functions for executions
    // and the final assignmentStatementsObject object for chapter 6.
    return {

        // <factor> ::= <number> | (<expression>) | <variable>
        variables: boundMain(variables),

        // <identifier> ::= <variable> | <function>
        // <factor> ::= <number> | (<expression>) | <identifier>
        functions: boundMain(functions),

        // Assert that the expression should end with an end-of-line
        moreOnErrorhandling: boundMain(moreOnErrorhandling),

        // <identifier> = <expression>
        assignmentStatements: boundMain(assignmentStatements),

        multiCharacterTokens: boundMain(multiCharacterTokens),

        whiteSpace: boundMain(whiteSpace),

        // Export the object for chapter 6
        assignmentStatementsObject: assignmentStatements

    };

}());