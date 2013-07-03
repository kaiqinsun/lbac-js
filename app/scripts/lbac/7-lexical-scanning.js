/*global define*/

/**
 * Chapter 7 Lexical Scanning
 * ===========================
 */

define(['./1.2-cradle', 'io'], function (cradle, io) {
    'use strict';

    /**
     * 7.1 Introduction
     * -----------------
     * In the previous chapter we have a compiler that would ALMOST work,
     * except that we were still limited to single-character tokens.
     * To get rid of that restriction,
     * we must deal with the concept of the *lexical scanner*.
     *
     * Why?
     */

    /**
     * 7.2 Lexical scanning
     * ----------------------
     * **Compiler**
     * ```
     *  - Text editor     -> [stream of input characters]
     * -> Lexical scanner -> [stream of input tokens]
     * -> Parser (could be in one module) -> [object code]
     * ```
     *
     * **Chomsky Hierarchy of grammars** (in 1956)
     * ```
     * Type 0: Unrestricted (e.g. English)
     * Type 1: Context-Sensitive (older, e.g. Fortran)
     * Type 2: Context-Free (modern)
     * Type 3: Regular (modern)
     * ```
     *
     * The neat part about these two types is that there are very specific ways
     * to parse them.
     * ```
     * Type 3 - Regular grammar: an abstract machine called
     *          the state machine (finite automaton)
     * Type 2 - Context-free: push-down automaton
     *          (a state machine augmented by a stack)
     * ```
     * **Regular expression** is the lower-level parts of real, practical grammars,
     * such as
     * ```
     * <identifier> ::= <letter> [<letter> | <digit>]*
     * ```
     */

    /**
     * 7.3 State machines and alternatives
     * ------------------------------------
     * - **Regular expressions** can be parsed by a state machine.
     *
     * - **State machine:** integers (current state), table of
     *   actions, input chars
     *
     * - **LEX output:** a state machine + table of actions crspd.
     *   to input grammar
     * - **YACC output:** a canned table-driven parser + table crspd.
     *   to lang syntax
     */

    /**
     * 7.4 Some experiments in scanning
     * ---------------------------------
     * Let’s begin with the two definitions most often seen in real programming
     * languages:
     * ```
     * <identifier> ::= <letter> [<letter> | <digit>]*
     * <number> ::= [<digit>]+
     * ```
     * Let’s begin (as usual) with a bare cradle.
     */
    var someExperimentsInScanning = cradle.extend({

        // Recognize an alphanumeric character.
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
        },

        // Get an identifier.
        getName: function () {
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            var name = '';
            while (this.isAlNum(this.look)) {
                name += this.look.toUpperCase();
                this.getChar();
            }
            return name;
        },

        // Get a number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var num = '';
            while (this.isDigit(this.look)) {
                num += this.look;
                this.getChar();
            }
            return num;
        },

        // Main program.
        main: function () {
            this.init();
            io.writeLn(this.getName());     // <-- for testing purposes
        }
    });

    /**
     * 7.5 White space
     * ----------------
     * Run the program, and note how the input string is, indeed, separated
     * into distinct tokens.
     */
    var whiteSpace = someExperimentsInScanning.extend({

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

        // Get an identifier.
        getName: function () {
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            var name = '';
            while (this.isAlNum(this.look)) {
                name += this.look.toUpperCase();
                this.getChar();
            }
            this.skipWhite();                       // <--
            return name;
        },

        // Get a number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var num = '';
            while (this.isDigit(this.look)) {
                num += this.look;
                this.getChar();
            }
            this.skipWhite();                       // <--
            return num;
        },

        // Lexical scanner.
        scan: function () {
            var result;

            if (this.isAlpha(this.look)) {
                result = this.getName();
            } else if (this.isDigit(this.look)) {
                result = this.getNum();
            } else {
                result = this.look;
                this.getChar();
            }
            this.skipWhite();
            return result;
        },

        // Main program.
        main: function () {
            var token;

            this.init();
            do {
                token = this.scan();                // <--
                io.writeLn(token);                  // <
            } while (token !== this.LF);            // <
        }
    });

    /**
     * 7.6 State machines
     * -------------------
     * A parse routine like `getName()` does indeed implement a state machine.
     *
     * **Syntax diagram (railroad-track diagram)**
     * ```
     *          |-----> Other---------------------------> Error
     *          |
     *  Start -------> Letter ---------------> Other -----> Finish
     *          ^                        V
     *          |                        |
     *          |<----- Letter <---------|
     *          |                        |
     *          |<----- Digit  <----------
     * ```
     * The `SkipWhite()`, `getNum()`, and `scan()` are also state machines.
     * Little machines make big machines.
     * This is an implicit approach opposed to table-driven (explicite) one.
     */

    /**
     * 7.7 Newlines
     * -------------
     * Moving right along, let’s modify our scanner to handle more than one line.
     *
     * To do this, simply modify the single executable line of `isWhite`.
     * We need to give the main program a new stop condition.
     * Let’s just use until token = `.`.
     *
     * Try a couple of lines, terminated by the period.
     */
    var newlines = whiteSpace.extend({

        // Recognize white space.
        // isWhite: function (c) {
        //     return c === ' ' || c === this.TAB ||
        //            c === this.CR || c === this.LF;      // <--
        // },

        // Skip a CRLF. (copy from sec. 6.8)
        fin: function () {
            if (this.look === this.CR) {
                this.getChar();
            }
            if (this.look === this.LF) {
                this.getChar();
            }
        },

        // Main program.
        main: function () {
            var token;

            this.init();
            do {
                while (this.look === this.LF) {         // <--
                    this.fin();                         // <
                }                                       // <
                token = this.scan();
                io.writeLn(token);
            } while (token !== '.');                    // <--
        }
    });

    /**
     * 7.8 Operators
     * --------------
     * We can handle operators very much the same way as the other tokens.
     * Try the program now.
     * Any code fragments will be neatly broken up into individual tokens.
     */
    var operators = newlines.extend({

        // Recognize any operator.
        isOp: function (c) {
            return c === '+' || c === '-' || c === '*' || c === '/' ||
                   c === '<' || c === '>' || c === ':' || c === '=';
        },

        // Get an operator.
        getOp: function () {
            if (!this.isOp(this.look)) {
                this.expected('Operator');
            }

            var op = '';
            while (this.isOp(this.look)) {
                op += this.look;
                this.getChar();
            }
            return op;
        },

        // Lexical scanner.
        scan: function () {
            var result;

            if (this.isAlpha(this.look)) {
                result = this.getName();
            } else if (this.isDigit(this.look)) {
                result = this.getNum();
            } else if (this.isOp(this.look)) {      // <--
                result = this.getOp();              // <
            } else {
                result = this.look;
                this.getChar();
            }
            this.skipWhite();
            return result;
        }
    });

    /**
     * 7.9 Lists, commas and command lines
     * ------------------------------------
     */
    var listsCommasAndCommandLines = operators.extend({

        // Skip over a comma.
        skipComma: function () {
            this.skipWhite();
            if (this.look === ',') {
                this.getChar();
                this.skipWhite();
            }
        },

        // Lexical scanner.
        // Change skipWhite() to skipComma() temporarily.
        scan: function () {
            var result;

            if (this.isAlpha(this.look)) {
                result = this.getName();
            } else if (this.isDigit(this.look)) {
                result = this.getNum();
            } else if (this.isOp(this.look)) {
                result = this.getOp();
            } else {
                result = this.look;
                this.getChar();
            }
            this.skipComma();                   // <-- change TEMPORARILY
            return result;
        }
    });

    /**
     * 7.10 Getting fancy
     * -------------------
     * One of the first things we’re going to need is a way to identify keywords.
     *
     * ### 7.10.1 ###
     * Try `if`, `else`, `endif` `end` or anything else.
     */
    var gettingFancy = listsCommasAndCommandLines.extend({

        // Definition of keywords and token types.
        // { IF: 0, ELSE: 1, ... }
        keywordType: { IF: 0, ELSE: 1, ENDIF: 2, END: 3 },

        // Main program.
        main: function () {
            var token = io.readLn().toUpperCase();  // <-- temporarily changed
            io.writeLn(this.keywordType[token]);    // <-- temp...
        }
    });

    /**
     * ### 7.10.2 Returning codes ###
     * Now that we can recognize keywords, the next thing is to arrange to
     * return codes for them.
     *
     * Try some arbitrary code finished with `end`, such as
     * ```
     * if test >= 25
     *     ans1 = 35
     * else
     *     sum += 1
     * endif
     * end
     * ```
     */
    var returningCodes = gettingFancy.extend({

        // Type declarations.
        symType: {
            ifSym: 0,
            elseSym: 1,
            endifSym: 2,
            endSym: 3,
            ident: 4,
            number: 5,
            operator: 6
        },

        // variable declarations.
        token: 0,   // current token (symType)
        value: '',  // string token of look

        // Lexical scanner.
        scan: function () {
            var k;

            while (this.look === this.LF) {
                this.fin();
            }
            this.skipWhite();

            if (this.isAlpha(this.look)) {
                this.value = this.getName();
                k = this.keywordType[this.value];
                this.token = k === undefined ? this.symType.ident : k;
            } else if (this.isDigit(this.look)) {
                this.value = this.getNum();
                this.token = this.symType.number;
            } else if (this.isOp(this.look)) {
                this.value = this.getOp();
                this.token = this.symType.operator;
            } else {
                this.value = this.look;
                this.token = this.symType.operator;
                this.getChar();
            }
            this.skipWhite();
        },

        // Main program.
        main: function () {
            this.init();
            do {
                this.scan();

                switch (this.token) {
                case this.symType.ident:
                    io.write('Ident    : ');
                    break;
                case this.symType.number:
                    io.write('Number   : ');
                    break;
                case this.symType.operator:
                    io.write('Operator : ');
                    break;
                case this.symType.ifSym:        // fall through
                case this.symType.elseSym:      // fall through
                case this.symType.endifSym:     // fall through
                case this.symType.endSym:
                    io.write('Keyword  : ');
                    break;
                }
                io.writeLn(this.value);
            } while (this.token !== this.symType.endSym);
        }
    });

    /**
     * ### 7.10.3 Cleanup with global ###
     * We can simplify things a bit by letting
     * `getName()`, `getNum()`, and `getOp()` becomes procedures,
     * and use globle variables (value and token) to eliminate the local copies.
     *
     * This program should work the same as the previous version.
     */
    var cleanupWithGlobal = returningCodes.extend({

        // Get an identifier.
        getName: function () {
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            var k;
            this.value = '';

            while (this.isAlNum(this.look)) {
                this.value += this.look.toUpperCase();
                this.getChar();
            }
            k = this.keywordType[this.value];  // copy from previous scan()
            this.token = k === undefined ? this.symType.ident : k;  // copy
        },

        // Get a number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            this.value = '';
            while (this.isDigit(this.look)) {
                this.value += this.look;
                this.getChar();
            }
            this.token = this.symType.number;   // copy from previous scan()
        },

        // Get an operator.
        getOp: function () {
            if (!this.isOp(this.look)) {
                this.expected('Operator');
            }

            this.value = '';
            while (this.isOp(this.look)) {
                this.value += this.look;
                this.getChar();
            }
            this.token = this.symType.operator; // copy from previous scan()
        },

        // Lexical scanner.
        scan: function () {
            while (this.look === this.LF) {
                this.fin();
            }
            this.skipWhite();

            if (this.isAlpha(this.look)) {
                this.getName();
            } else if (this.isDigit(this.look)) {
                this.getNum();
            } else if (this.isOp(this.look)) {
                this.getOp();
            } else {
                this.value = this.look;
                this.getChar();
            }
            this.skipWhite();
        }
    });

    /**
     * 7.11 Returning a character
     * ---------------------------
     * There is another simple type that can be returned as a code: the character.
     * A character is as good a variable for encoding the different token types.
     *
     * This program should work the same as the previous version.
     */
    var returningACharacter = cleanupWithGlobal.extend({

        // Instead of symType, use keywordCode.
        keywordCode: 'xilee',
        keywordType: { IF: 1, ELSE: 2, ENDIF: 3, END: 4 },  // <--

        // Get an identifier.
        getName: function () {
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            var index;
            this.value = '';

            while (this.isAlNum(this.look)) {
                this.value += this.look.toUpperCase();
                this.getChar();
            }
            index = this.keywordType[this.value] || 0;      // <--
            this.token = this.keywordCode.charAt(index);    // <
        },

        // Get a number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            this.value = '';
            while (this.isDigit(this.look)) {
                this.value += this.look;
                this.getChar();
            }
            this.token = '#';                               // <--
        },

        // Get an operator.
        getOp: function () {
            if (!this.isOp(this.look)) {
                this.expected('Operator');
            }

            this.value = '';
            while (this.isOp(this.look)) {
                this.value += this.look;
                this.getChar();
            }
            if (this.value.length === 1) {                  // <--
                this.token = this.value;                    // <
            } else {                                        // <
                this.token = '?';                           // <
            }
        },

        // Lexical scanner.
        scan: function () {
            while (this.look === this.LF) {
                this.fin();
            }
            this.skipWhite();

            if (this.isAlpha(this.look)) {
                this.getName();
            } else if (this.isDigit(this.look)) {
                this.getNum();
            } else if (this.isOp(this.look)) {
                this.getOp();
            } else {
                this.value = this.look;
                this.token = '?';                           // <--
                this.getChar();
            }
            this.skipWhite();
        },

        // Main program.
        main: function () {
            this.init();
            do {
                this.scan();

                switch (this.token) {
                case 'x':
                    io.write('Ident ');
                    break;
                case '#':
                    io.write('Number ');
                    break;
                case 'i':    // fall through
                case 'l':    // fall through
                case 'e':
                    io.write('Keyword ');
                    break;
                default:
                    io.write('Operator ');
                }
                io.writeLn(this.value);
            } while (this.value !== 'END');
        }
    });

    /**
     * 7.12 Distributed vs centralized scanners
     * -----------------------------------------
     * The structure for the lexical scanner here is very conventional,
     * and about 99% of all compilers use something very close to it.
     * This is not, however, the only possible structure.
     *
     * The problem with the conventional approach is that the scanner has no
     * knowledge of **context**. For example, it can’t distinguish between the
     * assignment operator `=` and the relational operator `=`......
     *
     * The alternative is to seek some way to use the contextual information that
     * comes from knowing where we are in the parser.
     * This leads us back to the notion of a distributed scanner...
     */

    // No code for 7.12

    // 7.13 Merging scanner and parser
    // --------------------------------
    // In file: 7.13-kiss.js


    return {

        // 7.4
        someExperimentsInScanning: someExperimentsInScanning,

        // 7.5
        whiteSpace: whiteSpace,

        // 7.7
        newlines: newlines,

        // 7.8
        operators: operators,

        // 7.9
        listsCommasAndCommandLines: listsCommasAndCommandLines,

        // 7.10.1
        gettingFancy: gettingFancy,

        // 7.10.2
        returningCodes: returningCodes,

        // 7.10.3
        cleanupWithGlobal: cleanupWithGlobal,

        // 7.11
        returningACharacter: returningACharacter
    };

});
