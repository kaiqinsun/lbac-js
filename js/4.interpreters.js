/**
 * Chapter 4 Interpreters
 */

var LBAC = LBAC || {};

LBAC.interpreters = (function () {
    'use strict';

    var boundMain = LBAC.cradle.boundMain,
        theInterpreterA,                // 4.2.1
        theInterpreterB,                // 4.2.2
        theInterpreterC,                // 4.2.3
        multiDigitsNumber,              // 4.2.4
        theInterpreterE,                // 4.2.5
        variables,                      // 4.3.1
        assignmentStatements,           // 4.3.2
        multipleStatements,             // 4.3.3
        ioRoutines;                     // 4.3.4

    /**
     * 4.2 The interpreter
     */

    /**
     * 4.2.1
     * <expression> ::= <number>
     */
    theInterpreterA = LBAC.cradle.extend({

        // Get a number
        getNum: function () {
            var num;
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            num = +this.look;
            this.getChar();
            return num;
        },

        // Parse and translate an expression
        expression: function () {
            return this.getNum();
        },

        // Main function
        main: function () {
            this.init();
            writeLn(this.expression());
        }

    });

    /**
     * 4.2.2
     * <expression> ::= <number> |<addop> <number>|*
     */
    theInterpreterB = theInterpreterA.extend({

        // Recognize an addop
        isAddop: function (c) {
            return c === '+' || c === '-';
        },

        // Parse and translate an expression
        expression: function () {
            var value;
            if (this.isAddop(this.look)) {
                value = 0;
            } else {
                value = this.getNum();
            }
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
     * 4.2.3
     * <term> ::= <number> |<mulop> <number>|*
     * <expression> ::= <term> |<addop> <term>|*
     */
    theInterpreterC = theInterpreterB.extend({

        // Parse and translate a math term
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

        // Parse and translate an expression
        expression: function () {
            var value;
            if (this.isAddop(this.look)) {
                value = 0;
            } else {
                value = this.term();    // <--
            }
            while (this.isAddop(this.look)) {
                switch (this.look) {
                case '+':
                    this.match('+');
                    value += this.term();   // <--
                    break;
                case '-':
                    this.match('-');    // <--
                    value -= this.term();
                    break;
                }
            }
            return value;
        }

    });

    /**
     * 4.2.4 Multi-digits number
     */
    multiDigitsNumber = theInterpreterC.extend({

        // Get a Number
        getNum: function () {
            var value = 0;
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            while (this.isDigit(this.look)) {    // <--
                value = 10 * value + (+this.look);  // <--
                this.getChar();
            }
            return value;
        }

    });

    /**
     * 4.2.5
     * <factor> ::= <number> | (<expression>)
     * <term> ::= <factor> |<mulop> <factor>|*
     */
    theInterpreterE = multiDigitsNumber.extend({

        // Parse and translate a math factor
        factor: function () {
            var value;
            if (this.look === '(') {
                this.match('(');
                value = this.expression();  // <--
                this.match(')');
            } else {
                value = this.getNum();  // <--
            }
            return value;
        },

        // Parse and translate a math term
        term: function () {
            var value = this.factor();  // <--
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
     */

    /**
     * 4.3.1 Variables
     * In BNF notation:
     * <factor> ::= <number> | (<expression>) | <variable>
     */
    variables = theInterpreterE.extend({

        table: {},

        // Initialize the variable Area
        initTable: function () {
            var charCodeOfA = 'A'.charCodeAt(0),
                i,
                name;

            for (i = 0; i < 26; i += 1) {
                name = String.fromCharCode(charCodeOfA + i);
                this.table[name] = 0;
            }
        },

        // Initialize
        init: function () {
            this.initTable();   // <--
            this.getChar();
        },

        // Parse and translate a math factor
        factor: function () {
            var value;
            if (this.look === '(') {
                this.match('(');
                value = this.expression();
                this.match(')');
            } else if (this.isAlpha(this.look)) {    // <--
                value = this.table[this.getName()]; // <--
            } else {
                value = this.getNum();
            }
            return value;
        }

    });

    /**
     * 4.3.2 Assignment statements
     * In BNF:
     * <identifier> = <expression>
     */
    assignmentStatements = variables.extend({

        // Parse and translate an assignment statement
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.table[name] = this.expression();
        },

        // Main function
        main: function () {
            this.init();
            this.assignment();  // <--
            writeLn(this.table.A);
        }

    });

    /**
     * 4.3.3 Multiple statements
     */
    multipleStatements = assignmentStatements.extend({

        // Recognize and skip over a newline
        newLine: function () {
            if (this.look === this.LF) {
                this.getChar();
            }
        },

        // Main function
        main: function () {
            this.init();
            do {
                this.assignment();
                this.newLine();
            } while (this.look !== '.');
        }

    });

    /**
     * 4.3.4 I/O routines
     */
    ioRoutines = multipleStatements.extend({

        // Input routine
        input: function () {
            this.match('?');
            //
        },

        // Output routine
        output: function () {
            this.match('!');
            writeLn(this.table[this.getName()]);
        },

        // Main function
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

    // return main functions for executions
    return {

        // <expression> ::= <number>
        theInterpreterA: boundMain(theInterpreterA),

        // <expression> ::= <number> |<addop> <number>|*
        theInterpreterB: boundMain(theInterpreterB),

        // <term> ::= <number> |<mulop> <number>|*
        // <expression> ::= <term> |<addop> <term>|*
        theInterpreterC: boundMain(theInterpreterC),

        // Multi-digits number
        multiDigitsNumber: boundMain(multiDigitsNumber),

        // <factor> ::= <number> | (<expression>)
        // <term> ::= <factor> |<mulop> <factor>|*
        theInterpreterE: boundMain(theInterpreterE),

        // <factor> ::= <number> | (<expression>) | <variable>
        variables: boundMain(variables),

        assignmentStatements: boundMain(assignmentStatements),

        multipleStatements: boundMain(multipleStatements),

        ioRoutines: boundMain(ioRoutines)

    };

}());