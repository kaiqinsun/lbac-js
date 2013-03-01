/**
 * Chapter 9 A Top View
 * Program kiss
 */

define(['./1.2-cradle', 'io'], function (cradle, io) {
    'use strict';

    var boundMain = cradle.boundMain,
        theStructureOfPascal,           // 9.3
        fleshingItOut,                  // 9.4
        declarations,                   // 9.5
        theStructureOfC;                // 9.6

    // 9.1 Introduction

    /**
     * 9.2 The top level
     * In program design language (PDL):
     * begin
     *     solve the problem
     * end
     */

    /**
     * 9.3 The structure of Pascal
     * In BNF:
     * <program> ::= <program-header> <block> '.'
     * <program-header> ::= PROGRAM <ident>
     * <block> ::= <declarations> | <statements>
     *
     * this section:
     * <program> ::= <program-header> '.'
     * <program-header> ::= PROGRAM <ident>
     */
    theStructureOfPascal = cradle.extend({

        // Parse and translate a program
        prog: function () {
            var name;
            this.match('p');    // Handles program header part
            name = this.getName();
            this.prolog(name);
            this.match('.');
            this.epilog(name);
        },

        // Write the prolog
        prolog: function () {
            this.emitLn('WARMST EQU $A01E');
        },

        // Write the epilog
        epilog: function (name) {
            this.emitLn('DC WARMST');
            this.emitLn('END ' + name);
        },

        // Main function
        main: function () {
            this.init();
            this.prog();
        }

    });

    /**
     * 9.4 Fleshing it out
     * In BNF:
     * <program> ::= <program-header> <block> '.'
     * <program-header> ::= PROGRAM <ident>
     * <block> ::= <declarations> | <statements>
     */
    fleshingItOut = theStructureOfPascal.extend({

        // Post a label to output (ch 5.3)
        postLabel: function (label) {
            io.writeLn(label + ':');
        },

        declarations: function () {},

        statements: function () {},

        // Parse and translate a Pascal block
        doBlock: function (name) {
            this.declarations();
            this.postLabel(name);
            this.statements();
        },

        // Parse and translate a program
        prog: function () {
            var name;
            this.match('p');
            name = this.getName();
            this.prolog(name);
            this.doBlock(name);     // <--
            this.match('.');
            this.epilog(name);
        }

    });

    /**
     * 9.5 Declarations
     * The BNF for Pascal declarations is:
     * <declarations> ::= ( <label list>    |
     *                      <constant list> |
     *                      <type list>     |
     *                      <variable list> |
     *                      <procedure>     |
     *                      <function>        )*
     *
     * Statement part in BNF:
     * <statements> ::= <compound statement>
     * <compound statement> ::= BEGIN <statement> (';' <statement>)* END
     *
     * Procedure statements:
     * <statement> ::= <simple statement> | <structured statement>
     * <simple statement> ::= <assignment> | <procedure call> | null
     * <structured statement> ::= <compound statement> |
     *                            <if statement>       |
     *                            <case statement>     |
     *                            <while statement>    |
     *                            <repeat statement>   |
     *                            <for statement>      |
     *                            <with statement>
     */
    declarations = fleshingItOut.extend({

        // Process label statement
        labels: function () {
            this.match('l');
        },

        // Process const statement
        constants: function () {
            this.match('c');
        },

        // Process type statement
        types: function () {
            this.match('t');
        },

        // Process var statement
        variables: function () {
            this.match('v');
        },

        // Process procedure statement
        doProcedure: function () {
            this.match('p');
        },

        // Process function statement
        doFunction: function () {
            this.match('f');
        },

        // Parse and translate the declaration part
        declarations: function () {
            while ((/[lctvpf]/).test(this.look)) {
                switch (this.look) {
                case 'l':
                    this.labels();
                    break;
                case 'c':
                    this.constants();
                    break;
                case 't':
                    this.types();
                    break;
                case 'v':
                    this.variables();
                    break;
                case 'p':
                    this.doProcedure();
                    break;
                case 'f':
                    this.doFunction();
                    break;
                }
            }
        },

        // Parse and translate the statement part
        statements: function () {
            this.match('b');
            while (this.look !== 'e') {
                this.getChar();
            }
            this.match('e');
        }

    });

    /**
     * 9.6 The structure of C
     * At the top level, everything in C is a static declaration,
     * either of data or of a function.
     * <program> ::= ( <global declaration> )*
     * <global declaration> ::= <data declaration> |
     *                          <function>
     *
     * In Small C:
     * <global declaration> ::= '#' <preprocessor command>  |
     *                          'int' <data list>           |
     *                          'char' <data list>          |
     *                          '<ident> <function body>
     *
     * BNF for full C:
     * <program> ::= ( <top-level decl> )*
     * <top-level decl> ::= <function def> | <data decl>
     * <data decl> ::= [<class>] <type> <decl-list>
     * <function def> ::= [<class>] [<type>] <function decl>
     *
     * ambiguous for <data decl> and <function def> above,
     * we can transform it:
     * <top-level decl> ::= [<class>] <decl>
     * <decl> ::= <type> <typed decl> | <function decl>
     * <typed decl> ::= <data list> | <function decl>
     */
    theStructureOfC = cradle.extend({

        // Demonstrates the top-level structure for small C
        // Parse and translate a program
        prog: function () {
            while (this.look !== 'Z') {    // ^Z in real
                switch (this.look) {
                case '#':
                    this.preProc();
                    break;
                case 'i':
                    this.intDecl();
                    break;
                case 'c':
                    this.charDecl();
                    break;
                default:
                    this.doFunction();
                }
            }
        },

        // For full C
        // Main program
        main: function () {
            this.init();
            while (this.look !== this.LF) {     // ^Z in real
                this.getClass();
                this.getType();
                this.topDecl();
            }
        },

        // Global variable
        clas: '',   // storage class: auto, extern, static, register, typedef
        sign: '',   // signed, unsigned
        typ: '',    // long, int, char, ...

        showClass: {
            a: 'auto ',
            x: 'extern ',
            s: 'static '
        },
        showSign: {
            s: 'signed ',
            u: 'unsigned '
        },
        showType: {
            l: 'long ',
            i: 'int ',
            c: 'char '
        },

        // Get a storage class specifier
        // a: auto, x: extern, s: static
        getClass: function () {
            if (this.look === 'a' || this.look === 'x' || this.look === 's') {
                this.clas = this.look;
                this.getChar();
            } else {
                this.clas = 'a';
            }
        },

        // Get a type specifier
        getType: function () {
            this.typ = ' ';
            if (this.look === 'u') {
                this.sign = 'u';
                this.typ = 'i';
                this.getChar();
            } else {
                this.sign = 's';
            }
            if (this.look === 'i' || this.look === 'l' || this.look === 'c') {
                this.typ = this.look;
                this.getChar();
            }
        },

        // Process a type-level declaration
        topDecl: function () {
            var name = this.getName();
            if (this.look === '(') {
                this.doFunc(name);
            } else {
                this.doData(name);
            }
        },

        // Process a function definition
        doFunc: function (name) {
            this.match('(');
            this.match(')');
            this.match('{');
            this.match('}');
            if (this.typ === ' ') {
                this.typ = 'i';
            }
            io.writeLn(this.showClass[this.clas], this.showSign[this.sign],
                    this.showType[this.typ], 'function ', name);
        },

        // Process a data declaration
        doData: function (name) {
            if (this.typ === ' ') {
                this.expected('Type declaration');
            }
            io.writeLn(this.showClass[this.clas], this.showSign[this.sign],
                    this.showType[this.typ], 'data ', name);
            this.match(';');
        }

    });

    // return main functions for executions
    return {

        theStructureOfPascal: boundMain(theStructureOfPascal),
        fleshingItOut: boundMain(fleshingItOut),
        declarations: boundMain(declarations),
        theStructureOfC: boundMain(theStructureOfC)

    };

});