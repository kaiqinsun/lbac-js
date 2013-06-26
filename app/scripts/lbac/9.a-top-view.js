/*global define*/

/**
 * Chapter 9 A Top View
 * =====================
 */

define(['./1.2-cradle', 'io'], function (cradle, io) {
    'use strict';

    /**
     * 9.1 Introduction
     * -----------------
     * Most people regard the top-down design approach as being better than
     * the bottom-up one. The incremental approach that we’ve been using in
     * all these tutorials is inherently bottom-up.
     *
     * We’ll consider languages such as C and Pascal, and see how complete
     * compilers can be built starting from the top.
     */

    /**
     * 9.2 The top level
     * -----------------
     * One of the biggest mistakes people make in a top-down design is
     * failing to start at the true top.
     *
     * **In program design language (PDL)**, this top level looks something
     * like:
     * ```
     * begin
     *     solve the problem
     * end
     * ```
     * Our problem is to compile a complete program. Any definition of the
     * language, written in BNF, begins here.
     *
     * What does the top level BNF look like? Well, that depends quite a bit
     * on the language to be translated. Let’s take a look at Pascal.
     */

    /**
     * 9.3 The structure of Pascal
     * ----------------------------
     * Most texts for Pascal include a **BNF** or **railroad-track**
     * definition of the language. Here are the first few lines of one
     * ```
     * <program> ::= <program-header> <block> '.'
     * <program-header> ::= PROGRAM <ident>
     * <block> ::= <declarations> | <statements>
     * ```
     * we’ll use our familiar single-character tokens to represent the
     * input, and start with a fresh copy of the Cradle (section 1.2).
     * We’ll use a `p` to stand for `PROGRAM`, and let's start implement
     * ```
     * <program> ::= <program-header> '.'
     * <program-header> ::= PROGRAM <ident>
     * ```
     * The procedures `prolog` and `epilog` perform whatever is required
     * to let the program interface with the operating system, so that
     * it can execute as a program.
     *
     * At this point, there is only one legal input: `px.`
     * which stands for
     * ```
     * PROGRAM X
     * .
     * ```
     * where x is any single letter, the program name.
     *
     * There is one important thing to note: *THE OUTPUT IS A WORKING,
     * COMPLETE, AND EXECUTABLE PROGRAM*
     * This is very important. The nice feature of the top-down approach
     * is that at any stage you can compile a subset of the complete
     * language and get a program that will run on the target machine.
     */
    var theStructureOfPascal = cradle.extend({

        // Parse and translate a program.
        prog: function () {
            var name;

            this.match('p');        // <-- Handles program header part.
            name = this.getName();  // <
            this.prolog(name);
            this.match('.');
            this.epilog(name);
        },

        // Write the prolog.
        prolog: function () {
            this.emitLn('WARMST EQU $A01E');    // for SK*DOS
        },

        // Write the epilog.
        epilog: function (name) {
            this.emitLn('DC WARMST');           // SK*DOS
            this.emitLn('END ' + name);
        },

        // Main program.
        main: function () {
            this.init();
            this.prog();
        }
    });

    /**
     * 9.4 Fleshing it out
     * --------------------
     * To flesh out the compiler, we only have to deal with language
     * features one by one.
     * ```
     * <program> ::= <program-header> <block> '.'
     * <program-header> ::= PROGRAM <ident>
     * <block> ::= <declarations> | <statements>
     * ```
     * where `declarations` and `statements` are null procedures.
     *
     * Try again `px.`, and does the program still run the same?
     */
    var fleshingItOut = theStructureOfPascal.extend({

        // Post a label to output (copied from ch 5.3).
        postLabel: function (label) {
            io.writeLn(label + ':');
        },

        declarations: function () {},

        statements: function () {},

        // Parse and translate a Pascal block.
        doBlock: function (name) {
            this.declarations();
            this.postLabel(name);
            this.statements();
        },

        // Parse and translate a program.
        prog: function () {
            var name;
            this.match('p');
            name = this.getName();
            this.prolog(name);
            this.doBlock(name);             // <--
            this.match('.');
            this.epilog(name);
        }
    });

    /**
     * 9.5 Declarations
     * -----------------
     * **The BNF for Pascal declarations** is
     * ```
     * <declarations> ::= ( <label list>    |
     *                      <constant list> |
     *                      <type list>     |
     *                      <variable list> |
     *                      <procedure>     |
     *                      <function>        )*
     * ```
     * As usual, let’s let a single character represent each of these
     * declaration types. The `l`, `c`, `t`, `v`, `p` and `f` stand
     * for labels, constants, types, variables, procedure and function,
     * respectively.
     *
     * **Statement part in BNF**
     * ```
     * <statements> ::= <compound statement>
     * <compound statement> ::= BEGIN <statement> (';' <statement>)* END
     * ```
     * **Procedure statements**
     * ```
     * <statement> ::= <simple statement> | <structured statement>
     * <simple statement> ::= <assignment> | <procedure call> | null
     * <structured statement> ::= <compound statement> |
     *                            <if statement>       |
     *                            <case statement>     |
     *                            <while statement>    |
     *                            <repeat statement>   |
     *                            <for statement>      |
     *                            <with statement>
     * ```
     * This is where the *top level* meets our *bottom-up approach* of
     * previous sessions.
     *
     * The simplest form of input is now `pxbe.` which stands for
     * ```
     * PROGRAM X
     * BEGIN
     * END
     * .
     * ```
     * Try it. Also try some combinations of this. Make some deliberate
     * errors and see what happens.
     */
    var declarations = fleshingItOut.extend({

        // Process label statement.
        labels: function () {
            this.match('l');
        },

        // Process const statement.
        constants: function () {
            this.match('c');
        },

        // Process type statement.
        types: function () {
            this.match('t');
        },

        // Process var statement.
        variables: function () {
            this.match('v');
        },

        // Process procedure statement.
        doProcedure: function () {
            this.match('p');
        },

        // Process function statement.
        doFunction: function () {
            this.match('f');
        },

        // Parse and translate the declaration part.
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

        // Parse and translate the statement part.
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
     * -----------------------
     * The C language is quite another matter. Texts on C rarely include
     * a BNF definition of the language. Probably that’s because the
     * language is quite hard to write BNF for.
     *
     * At the top level, everything in C is a static declaration,
     * either of data or of a function.
     * ```
     * <program> ::= ( <global declaration> )*
     * <global declaration> ::= <data declaration> |
     *                          <function>
     * ```
     * **In Small C**
     * ```
     * <global declaration> ::= '#' <preprocessor command>  |
     *                          'int' <data list>           |
     *                          'char' <data list>          |
     *                          '<ident> <function body>
     * ```
     * where functions can only have the default type int, which is
     * not declared. This makes the input easy to parse: the first token
     * is either `int`, `char`, or the `name` of a function.
     * ```
     * // Demonstrates the top-level structure for small C.
     * // Parse and translate a program.
     * prog: function () {
     *     while (this.look !== 'Z') {   // ^Z -> the end of the source
     *         switch (this.look) {
     *         case '#':
     *             this.preProc();
     *             break;
     *         case 'i':
     *             this.intDecl();
     *             break;
     *         case 'c':
     *             this.charDecl();
     *             break;
     *         default:
     *             this.doFunction();
     *         }
     *     }
     * },
     * ```
     *
     * With full C, things aren’t even this easy. The problem comes
     * about because functions can also have types.
     *
     * More specifically, the **BNF for full C** begins with
     * ```
     * <program>        ::= ( <top-level decl> )*
     * <top-level decl> ::= <function def> | <data decl>
     * <data decl>      ::= [<class>] <type> <decl-list>
     * <function def>   ::= [<class>] [<type>] <function decl>
     * ```
     * The first two parts of the `<data decl>` and `<function def>`
     * can be the same.
     * Because of the **ambiguity** in the grammar above, it’s not a
     * suitable grammar for a recursive-descent parser.
     *
     * Can we transform it into one that is suitable?
     * Yes, with a little work. Suppose we write it this way:
     * ```
     * <top-level decl> ::= [<class>] <decl>
     * <decl>           ::= <type> <typed decl> | <function decl>
     * <typed decl>     ::= <data list> | <function decl>
     * ```
     * We can build a parsing routine for the class and type definitions,
     * and have them store away their findings and go on,
     * without their ever having to **know** whether a function or a data
     * declaration is being processed.
     *
     * We use single-character representation as follows
     *
     * - **Storage classes** `a`: auto, `x`: extern, `s`: static.
     *   Default is auto.
     * - **Sign** `s`: signed, `u`: unsigned. Default is signed.
     * - **Type** `l`: long, `i`: int, `c`: char. Default for unsigned is int.
     *
     * Try some code such as `xula;ub;ucc;ld;ig(){}sch(){}`
     * which stands for
     * ```
     * extern unsigned long a;
     * unsinged b;
     * unsigned char c;
     * long d;
     * int g() {}
     * static char h() {}
     * ```
     */
    var theStructureOfC = cradle.extend({

        // For full C.
        // Main program.
        main: function () {
            this.init();
            while (this.look !== this.LF) {  // ^Z (EOF) instead in real case
                this.getClass();
                this.getType();
                this.topDecl();
            }
        },

        // Global variable.
        class: '',   // storage class: auto, extern, static, register, typedef
        sign: '',   // signed, unsigned
        type: '',    // long, int, char, ...
        classMap: { a: 'auto ', x: 'extern ', s: 'static ' },
        signMap: { s: 'signed ', u: 'unsigned ' },
        typeMap: { l: 'long ', i: 'int ', c: 'char ' },

        // Get a storage class specifier.
        // a: auto, x: extern, s: static.
        getClass: function () {
            if (this.look === 'a' || this.look === 'x' || this.look === 's') {
                this.class = this.look;
                this.getChar();
            } else {
                this.class = 'a';
            }
        },

        // Get a type specifier.
        getType: function () {
            this.type = ' ';
            if (this.look === 'u') {
                this.sign = 'u';
                this.type = 'i';
                this.getChar();
            } else {
                this.sign = 's';
            }

            if (this.look === 'i' || this.look === 'l' || this.look === 'c') {
                this.type = this.look;
                this.getChar();
            }
        },

        // Process a type-level declaration.
        topDecl: function () {
            var name = this.getName();
            if (this.look === '(') {
                this.doFunc(name);
            } else {
                this.doData(name);
            }
        },

        // Process a function definition.
        doFunc: function (name) {
            this.match('(');
            this.match(')');
            this.match('{');
            this.match('}');
            if (this.type === ' ') {
                this.type = 'i';
            }
            io.writeLn(this.classMap[this.class], this.signMap[this.sign],
                    this.typeMap[this.type], name, ' (function)');
        },

        // Process a data declaration.
        doData: function (name) {
            if (this.typ === ' ') {
                this.expected('Type declaration');
            }
            io.writeLn(this.classMap[this.class], this.signMap[this.sign],
                    this.typeMap[this.type], name, ' (data)');
            this.match(';');
        }
    });


    return {

        // 9.3
        theStructureOfPascal: theStructureOfPascal,

        // 9.4
        fleshingItOut: fleshingItOut,

        // 9.5
        declarations: declarations,

        // 9.6
        theStructureOfC: theStructureOfC
    };
});
