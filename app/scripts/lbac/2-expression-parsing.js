/**
 * Chapter 2 Expression Parsing
 */

define(['./1.2-cradle'], function (cradle) {
    'use strict';

    var boundMain = cradle.boundMain,
        singleDigits,               // 2.2
        binaryExpressions,          // 2.3
        generalExpressions,         // 2.4
        usingTheStack,              // 2.5
        multiplcationAndDivision,   // 2.6
        parentheses,                // 2.7
        unitaryMinus;               // 2.8

    /**
     * 2.1 Getting started
     * x = 2 * y + 3 / (4 * z)
     */

    /**
     * 2.2 Single digits
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
     * 2.3 Binary expression
     * In BNF:
     * <term> +/- <term>
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
     * 2.4 General expression
     * In BNF:
     * <expression> ::= <term> |<addop> <term>|*
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
     * to deal with complexity, such as 1 + (2 - (3 + (4 - 5)))
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
     * In BNF:
     * <term> ::= <factor> |<mulop> <factor>|*
     */
    multiplcationAndDivision = usingTheStack.extend({

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
            this.emitLn('EXG  D0, D1');  // Exchange D0 and D1, or swap(D0, D1), more details: http://stackoverflow.com/questions/8882775/divide-divs-not-working-on-jack-crenshaws-lets-build-a-compiler
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
     * a mechanism to force a desired operator precedence
     * 2 * (3 + 4);
     * a mechanism for defining expressions of any degree of complexity
     * (1 + 2)/((3 + 4) + (5 - 6))
     * In BNF:
     * <factor> ::= <number> | (<expression>)
     * This is where the recursion comes in.
     */
    parentheses = multiplcationAndDivision.extend({

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
     * e.g. -1, +3 or -(3-2), etc.
     * solution: stick an imaginary leading zero in front of expressions
     * of this type, so that -3 becomes 0 - 3.
     *
     * <expression> ::= [<unary op>] <term> [<addop> <term>]*
     */
    unitaryMinus = parentheses.extend({

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

    // return main functions for executions,
    // and the final unitaryMinus object for next chapter (ch. 3),
    return {

        // <expression> ::= <number>
        singleDigits: boundMain(singleDigits),

        // <term> ::= <number>
        // <expression> ::= <term> <addop> <term>
        binaryExpressions: boundMain(binaryExpressions),

        // <expression> ::= <term> |<addop> <term>|*
        generalExpressions: boundMain(generalExpressions),

        // Use the stack instead of registers to serve for complexity
        usingTheStack: boundMain(usingTheStack),

        // <factor> ::= <number>
        // <term> ::= <factor> |<mulop> <factor>|*
        multiplcationAndDivision: boundMain(multiplcationAndDivision),

        // <factor> ::= <number> | (<expression>)
        parentheses: boundMain(parentheses),

        // <expression> ::= <unary op> <term> [<addop> <term>]*
        unitaryMinus: boundMain(unitaryMinus),

        // Export the object for the next chapter
        unitaryMinusObject: unitaryMinus

    };

    /**
     * Final results of this chapter in BNF:
     * -----
     * <expression> ::= [<unary op>] <term> [<addop> <term>]*
     * <term> ::= <factor> |<mulop> <factor>|*
     * <factor> ::= <number> | (<expression>)
     */

});