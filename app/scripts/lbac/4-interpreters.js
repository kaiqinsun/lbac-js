/*global define*/

/**
 * Chapter 4 Interpreters
 * ======================
 */

define(['./1.2-cradle', 'io'], function (cradle, io) {
    'use strict';

    /**
     * 4.1 Introduction
     * ----------------
     * The approach we’ve been taking in this whole series is called
     * "syntax-driven translation."
     *
     * - In our *compiler* so far, every action involves
     *   emitting object code, to be executed later at execution time.
     * - In an *interpreter*, every action involves
     *   something to be done immediately.
     *
     * the *layout* ... the *structure* ... of the parser doesn’t change.
     * It’s only the **actions** that change.
     */

    /**
     * 4.2 The interpreters
     * --------------------
     * We're going to start over with a bare cradle and build up
     * the translator all over again.
     */

    /**
     * ### 4.2.1 Single digits ###
     * **In BNF notation**
     * ```
     * <expression> ::= <number>
     * <number> ::= <digit>
     * ```
     * The first thing we need to do is to change function `getNum`,
     * which up till now has always returned a character (or string).
     * Now, it’s better for it to return an integer.
     */
    var singleDigits = cradle.extend({

        // Get a number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var num = +this.look;   // <-- convert string to number
            this.getChar();
            return num;
        },

        // Parse and translate an expression.
        expression: function () {
            return this.getNum();   // <--
        },

        // Main program.
        main: function () {
            this.init();
            io.writeLn(this.expression());  // <--
        }
    });

    /**
     * ### 4.2.2 Addition and subtraction ###
     * **In BNF notation**
     * ```
     * <expression> ::= <number> [<addop> <number>]*
     * ```
     */
    var additionAndSubtraction = singleDigits.extend({

        // Recognize an addop.
        isAddop: function (c) {
            return c === '+' || c === '-';
        },

        // Parse and translate an expression.
        expression: function () {
            var value = this.isAddop(this.look) ? 0 : this.getNum();

            while (this.isAddop(this.look)) {
                switch (this.look) {
                case '+':
                    this.match('+');
                    value += this.getNum();
                    break;
                case '-':
                    this.match('-');
                    value -= this.getNum();
                    break;
                }
            }
            return value;
        }
    });

    /**
     * ### 4.2.3 Multiplication and division ###
     * **In BNF notation**
     * ```
     * <expression> ::= <term> [<addop> <term>]*
     * <term> ::= <number> [<mulop> <number>]*
     * ```
     */
    var multiplicationAndDivision = additionAndSubtraction.extend({

        // Parse and translate a math term.
        term: function () {
            var value = this.getNum();

            while (this.look === '*' || this.look === '/') {
                switch (this.look) {
                case '*':
                    this.match('*');
                    value *= this.getNum();
                    break;
                case '/':
                    this.match('/');
                    value = Math.floor(value / this.getNum());
                    break;
                }
            }
            return value;
        },

        // Parse and translate an expression.
        expression: function () {
            var value = this.isAddop(this.look) ? 0 : this.term(); // <--

            while (this.isAddop(this.look)) {
                switch (this.look) {
                case '+':
                    this.match('+');
                    value += this.term();   // <--
                    break;
                case '-':
                    this.match('-');
                    value -= this.term();   // <--
                    break;
                }
            }
            return value;
        }
    });

    /**
     * ### 4.2.4 Multi-digits number ###
     * Extend `getNum` to support multi-digit number.
     */
    var multiDigitsNumber = multiplicationAndDivision.extend({

        // Get a Number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var value = 0;
            while (this.isDigit(this.look)) {       // <--
                value = 10 * value + (+this.look);  // <--
                this.getChar();
            }
            return value;
        }
    });

    /**
     * ### 4.2.5 Factor ###
     * The next step is to install function `factor`,
     * complete with parenthesized expressions.
     *
     * **In BNF notation**
     * ```
     * <factor> ::= <number> | (<expression>)
     * <term> ::= <factor> [<mulop> <factor>]*
     * ```
     * We’re rapidly closing in on a useful interpreter.
     */
    var factor = multiDigitsNumber.extend({

        // Parse and translate a math factor.
        factor: function () {
            var value;

            if (this.look === '(') {
                this.match('(');
                value = this.expression();  // <--
                this.match(')');
            } else {
                value = this.getNum();      // <--
            }
            return value;
        },

        // Parse and translate a math term.
        term: function () {
            var value = this.factor();      // <--

            while (this.look === '*' || this.look === '/') {
                switch (this.look) {
                case '*':
                    this.match('*');
                    value *= this.factor(); // <--
                    break;
                case '/':
                    this.match('/');
                    value = Math.floor(value / this.factor());  // <--
                    break;
                }
            }
            return value;
        }
    });

    /**
     * 4.3 A little philosophy
     * -----------------------
     * Where did the precedence stacks go?
     *
     * The *hierarchy levels* and the *parse trees* are there, but they’re
     * hidden within the structure of the parser, and they’re taken
     * care of by the order with which the various procedures are called.
     */

    /**
     * ### 4.3.1 Variables ###
     * The next step is to add variable names.
     * **In BNF notation**
     * ```
     * <factor> ::= <number> | (<expression>) | <variable>
     * ```
     * We need a storage mechanism for these variables.
     */
    var variables = factor.extend({

        table: {},

        // Initialize the variable Area.
        initTable: function () {
            var charCodeOfA = 'A'.charCodeAt(0),
                i,
                name;

            for (i = 0; i < 26; i += 1) {
                name = String.fromCharCode(charCodeOfA + i);
                this.table[name] = 0;
            }
        },

        // Initialize.
        init: function () {
            this.initTable();   // <--
            this.getChar();
        },

        // Parse and translate a math factor.
        factor: function () {
            var value;
            if (this.look === '(') {
                this.match('(');
                value = this.expression();
                this.match(')');
            } else if (this.isAlpha(this.look)) {    // <--
                value = this.table[this.getName()];  // <--
            } else {
                value = this.getNum();
            }
            return value;
        }
    });

    /**
     * ### 4.3.2 Assignment statements ###
     * We need to do an assignment statement so we can put something
     * INTO the variables.
     *
     * **In BNF notation**
     * ```
     * <assignment> ::= <identifier> = <expression>
     * ```
     */
    var assignmentStatements = variables.extend({

        // Parse and translate an assignment statement.
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.table[name] = this.expression();
        },

        // Main program.
        main: function () {
            this.init();
            this.assignment();  // <--
            io.writeLn('A = ' + this.table.A); // <-- for testing purposes
        }
    });

    /**
     * ### 4.3.3 Multiple statements ###
     * We’re going to want to handle multiple statements.
     * This merely means putting a loop around the call to Assignment.
     * So let’s do that now. But what should be the loop exit criterion?
     *
     * Try nultiple statements in the editor, however,
     * we have no way to read data in or write it out.
     */
    var multipleStatements = assignmentStatements.extend({

        // Recognize and skip over a newline.
        newLine: function () {
            if (this.look === this.LF) {
                this.getChar();
            }
        },

        // Main program.
        main: function () {
            this.init();
            do {                            // <--
                this.assignment();
                this.newLine();             // <--
            } while (this.look !== '.');    // <--
        }
    });

    /**
     * ### 4.3.4 I/O routines ###
     * Use `?` to stand for a read statement (not implemented here),
     * and `!` for a write.
     *
     * We have now completed a real, working interpreter.
     * Try the following code, for example, in the editor.
     * ```
     * a=10*5
     * b=20-5*2
     * c=2*a-a/b
     * !c
     * .
     * ```
     */
    var ioRoutines = multipleStatements.extend({

        // Input routine.
        input: function () {
            this.match('?');
            // Not implemented.
        },

        // Output routine.
        output: function () {
            this.match('!');
            io.writeLn(this.table[this.getName()]);
        },

        // Main program.
        main: function () {
            this.init();
            do {
                switch (this.look) {
                case '?':
                    this.input();
                    break;
                case '!':
                    this.output();
                    break;
                default:
                    this.assignment();
                }
                this.newLine();
            } while (this.look !== '.');
        }
    });


    return {

        // 4.2.1
        // <expression> ::= <number>
        singleDigits: singleDigits,

        // 4.2.2
        // <expression> ::= <number> [<addop> <number>]*
        additionAndSubtraction: additionAndSubtraction,

        // 4.2.3
        // <term> ::= <number> [<mulop> <number>]*
        // <expression> ::= <term> [<addop> <term>]*
        multiplicationAndDivision: multiplicationAndDivision,

        // 4.2.4
        // Multi-digits number
        multiDigitsNumber: multiDigitsNumber,

        // 4.2.5
        // <factor> ::= <number> | (<expression>)
        // <term> ::= <factor> [<mulop> <factor>]*
        factor: factor,

        // 4.3.1
        // <factor> ::= <number> | (<expression>) | <variable>
        variables: variables,

        // 4.3.2
        assignmentStatements: assignmentStatements,

        // 4.3.3
        multipleStatements: multipleStatements,

        // 4.3.4
        ioRoutines: ioRoutines
    };
});
