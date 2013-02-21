/**
 * Chapter 7 Lexical Scanning
 */

var LBAC = LBAC || {};

LBAC.lexicalScanning = (function () {
    'use strict';

    var boundMain = LBAC.object.boundMain,
        enumerate = LBAC.object.enumerate,
        someExperimentsInScanning,          // 7.4
        whiteSpace,                         // 7.5
        newlines,                           // 7.7
        operators,                          // 7.8
        listsCommasAndCommandLines,         // 7.9
        gettingFancy,                       // 7.10.1
        returningCodes,                     // 7.10.2
        cleanupWithGlobal,                  // 7.10.3
        returningACharacter;                // 7.11

    // 7.1 Introduction

    // 7.2 Lexical scanning
    /**
     * Compiler:
     * Text editor -> [stream of input characters]
     * -> Lexical scanner -> [stream of input tokens]
     * -> Parser (could be in one module) -> [object code]
     *
     * Chomsky Hierarchy of grammars:
     * Type 0: Unrestricted (e.g. English)
     * Type 1: Context-Sensitive (older, e.g. Fortran)
     * Type 2: Context-Free (modern)
     * Type 3: Regular (modern)
     *
     * Parser for
     * Type 3 - Regular grammar: an abstract machine called
     * the state machine (finite automaton)
     * Type 2 - Context-free: push-down automaton
     * (a state machine augmented by a stack)
     *
     * Regular expression (lower-level of real, practical grammars)
     * e.g. <identifier> ::= <letter> [<letter> | <digit>]*
     *
     * Lexical scanning is lower-level parsing
     */

    // 7.3 State machines and alternatives
    /**
     * Regular expressions can be parsed by a state machine.
     * State machine: integers (current state), table of actions, input chars
     *
     * LEX output: a state machine + table of actions crspd. to input grammar
     * YACC output: a canned table-driven parser + table crspd. to lang syntax
     */

    /**
     * 7.4 Some experiments in scanning
     * <identifier> ::= <letter> [<letter> | <digit>]*
     * <number> ::= [<digit>]+
     */
    someExperimentsInScanning = LBAC.cradle.extend({

        // Recognize an alphanumeric character
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
        },

        // Get an identifier
        getName: function () {
            var name = '';
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            while (this.isAlNum(this.look)) {
                name += this.look.toUpperCase();
                this.getChar();
            }
            return name;
        },

        // Get a number
        getNum: function () {
            var num = '';
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            while (this.isDigit(this.look)) {
                num += this.look;
                this.getChar();
            }
            return num;
        },

        // Main function
        main: function () {
            this.init();
            writeLn(this.getName());
        }

    });

    /**
     * 7.5 White space
     */
    whiteSpace = someExperimentsInScanning.extend({

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

        // Get an identifier
        getName: function () {
            var name = '';
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            while (this.isAlNum(this.look)) {
                name += this.look.toUpperCase();
                this.getChar();
            }
            this.skipWhite();   // <--
            return name;
        },

        // Get a number
        getNum: function () {
            var num = '';
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            while (this.isDigit(this.look)) {
                num += this.look;
                this.getChar();
            }
            this.skipWhite();   // <--
            return num;
        },

        // Lexical scanner
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

        // Main function
        main: function () {
            var token;

            this.init();
            do {
                token = this.scan();
                writeLn(token);
            } while (token !== this.LF);
        }

    });

    /**
     * 7.6 State machines
     *
     * getName() does indeed implement a state machine.
     *
     * Syntax diagram (railroad-track diagram):
     *
     *          |-----> Other---------------------------> Error
     *          |
     *  Start -------> Letter ---------------> Other -----> Finish
     *          ^                        V
     *          |                        |
     *          |<----- Letter <---------|
     *          |                        |
     *          |<----- Digit  <----------
     *
     * SkipWhite(), getNum(), and scan() are also state machines.
     * Little machines make big machines.
     * This is an implicit approach opposed to table-driven (explicite) one.
     */

    /**
     * 7.7 newlines
     */
    newlines = whiteSpace.extend({

        // Recognize white space
        isWhite: function (c) {
            return c === ' ' || c === this.TAB ||
                   c === this.CR || c === this.LF;
        },

        // Main function
        main: function () {
            var token;

            this.init();
            do {
                token = this.scan();
                writeLn(token);
            } while (token !== '.');
        }

    });

    /**
     * 7.8 Operators
     */
    operators = newlines.extend({

        // Recognize any operator
        isOp: function (c) {
            return c === '+' || c === '-' || c === '*' || c === '/' ||
                   c === '<' || c === '>' || c === ':' || c === '=';
        },

        // Get an operator
        getOp: function () {
            var op = '';
            if (!this.isOp(this.look)) {
                this.expected('Operator');
            }
            while (this.isOp(this.look)) {
                op += this.look;
                this.getChar();
            }
            return op;
        },

        // Lexical scanner
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
            this.skipWhite();
            return result;
        }

    });

    /**
     * 7.9 Lists, commas and command lines
     */
    listsCommasAndCommandLines = operators.extend({

        // Skip over a comma
        skipComma: function () {
            this.skipWhite();
            if (this.look === ',') {
                this.getChar();
                this.skipWhite();
            }
        },

        // Lexical scanner
        // change skipWhite() to skipComma() temporarily
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
            this.skipComma();   // <--
            return result;
        }

    });

    /**
     * 7.10 Getting fancy
     * 7.10.1
     */
    gettingFancy = listsCommasAndCommandLines.extend({

        // Definition of keywords and token types
        keywordType: enumerate(['IF', 'ELSE', 'ENDIF', 'END']),

        // Main program
        // temporarily changed.
        main: function () {
            var token = readLn();
            writeLn(this.keywordType[token]);
        }

    });

    // 7.10.2 Returning codes
    returningCodes = gettingFancy.extend({

        // Type declarations
        symType: enumerate(['ifSym', 'elseSym', 'endifSym', 'endSym',
                'identifier', 'number', 'operator']),

        // variable declarations
        token: 0,   // Current token (symType)
        value: '',  // String token of look

        // Lexical scanner
        scan: function () {
            if (this.isAlpha(this.look)) {
                this.value = this.getName();
                this.token = this.keywordType[this.value];
                if (this.token === undefined) {
                    this.token = this.symType.identifier;
                }
            } else if (this.isDigit(this.look)) {
                this.value = this.getNum();
                this.token = this.symType.number;
            } else if (this.isOp(this.look)) {
                this.value = this.getOp();
                this.token = this.symType.operator;
            } else {
                this.value = this.look;
                this.getChar();
            }
            this.skipWhite();
        },

        // Main function
        main: function () {
            this.init();
            do {
                this.scan();

                switch (this.token) {
                case this.symType.identifier:
                    write('Ident ');
                    break;
                case this.symType.number:
                    write('Number ');
                    break;
                case this.symType.operator:
                    write('Operator ');
                    break;
                case this.symType.ifSym:    // fall through
                case this.symType.elseSym:  // fall through
                case this.symType.endifSym: // fall through
                case this.symType.endSym:
                    write('Keyword ');
                    break;
                }
                writeLn(this.value);
            } while (this.token !== this.symType.endSym);
        }

    });

    /**
     * 7.10.3 Cleanup with global
     * getName(), getNum(), and getOp() becomes procedures,
     * use globle variables (value and token) to eliminate the local copies.
     */
    cleanupWithGlobal = returningCodes.extend({

        // Get an identifier
        getName: function () {
            this.value = '';
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            while (this.isAlNum(this.look)) {
                this.value += this.look.toUpperCase();
                this.getChar();
            }
            this.token = this.keywordType[this.value];  // copy
            if (this.token === undefined) {    // from previous
                this.token = this.symType.identifier;   // scan()
            }
        },

        // Get a number
        getNum: function () {
            this.value = '';
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            while (this.isDigit(this.look)) {
                this.value += this.look;
                this.getChar();
            }
            this.token = this.symType.number;   // copy from previous scan()
        },

        // Get an operator
        getOp: function () {
            this.value = '';
            if (!this.isOp(this.look)) {
                this.expected('Operator');
            }
            while (this.isOp(this.look)) {
                this.value += this.look;
                this.getChar();
            }
            this.token = this.symType.operator; // copy from previous scan()
        },

        // Lexical scanner
        scan: function () {
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
     */
    returningACharacter = cleanupWithGlobal.extend({

        // Instead of symType, use keywordCode
        keywordCode: 'xilee',
        keywordType: enumerate(['IF', 'ELSE', 'ENDIF', 'END'], 1),

        // Get an identifier
        getName: function () {
            var index;
            this.value = '';

            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            while (this.isAlNum(this.look)) {
                this.value += this.look.toUpperCase();
                this.getChar();
            }
            index = this.keywordType[this.value] || 0;   // <--
            this.token = this.keywordCode.charAt(index); // <--
        },

        // Get a number
        getNum: function () {
            this.value = '';
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            while (this.isDigit(this.look)) {
                this.value += this.look;
                this.getChar();
            }
            this.token = '#';   // <--
        },

        // Get an operator
        getOp: function () {
            this.value = '';
            if (!this.isOp(this.look)) {
                this.expected('Operator');
            }
            while (this.isOp(this.look)) {
                this.value += this.look;
                this.getChar();
            }
            if (this.value.length === 1) {  // <--
                this.token = this.value;    // .
            } else {                        // .
                this.token = '?';           // .
            }
        },

        // Lexical scanner
        scan: function () {
            if (this.isAlpha(this.look)) {
                this.getName();
            } else if (this.isDigit(this.look)) {
                this.getNum();
            } else if (this.isOp(this.look)) {
                this.getOp();
            } else {
                this.value = this.look;
                this.token = '?';   // <--
                this.getChar();
            }
            this.skipWhite();
        },

        // Main function
        main: function () {
            this.init();
            do {
                this.scan();

                switch (this.token) {
                case 'x':
                    write('Ident ');
                    break;
                case '#':
                    write('Number ');
                    break;
                case 'i':    // fall through
                case 'l':  // fall through
                case 'e':
                    write('Keyword ');
                    break;
                default:
                    write('Operator ');
                }
                writeLn(this.value);
            } while (this.value !== 'END');
        }

    });

    // 7.12 Distributed vs centralized scanners

    // 7.13 Merging scanner and parser
    // see file: 7.13.kiss.js

    // return main functions for executions
    return {

        someExperimentsInScanning: boundMain(someExperimentsInScanning),
        whiteSpace: boundMain(whiteSpace),
        newlines: boundMain(newlines),
        operators: boundMain(operators),
        listsCommasAndCommandLines: boundMain(listsCommasAndCommandLines),
        gettingFancy: boundMain(gettingFancy),
        returningCodes: boundMain(returningCodes),
        cleanupWithGlobal: boundMain(cleanupWithGlobal),
        returningACharacter: boundMain(returningACharacter)

    };

}());