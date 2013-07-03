/*global define*/

/**
 * Chapter 16 Unit Construction
 * =============================
 */

define(['./15-back-to-the-future'], function (backToTheFuture) {
    'use strict';

    var i = backToTheFuture.input,
        o = backToTheFuture.output,
        e = backToTheFuture.errors,
        s = backToTheFuture.scanner;

    /**
     * 16.1 Introduction
     * -----------------
     * In chapter 15, we ended up with the following units
     *
     * - Input
     * - Output
     * - Errors
     * - Scanner
     * - Parser
     * - CodeGen
     */

    /**
     * 16.2 Just like classical
     * ------------------------
     * We got here by applying several principles that writers of
     * commercial compilers seldom have the luxury of using. These are:
     *
     * - **The KISS philosophy** Never do things the hard way without a
     *   reason.
     * - **Lazy coding** Never put off until tomorrow what you can put of
     *   forever (with credits to P.J. Plauger)
     * - **Skepticism** Stubborn refusal to do something just because
     *   that’s the way it’s always been done.
     * - **Acceptance of inefficient code**
     * - **Rejection of arbitrary constraints**
     */

    /**
     * 16.3 Fleshing out the parser
     * ----------------------------
     *
     * ```
     * <signed-factor> ::= [<addop>] <factor>
     * ```
     */
    //{
    // parser
    var p3 = backToTheFuture.parser.extend({

        // Parse and translate a factor with optional sign.
        signedFactor: function () {
            var sign = i.look;

            if (s.isAddop(i.look)) {
                i.getChar();
            }
            this.factor();
            if (sign === '-') {
                c3.negate();
            }
        }
    });

    // codeGen
    var c3 = backToTheFuture.codeGen.extend({

        // Negate primary.
        negate: function () {
            o.emitLn('NEG D0');
        }
    });

    // A test program.
    var fleshingOutTheParser = {

        // Main program.
        main: function () {
            i.init();
            p3.signedFactor();
        }
    };
    //}

    /**
     * 16.4 Terms and expressions
     * --------------------------
     * ```
     * <expression>  ::= <signed-term> (<addop> <term>)*
     * <signed-term> ::= [<addop>] <term>
     * <term>        ::= <factor> (<mulop> <factor>)*
     * <factor>      ::= '(' <expression> ')' | <variable> | <constant>
     * ```
     * At this point, your "compiler" should be able to handle any legal
     * expression you can throw at it.
     * Better yet, it should reject all illegal ones!
     */
    //{
    // parser
    var p4 = p3.extend({

        // Parse and translate an expression.
        expression: function () {
            this.signedTerm();
            while (s.isAddop(i.look)) {
                switch (i.look) {
                case '+':
                    this.add();
                    break;
                case '-':
                    this.subtract();
                    break;
                }
            }
        },

        // Parse and translate a factor with optional sign.
        // Copy from `signedFactor`.
        signedTerm: function () {
            var sign = i.look;

            if (s.isAddop(i.look)) {
                i.getChar();
            }
            this.term();                            // <--
            if (sign === '-') {
                c4.negate();
            }
        },

        // Parse and translate a term.
        term: function () {
            this.factor();
            while (s.isMulop(i.look)) {
                switch (i.look) {
                case '*':
                    this.multiply();
                    break;
                case '/':
                    this.divide();
                    break;
                }
            }
        },

        // Parse and translate a factor.
        factor: function () {
            if (i.look === '(') {
                s.match('(');
                this.expression();
                s.match(')');
            } else if (s.isDigit(i.look)) {
                c4.loadConstant(s.getNumber());
            } else if (s.isAlpha(i.look)) {
                c4.loadVariable(s.getName());
            } else {
                e.error('Unrecognized character ' + i.look);
            }
        },

        // Parse and translate an addition operation.
        add: function () {
            s.match('+');
            c4.push();
            this.term();
            c4.popAdd();
        },

        // Parse and translate a subtraction operation.
        subtract: function () {
            s.match('-');
            c4.push();
            this.term();
            c4.popSub();
        },

        // Parse and translate an multiplication operation.
        multiply: function () {
            s.match('*');
            c4.push();
            this.factor();
            c4.popMul();
        },

        // Parse and translate an addition operation.
        divide: function () {
            s.match('/');
            c4.push();
            this.factor();
            c4.popDiv();
        }
    });

    // codeGen
    var c4 = c3.extend({

        // Push primary to stack.
        push: function () {
            o.emitLn('MOVE D0, -(SP)');
        },

        // Add TOS to primary.
        popAdd: function () {
            o.emitLn('ADD (SP)+, D0');
        },

        // Subtract TOS from primary.
        popSub: function () {
            o.emitLn('SUB (SP)+, D0');
            this.negate();
        },

        // Multiply TOS by primary.
        popMul: function () {
            o.emitLn('MULS (SP)+, D0');
        },

        // Divide primary by TOS.
        popDiv: function () {
            o.emitLn('MOVE (SP)+, D7');
            o.emitLn('EXT.L D7');
            o.emitLn('DIVS D0, D7');
            o.emitLn('MOVE D7, D0');
        }
    });

    // A test program.
    var termsAndExpressions = {

        // Main program.
        main: function () {
            i.init();
            p4.expression();
        }
    };
    //}

    /**
     * 16.5 Assignments
     * ----------------
     * ```
     * <assignment> ::= <variable> '=' <expression>
     * ```
     */
    //{
    // parser
    var p5 = p4.extend({

        // Parse and translate an assignment statement.
        assignment: function () {
            var name = s.getName();
            s.match('=');
            this.expression();
            c5.storeVariable(name);
        }
    });

    // codeGen
    var c5 = c4.extend({

        // Store the primary register to a variable.
        storeVariable: function (name) {
            o.emitLn('LEA ' + name + '(PC), A0');
            o.emitLn('MOVE D0, (A0)');
        }
    });

    // A test program.
    var assignments = {

        // Main program.
        main: function () {
            i.init();
            p5.assignment();
        }
    };
    //}

    /**
     * 16.6 Booleans
     * -------------
     * ```
     * <expression>  ::= <signed-term> (<addop> <term>)*
     * ```
     */
    //{
    // scanner
    var s6 = s.extend({

        // Recognize an addition operator.
        isAddop: function (c) {
            return c === '+' || c === '-' ||
                   c === '|' || c === '~';                  // <--
        }
    });

    // parser
    var p6 = p5.extend({

        // Parse and translate an expression.
        expression: function () {
            this.signedTerm();
            while (s6.isAddop(i.look)) {
                switch (i.look) {
                case '+':
                    this.add();
                    break;
                case '-':
                    this.subtract();
                    break;
                case '|':                                   // <--
                    this.or();
                    break;
                case '~':                                   // <
                    this.xor();
                    break;
                }
            }
        },

        // Parse and translate a boolean or operation.
        or: function () {
            s6.match('|');
            c6.push();
            this.term();
            c6.popOr();
        },

        // Parse and translate a boolean xor operation.
        xor: function () {
            s6.match('~');
            c6.push();
            this.term();
            c6.popXor();
        }
    });

    // codeGen
    var c6 = c5.extend({

        // Or TOS with primary.
        popOr: function () {
            o.emitLn('OR (SP)+, D0');
        },

        // Exclusive-or TOS with primary.
        popXor: function () {
            o.emitLn('EOR (SP)+, D0');
        }
    });

    // A test program.
    var booleans = {

        // Main program.
        main: function () {
            i.init();
            p6.assignment();
        }
    };
    //}

    /**
     * 16.7 Boolean "AND"
     * ------------------
     * If you’re keeping score on the precedence levels, this definition
     * puts the `!` at the top of the heap. The levels become:
     *
     * 1. `!` (not)
     * 2. `-` (unary)
     * 3. `*` (multiply), `/` (divide), `&` (and)
     * 4. `+` (add), `-` (substract), `|` (or), `~` (exclusive or)
     *
     * and the BNF is
     * ```
     * <assignment>  ::= <variable> '=' <expression>
     * <expression>  ::= <signed-term> (<addop> <term>)*
     * <signed-term> ::= [<addop>] <term>
     * <term>        ::= <not-factor> (<mulop> <not-factor>)*
     * <not-factor>  ::= ['!'] <factor>
     * <factor>      ::= <variable> | <constant> | '(' <expression> ')'
     * ```
     * Try this now, with a few simple cases. In fact, try that exclusive
     * or example
     * ```
     * x=a&!b|!a&b
     * ```
     */
    //{
    // scanner
    var s7 = s6.extend({

        // Recognize a multiplication operator.
        isMulop: function (c) {
            return c === '*' || c === '/' || c === '&';     // <--
        }
    });

    // parser
    var p7 = p6.extend({

        // Parse and translate a term.
        term: function () {
            this.notFactor();                               // <--
            while (s7.isMulop(i.look)) {
                switch (i.look) {
                case '*':
                    this.multiply();
                    break;
                case '/':
                    this.divide();
                    break;
                case '&':                                   // <
                    this.and();
                    break;
                }
            }
        },

        // Parse and translate an multiplication operation.
        multiply: function () {
            s.match('*');
            c4.push();
            this.notFactor();                               // <--
            c4.popMul();
        },

        // Parse and translate an addition operation.
        divide: function () {
            s.match('/');
            c4.push();
            this.notFactor();                               // <--
            c4.popDiv();
        },

        // Parse and translate a boolean and operation.
        and: function () {
            s7.match('&');
            c7.push();
            this.notFactor();                               // <--
            c7.popAnd();
        },

        // Parse and translate a factor with optional "Not".
        notFactor: function () {
            if (i.look === '!') {
                s7.match('!');
                this.factor();
                c7.notIt();
            } else {
                this.factor();
            }
        }
    });

    // codeGen
    var c7 = c6.extend({

        // And TOS with primary.
        popAnd: function () {
            o.emitLn('AND (SP)+, D0');
        },

        // Bitwise not primary.
        notIt: function () {
            o.emitLn('EOR #-1, D0');
        }
    });

    // A test program.
    var booleanAnd = {

        // Main program.
        main: function () {
            i.init();
            p7.assignment();
        }
    };
    //}


    return {

        // 16.3
        // <signed-factor> ::= [<addop>] <factor>
        fleshingOutTheParser: fleshingOutTheParser,

        // 16.4
        // <expression>  ::= <signed-term> (<addop> <term>)*
        // <signed-term> ::= [<addop>] <term>
        // <term>        ::= <factor> (<mulop> <factor>)*
        // <factor>      ::= '(' <expression> ')' | <variable> | <constant>
        termsAndExpressions: termsAndExpressions,

        // 16.5
        // <assignment> ::= <variable> '=' <expression>
        assignments: assignments,

        // 16.6
        // <expression>  ::= <signed-term> (<addop> <term>)*
        booleans: booleans,

        // 16.7
        // <term>       ::= <not-factor> (<mulop> <not-factor>)*
        // <not-factor> ::= ['!'] <factor>
        // <factor>     ::= <variable> | <constant> | '(' <expression> ')'
        booleanAnd: booleanAnd
    };
});
