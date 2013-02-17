/**
 * Chapter 7.13 Merging Scanner and Parser
 * Dependencies:
 */

var LBAC = LBAC || {};

// Program kiss
LBAC.kiss = (function () {
    'use strict';

    var boundMain = LBAC.cradle.boundMain,
        enumerate = LBAC.object.enumerate,
        judiciousCopying,           // 7.13.1
        mergingScannerAndParser;    // 7.13.2


    /**
     * 7.13.1 Judicious copying
     * const: TAB, CR, LF
     * variable: look, lCount
     * function: getChar, error, abort, expected,
     *           isAlpha, isDigit, isAlNum, isAddop, isMulop, isWhite
     *           skipWhite, match, fin, getName, getNum,
     *           newLabel, postLabel, emit, emitLn
     *           identifier, expression, signedFactor, multiply, divide
     *           term1, term, firstTerm, add, subtract
     *           expression, condition
     *           doIf, assignment, block, doProgram,
     *           init, main
     */
    judiciousCopying = LBAC.object.extend({

        // Constant declarations
        TAB: '\t',
        CR: '\r',
        LF: '\n',

        // Variable declarations
        look: '',   // lookahead character
        lCount: 0,  // label counter

        // Read new character from input
        getChar: function () {
            this.look = read();
        },

        // Report an error
        error: function (str) {
            writeLn('Error: ', str, '.');
        },

        // Report error and halt
        abort: function (str) {
            this.error(str);
            halt();
        },

        // Report what was expected
        expected: function (str) {
            this.abort(str + ' Expected');
        },

        // Recognize an alpha character
        isAlpha: function (c) {
            return (/[A-Z]/i).test(c);
        },

        // Recognize a decimal digit
        isDigit: function (c) {
            return (/\d/).test(c);
        },

        // Recognize an alphanumeric character
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
        },

        // Recognize an addop
        isAddop: function (c) {
            return c === '+' || c === '-';
        },

        // Recognize a mulop
        isMulop: function (c) {
            return c === '*' || c === '/';
        },

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

        // Skip a CRLF
        fin: function () {
            if (this.look === this.CR) {
                this.getChar();
            }
            if (this.look === this.LF) {
                this.getChar();
            }
            this.skipWhite();   // <--
        },

        // Get an identifier
        getName: function () {
            var name;

            while (this.look === this.LF) {
                this.fin();
            }
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            name = this.look.toUpperCase();
            this.getChar();
            this.skipWhite();   // <--
            return name;
        },

        // Get a number
        getNum: function () {
            var num;
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            num = this.look;
            this.getChar();
            this.skipWhite();   // <--
            return num;
        },

        // Generate a unique lable
        newLabel: function () {
            var label = 'L' + this.lCount;
            this.lCount += 1;
            return label;
        },

        // Post a label to output
        postLabel: function (label) {
            writeLn(label + ':');
        },

         // Output a string with tab
        emit: function (str) {
            write(this.TAB + str);
        },

        // Output a string with tab and newline
        emitLn: function (str) {
            this.emit(str);
            writeLn();
        },

        /**
         * Improving arithmetic expressions:
         * in 2.8
         * <expression> ::= [<unary op>] <term> [<addop> <term>]*
         * <term> ::= <factor> |<mulop> <factor>|*
         * <factor> ::= <number> | (<expression>)
         *
         * in 6.6.9
         * <expression>   ::= <term> [<addop> <term>]*
         * <term>         ::= <signed factor> [<mulop> factor]*
         * <signed factor> ::= [<addop>] <factor>
         * <factor>       ::= <number> | (<b-expression>) | <identifier>
         * <identifier>   ::= <variable> | <function>
         *
         * this version (only first term allows <signed factor>)
         * <expression> ::= <first term> [<addop> <term>]*
         * <first term> ::= <signed factor> <term 1>
         * <term> ::= <factor> <term 1>
         * <term 1> ::= [<mulop> <factor>]*
         * <signed factor> ::= [<addop>] <factor>
         * <factor>       ::= <number> | (<expression>) | <identifier>
         * <identifier>   ::= <variable> | <function>
         */

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
        },

        // Parse and translate the first math factor
        signedFactor: function () {
            var signed = this.look === '-';

            if (this.isAddop(this.look)) {
                this.getChar();
                this.skipWhite();
            }

            if (signed) {
                if (this.isDigit(this.look)) {
                    this.emitLn('MOVE #-' + this.getNum() + ', D0');
                } else {
                    this.factor();
                    this.emitLn('NEG D0');
                }
            } else {
                this.factor();
            }
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
            this.emitLn('EXG  D0, D1');
            this.emitLn('DIVS D1, D0');
        },

        // Parse and translate a math term
        term1: function () {
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
        },

        // Parse and translate a math term
        term: function () {
            this.factor();    // <--
            this.term1();
        },

        // Parse and translate a math term with possible leading sing
        firstTerm: function () {
            this.signedFactor();    // <--
            this.term1();
        },

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

        // parse and translate an expression
        expression: function () {
            this.firstTerm();   // <--
            while (this.look === '+' || this.look === '-') {
                this.emitLn('MOVE D0, -(SP)');
                switch (this.look) {
                case '+':
                    this.add();
                    break;
                case '-':
                    this.subtract();
                    break;
                }
            }
        },

        /**
         * <program> ::= <block> END
         * <block> ::= [<statement>]*
         * <statement> ::= <if> | <assignment>
         * <if stmt> ::= IF <condition> <block> [ELSE <block>] ENDIF
         * <assignment> ::= <identifier> = <expression>
         */

        // Parse and translate a boolean condition
        // This version is a dummy
        condition: function () {
            this.emitLn('<condition>');
        },

        // Recognize and translate an IF constructor
        doIf: function () {
            var label_1, label_2;
            this.match('i');
            this.condition();
            label_1 = this.newLabel();
            label_2 = label_1;
            this.emitLn('BEQ ' + label_1);
            this.block();

            if (this.look === 'l') {
                this.match('l');
                label_2 = this.newLabel();
                this.emitLn('BRA ' + label_2);
                this.postLabel(label_1);
                this.block();
            }

            this.match('e');
            this.postLabel(label_2);
        },

        // Parse and translate an assignment statement
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.expression();
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
        },

        // Recognize and translate a statement block
        block: function () {
            while (this.look !== 'e' && this.look !== 'l') {
                switch (this.look) {
                case 'i':
                    this.doIf();
                    break;
                case this.LF:
                    while (this.look === this.LF) {
                        this.fin();
                    }
                    break;
                default:
                    this.assignment();
                }
            }
        },

        // Parse and translate a program
        doProgram: function () {
            this.block();
            if (this.look !== 'e') {
                this.expected('End');
            }
            this.emitLn('END');
        },

        // Initialize
        init: function () {
            this.lCount = 0;
            this.getChar();
        },

        // Main function
        main: function () {
            this.init();
            this.doProgram();
        }

    });

    mergingScannerAndParser = judiciousCopying.extend({

        // Variable declarations
        token: '',      // encoded token
        value: '',      // unencoded token

        //
        keywordCode: 'xilee',
        keywordType: enumerate(['IF', 'ELSE', 'ENDIF', 'END'], 1),

        // Get an identifier
        getName: function () {
            while (this.look === this.LF) {
                this.fin();
            }
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            this.value = '';
            while (this.isAlNum(this.look)) {
                this.value += this.look.toUpperCase();
                this.getChar();
            }
            this.skipWhite();
        },

        // Get a number
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            this.value = '';
            while (this.isDigit(this.look)) {
                this.value += this.look;
                this.getChar();
            }
            this.token = '#';
            this.skipWhite();
        },

        // Get an identifier and scan it for keywords
        scan: function () {
            this.getName();
            this.token = this.keywordCode.charAt(this.keywordType[this.value]);
        },

        // Match a specific input string
        matchString: function (str) {
            if (this.value !== str) {
                this.expected('"' + str + '"');
            }
        },

        // Parse and translate an identifier
        identifier: function () {
            this.getName();     // <--
            if (this.look === '(') {
                this.match('(');
                this.match(')');
                this.emitLn('BSR ' + this.value);   // <--
            } else {
                this.emitLn('MOVE ' + this.value + '(PC), D0');   // <--
            }
        },

        // Parse and translate the first math factor
        signedFactor: function () {
            var signed = this.look === '-';

            if (this.isAddop(this.look)) {
                this.getChar();
                this.skipWhite();
            }

            if (signed) {
                if (this.isDigit(this.look)) {
                    this.getNum();  // <--
                    this.emitLn('MOVE #-' + this.value + ', D0');   // <--
                } else {
                    this.factor();
                    this.emitLn('NEG D0');
                }
            } else {
                this.factor();
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
                this.getNum();
                this.emitLn('MOVE #' + this.value + ' ,D0');
            }
        },

        // Recognize and translate an IF constructor
        doIf: function () {
            var label_1, label_2;

            this.condition();
            label_1 = this.newLabel();
            label_2 = label_1;
            this.emitLn('BEQ ' + label_1);
            this.block();

            if (this.token === 'l') {   // <--
                label_2 = this.newLabel();
                this.emitLn('BRA ' + label_2);
                this.postLabel(label_1);
                this.block();
            }

            this.postLabel(label_2);
            this.matchString('ENDIF');  // <--
        },

        // Parse and translate an assignment statement
        assignment: function () {
            var name = this.value;  // <--
            this.match('=');
            this.expression();
            this.emitLn('LEA ' + name + '(PC), A0');    // <--
            this.emitLn('MOVE D0, (A0)');
        },

        // Recognize and translate a statement block
        block: function () {
            this.scan();    // <--
            while (this.token !== 'e' && this.token !== 'l') {  // <--
                switch (this.token) {   // <--
                case 'i':
                    this.doIf();
                    break;
                default:
                    this.assignment();
                }
                this.scan();    // <--
            }
        },

        // Parse and translate a program
        doProgram: function () {
            this.block();
            this.matchString('END');    // <--
            this.emitLn('END');
        }

    });


    // return main functions for executions
    return {

        judiciousCopying: boundMain(judiciousCopying),
        mergingScannerAndParser: boundMain(mergingScannerAndParser)

    };

}());