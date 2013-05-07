/* global define */

/**
 * Chapter 2 Expression Parsing
 * ============================
 */

define(['./1.2-cradle'], function (cradle) {
    'use strict';

    var singleDigits,               // 2.2
        binaryExpressions,          // 2.3
        generalExpressions,         // 2.4
        usingTheStack,              // 2.5
        multiplicationAndDivision,  // 2.6
        parentheses,                // 2.7
        unaryMinus;                 // 2.8

    /**
     * 2.1 Getting started
     * -------------------
     * The purpose of this chapter is for us to learn how to
     * *parse* and *translate* **mathematical expressions**.
     * An expression is the right-hand side of an equation, as in
     * ```
     * x = 2 * y + 3 / (4 * z)
     * ```
     */

    /**
     * 2.2 Single digits
     * -----------------
     * Let's start with the absolutely most simple case we can think of,
     * an expression consisting of a single digit.
     *
     * **In Backus-Naur Form (BNF)**
     * ```
     * <expression> ::= <number>
     * <number> ::= <digit>
     * ```
     */
    singleDigits = cradle.extend({

        // Parse and translate a math expression
        expression: function () {
            this.emitLn('MOVE #' + this.getNum() + ', D0');
        },

        // Main function
        main: function () {
            this.init();
            this.expression();
        }
    });

    /**
     * 2.3 Binary expressions
     * ----------------------
     * Suppose we want to handle expressions of the form:
     * `1 + 2` or `4 - 3`
     *
     * or in general,
     * **in Backus-Naur Form (BNF)**
     * ```
     * <expression> ::= <term> +/- <term>
     * <term> ::= <number>
     * ```
     */
    binaryExpressions = singleDigits.extend({

        // Parse and translate a math term
        term: function () {
            this.emitLn('MOVE #' + this.getNum() + ', D0');
        },

        // Recognize and translate an add
        add: function () {
            this.match('+');
            this.term();
            this.emitLn('ADD D1, D0');
        },

        // Recognize and translate a subtract
        subtract: function () {
            this.match('-');
            this.term();
            this.emitLn('SUB D1, D0');
            this.emitLn('NEG D0');
        },

        // Parse and translate an expression
        expression: function () {
            this.term();
            this.emitLn('MOVE D0, D1');
            switch (this.look) {
            case '+':
                this.add();
                break;
            case '-':
                this.subtract();
                break;
            default:
                this.expected('Addop');
            }
        }
    });

    /**
     * 2.4 General expressions
     * -----------------------
     * In the REAL world, an *expression* can consist of one
     * or more *terms*, separated by *addops* (`+` or `-`).
     *
     * **In BNF**
     * ```
     * <expression> ::= <term> [<addop> <term>]*
     * ```
     */
    generalExpressions = binaryExpressions.extend({

        // Parse and translate an expression
        expression: function () {
            this.term();
            while (this.look === '+' || this.look === '-') {
                this.emitLn('MOVE D0, D1');
                switch (this.look) {
                case '+':
                    this.add();
                    break;
                case '-':
                    this.subtract();
                    break;
                }
            }
        }
    });

    /**
     * 2.5 Using the stack
     * -------------------
     * To deal with complexity, such as `1 + (2 - (3 + (4 - 5)))`,
     * we're going to run out of registers fast!
     * The solution is to use the stack instead.
     *
     * For M68000 assembler langugage, a push is written as `-(SP)`,
     * and pop `(SP)+`
     */
    usingTheStack = binaryExpressions.extend({

        // Recognize and translate an add
        add: function () {
            this.match('+');
            this.term();
            this.emitLn('ADD (SP)+, D0');    // <-- pop from stack
        },

        // Recognize and translate a subtract
        subtract: function () {
            this.match('-');
            this.term();
            this.emitLn('SUB (SP)+, D0');    // <-- pop from stack
            this.emitLn('NEG D0');
        },

        // Parse and translate an expression
        expression: function () {
            this.term();
            while (this.look === '+' || this.look === '-') {
                this.emitLn('MOVE D0, -(SP)');   // <-- push to stack
                switch (this.look) {
                case '+':
                    this.add();
                    break;
                case '-':
                    this.subtract();
                    break;
                }
            }
        }
    });

    /**
     * 2.6 Multiplication and division
     * -------------------------------
     * There is an implied operator *PRECEDENCE*, or *hierarchy*,
     * associated with expressions, so that in an expression like
     * ```
     * 2 + 3 * 4
     * ```
     * we know that we’re supposed to multiply FIRST, then add.
     * (See why we needed the stack?)
     *
     * **In BNF**
     * ```
     * <term> ::= <factor> [<mulop> <factor>]*
     * <factor> ::= <number>
     * ```
     */
    multiplicationAndDivision = usingTheStack.extend({

        // Parse and translate a math factor
        // same as term() in 2.3 binary expressions
        factor: function () {
            this.emitLn('MOVE #' + this.getNum() + ', D0');
        },

        // Recognize and translate a multiply
        multiply: function () {
            this.match('*');
            this.factor();
            this.emitLn('MULS (SP)+, D0');
        },

        // Recognize and translate a divide
        divide: function () {
            this.match('/');
            this.factor();
            this.emitLn('MOVE (SP)+, D1');
            this.emitLn('EXG  D0, D1');  // exchange, swap(D0, D1)
            this.emitLn('DIVS D1, D0');
        },

        // Parse and translate a math term
        term: function () {
            this.factor();
            while (this.look === '*' || this.look === '/') {
                this.emitLn('MOVE D0, -(SP)');
                switch (this.look) {
                case '*':
                    this.multiply();
                    break;
                case '/':
                    this.divide();
                    break;
                }
            }
        }
    });

    /**
     * 2.7 Parentheses
     * ---------------
     * Parentheses are a mechanism to force a desired operator precedence.
     * ```
     * 2 * (3 + 4)
     * ```
     * They give us a mechanism for defining expressions of
     * any degree of complexity.
     * ```
     * (1 + 2) / ((3 + 4) + (5 - 6))
     * ```
     * **In BNF**
     * ```
     * <factor> ::= <number> | (<expression>)
     * ```
     * This is where the recursion comes in.
     */
    parentheses = multiplicationAndDivision.extend({

        // Parse and translate a math factor
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.expression();
                this.match(')');
            } else {
                this.emitLn('MOVE #' + this.getNum() + ' ,D0');
            }
        }
    });

    /**
     * 2.8 Unary minus
     * ---------------
     * Try e.g. `-1`, `+3` or `-(3-2)`, etc. It doesn't work, does it?
     *
     * **Solution**
     *
     * The  easiest (although not necessarily the best) way is
     * to stick an imaginary leading zero in front of expressions
     * of this type, so that `-3` becomes `0 - 3`.
     *
     * **In BNF**
     * ```
     * <expression> ::= [<unary op>] <term> [<addop> <term>]*
     * ```
     */
    unaryMinus = parentheses.extend({

        // Recognize an addop
        isAddop: function (c) {
            return c === '+' || c === '-';
        },

        // Parse and translate an expression
        expression: function () {
            if (this.isAddop(this.look)) {
                this.emitLn('CLR D0');
            } else {
                this.term();
            }
            while (this.look === '+' || this.look === '-') {
                this.emitLn('MOVE D0, -(SP)');   // <-- push to stack
                switch (this.look) {
                case '+':
                    this.add();
                    break;
                case '-':
                    this.subtract();
                    break;
                }
            }
        }
    });

    /**
     * 2.9 A word about optimization
     * -----------------------------
     */


    return {

        // <expression> ::= <number>
        singleDigits: singleDigits,

        // <term> ::= <number>
        // <expression> ::= <term> <addop> <term>
        binaryExpressions: binaryExpressions,

        // <expression> ::= <term> [<addop> <term>]*
        generalExpressions: generalExpressions,

        // Use the stack instead of registers to serve for complexity
        usingTheStack: usingTheStack,

        // <factor> ::= <number>
        // <term> ::= <factor> [<mulop> <factor>]*
        multiplicationAndDivision: multiplicationAndDivision,

        // <factor> ::= <number> | (<expression>)
        parentheses: parentheses,

        // <expression> ::= <unary op> <term> [<addop> <term>]*
        unaryMinus: unaryMinus
    };

    /**
     * Final results of this chapter in BNF
     * -------------------------------------
     * ```
     * <expression> ::= [<unary op>] <term> [<addop> <term>]*
     * <term> ::= <factor> [<mulop> <factor>]*
     * <factor> ::= <number> | (<expression>)
     * ```
     */
});
