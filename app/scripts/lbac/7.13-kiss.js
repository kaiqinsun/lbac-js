/*global define*/

/**
 * Chapter 7.13 Merging Scanner and Parser
 * ---------------------------------------
 * Program kiss
 */

define(['./object', 'io'], function (object, io) {
    'use strict';

    var enumerate = object.enumerate,
        judiciousCopying,           // 7.13.1
        mergingScannerAndParser;    // 7.13.2


    /**
     * 7.13 Merging scanner and parser
     * --------------------------------
     * Now that we’ve covered all of the theory and general aspects of lexical
     * scanning that we’ll be needing. We can accomodate multi-character tokens
     * with minimal change to our previous work.
     *
     * To keep things short and simple here we allowing only one control construct
     * (the `IF`) and no Boolean expressions. That’s enough to demonstrate the
     * parsing of both keywords and expressions.
     *
     * ### 7.13.1 Judicious copying ###
     * All the elements of the program to parse this subset, using
     * **single-character** tokens, exist already in our previous programs.
     *
     * **A short list of the program KISS**
     * ```
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
     * ```
     *
     * Some improvement of the arithmetic expressions is included:
     *
     * **in 2.8** we have
     * ```
     * <expression> ::= [<unary op>] <term> [<addop> <term>]*
     * <term> ::= <factor> |<mulop> <factor>|*
     * <factor> ::= <number> | (<expression>)
     * ```
     * ** in 6.6.9** we have
     * ```
     * <expression>   ::= <term> [<addop> <term>]*
     * <term>         ::= <signed factor> [<mulop> factor]*
     * <signed factor> ::= [<addop>] <factor>
     * <factor>       ::= <number> | (<b-expression>) | <identifier>
     * <identifier>   ::= <variable> | <function>
     * ```
     * and the **improved version** here (only first term allows `<signed factor>`)
     * ```
     * <expression>      ::= <first term> [<addop> <term>]*
     * <first term>      ::= <signed factor> <term 1>
     * <term>            ::= <factor> <term 1>
     * <term 1>          ::= [<mulop> <factor>]*
     * <signed factor>   ::= [<addop>] <factor>
     * <factor>          ::= <number> | (<expression>) | <identifier>
     * <identifier>      ::= <variable> | <function>
     * ```
     *
     * The structure of program looks like
     * ```
     * <program>         ::= <block> END
     * <block>           ::= [<statement>]*
     * <statement>       ::= <if> | <assignment>
     * <if statement>    ::= IF <condition> <block> [ELSE <block>] ENDIF
     * <assignment stmt> ::= <identifier> = <expression>
     * ```
     * where `<condition>` is a dummy version here.
     *
     * Before we proceed to adding the scanner, verify that it does indeed
     * parse things correctly. For example
     * ```
     * a = 5
     * i
     *     b = a + 1
     * l
     *     b = -2 * a
     * e
     * e
     * ```
     * Don’t forget the "codes": `i` for IF, `l` for ELSE,
     * and `e` for END or ENDIF.
     */
    judiciousCopying = object.extend({

        // Constant declarations
        TAB: '\t',
        CR: '\r',
        LF: '\n',

        // Variable declarations
        look: '',   // lookahead character
        lCount: 0,  // label counter

        // Read new character from input
        getChar: function () {
            this.look = io.read();
        },

        // Report an error
        error: function (str) {
            io.writeLn('Error: ', str, '.');
        },

        // Report error and halt
        abort: function (str) {
            this.error(str);
            io.halt();
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
            if (this.look !== x) {
                this.expected('"' + x + '"');
            }

            this.getChar();
            this.skipWhite();                   // <--
        },

        // Skip a CRLF
        fin: function () {
            if (this.look === this.CR) {
                this.getChar();
            }
            if (this.look === this.LF) {
                this.getChar();
            }
            this.skipWhite();                   // <--
        },

        // Get an identifier
        getName: function () {
            while (this.look === this.LF) {     // <--
                this.fin();                     // <
            }                                   // <
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            var name = this.look.toUpperCase();
            this.getChar();
            this.skipWhite();   // <--
            return name;
        },

        // Get a number
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var num = this.look;
            this.getChar();
            this.skipWhite();                   // <--
            return num;
        },

        // Generate a unique label
        newLabel: function () {
            var label = 'L' + this.lCount;
            this.lCount += 1;
            return label;
        },

        // Post a label to output
        postLabel: function (label) {
            io.writeLn(label + ':');
        },

         // Output a string with tab
        emit: function (str) {
            io.write(this.TAB + str);
        },

        // Output a string with tab and newline
        emitLn: function (str) {
            this.emit(str);
            io.writeLn();
        },

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
            this.factor();                  // <--
            this.term1();                   // <
        },

        // Parse and translate a math term with possible leading sing
        firstTerm: function () {
            this.signedFactor();            // <--
            this.term1();                   // <
        },

        // Recognize and translate an add
        add: function () {
            this.match('+');
            this.term();
            this.emitLn('ADD (SP)+, D0');
        },

        // Recognize and translate a subtract
        subtract: function () {
            this.match('-');
            this.term();
            this.emitLn('SUB (SP)+, D0');
            this.emitLn('NEG D0');
        },

        // parse and translate an expression
        expression: function () {
            this.firstTerm();               // <--
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

        // Parse and translate a boolean condition
        // This version is a dummy
        condition: function () {
            this.emitLn('<condition>');
        },

        // Recognize and translate an IF constructor
        doIf: function () {
            var label1, label2;

            this.match('i');
            this.condition();
            label1 = label2 = this.newLabel();
            this.emitLn('BEQ ' + label1);
            this.block();

            if (this.look === 'l') {
                this.match('l');
                label2 = this.newLabel();
                this.emitLn('BRA ' + label2);
                this.postLabel(label1);
                this.block();
            }

            this.match('e');
            this.postLabel(label2);
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

        // Main program
        main: function () {
            this.init();
            this.doProgram();
        }
    });

    /**
     * ### 7.13.2 Merging scanner and parser ###
     * Compare this program with its single-character counterpart.
     *
     * Now we have a compiler that can deal with code such as
     * ```
     * foo = 50
     * if
     *     bar = foo + 16
     * else
     *     bar = -25 * foo
     * endif
     * foo = foo + 10
     * end
     * ```
     * We are very close to having all the elements that we need to build a real,
     * functional compiler. There are still a few things missing, notably
     * procedure calls and type definitions.
     */
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
            while (this.isAlNum(this.look)) {           // <--
                this.value += this.look.toUpperCase();  // <
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
            while (this.isDigit(this.look)) {           // <--
                this.value += this.look;                // <
                this.getChar();
            }
            this.token = '#';                           // <
            this.skipWhite();
        },

        // Get an identifier and scan it for keywords
        scan: function () {
            this.getName();
            var index = this.keywordType[this.value] || 0;
            this.token = this.keywordCode.charAt(index);
        },

        // Match a specific input string
        matchString: function (str) {
            if (this.value !== str) {
                this.expected('"' + str + '"');
            }
        },

        // Parse and translate an identifier
        identifier: function () {
            this.getName();                             // <--
            if (this.look === '(') {
                this.match('(');
                this.match(')');
                this.emitLn('BSR ' + this.value);       // <--
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
                    this.getNum();                                // <--
                    this.emitLn('MOVE #-' + this.value + ', D0'); // <
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
            var label1, label2;

            this.condition();
            label1 = label2 = this.newLabel();
            this.emitLn('BEQ ' + label1);
            this.block();

            if (this.token === 'l') {                   // <--
                label2 = this.newLabel();
                this.emitLn('BRA ' + label2);
                this.postLabel(label1);
                this.block();
            }

            this.postLabel(label2);
            this.matchString('ENDIF');                  // <--
        },

        // Parse and translate an assignment statement
        assignment: function () {
            var name = this.value;                      // <--
            this.match('=');
            this.expression();
            this.emitLn('LEA ' + name + '(PC), A0');    // <--
            this.emitLn('MOVE D0, (A0)');
        },

        // Recognize and translate a statement block
        block: function () {
            this.scan();                                // <--
            while (this.token !== 'e' && this.token !== 'l') {  // <--
                switch (this.token) {                   // <--
                case 'i':
                    this.doIf();
                    break;
                default:
                    this.assignment();
                }
                this.scan();                            // <--
            }
        },

        // Parse and translate a program
        doProgram: function () {
            this.block();
            this.matchString('END');                    // <--
            this.emitLn('END');
        }
    });


    return {
        judiciousCopying: judiciousCopying,
        mergingScannerAndParser: mergingScannerAndParser
    };
});
