/*global define*/

/**
 * Chapter 10 Introducing "Tiny"
 * ==============================
 */

define(['./1.2-cradle', 'io'], function (cradle, io) {
    'use strict';

    /**
     * 10.1 Introduction
     * ------------------
     * We’re going to do is call TINY, a subset of KISS.
     * We’ll be doing a top-down development of BOTH the **language**
     * and its **compiler**.
     * The BNF description will grow along with the compiler.
     *
     * Why bother starting over from scratch?
     *
     * We had a working subset of KISS in chapter 7 lexical scanning.
     * Why not just extend it as needed? The answer is threefold.
     *
     * - changes like encapsulating the code generation procedures,
     *   so that we can convert to a different target machine more easily.
     * - development from the top down as outlined in the last installment.
     * - We both need the practice to get it better.
     */

    /**
     * 10.2 Getting started
     * ---------------------
     * Top-level definition for TINY (similar to Pascal):
     * ```
     * <program> ::= PROGRAM <top-level decl> <main> '.'
     * ```
     *
     * ### 10.2.1 First step ###
     * We start with the cradle again.
     * ```
     * <program> ::= PROGRAM .
     * ```
     * At this point TINY will only accept code: `p.`, a null program
     * ```
     * PROGRAM.
     * ```
     * Note that the compiler DOES generate correct code for this program.
     */
    var firstStep = cradle.extend({

        // Parse and translate a program.
        prog: function () {
            this.match('p');
            this.header();
            this.prolog();
            this.match('.');
            this.epilog();
        },

        // Write header info.
        header: function () {
            io.writeLn('WARMST', this.TAB, 'EQU $A01E');
        },

        // Write the prolog.
        prolog: function () {
            this.postLabel('MAIN');
        },

        // Post a label to output (ch 5.3).
        postLabel: function (label) {
            io.writeLn(label + ':');
        },

        // Write the epilog.
        epilog: function () {
            this.emitLn('DC WARMST');
            this.emitLn('END MAIN');
        },

        // Main program.
        main: function () {
            this.init();
            this.prog();
            if (this.look !== this.LF) {
                this.abort('Unexpected data after "."');
            }
        }
    });

    /**
     * ### 10.2.2 The main program ###
     * The next step is to process the code for the main program.
     * The Pascal BEGIN-block is chosen
     * ```
     * <program> ::= PROGRAM BEGIN END '.'
     * ```
     * and the TINY now only accept code: `pbe.`
     *
     * which stands for
     * ```
     * PROGRAM                  p
     * BEGIN                    b
     * END                      e
     * .                        .
     * ```
     * You might try some deliberate errors, like omitting the `b` or the
     * `e`, and see what happens.
     * As always, the compiler should flag all illegal inputs.
     */
    var theMainProgram = firstStep.extend({

        // Parse and translate a program.
        prog: function () {
            this.match('p');
            this.header();
            this.doMain();
            this.match('.');
        },

        // Main program.
        doMain: function () {
            this.match('b');
            this.prolog();
            this.match('e');
            this.epilog();
        }
    });

    /**
     * 10.3 Declarations
     * ------------------
     * The next step is to decide what we mean by a declaration.
     * At the top level, only global declarations are allowed, as in C.
     *
     * For now, there can only be variable declarations, identified by
     * the keyword **VAR** (abbreviated `v`):
     * ```
     * <program>          ::= PROGRAM <top-level decls> BEGIN END '.'
     * <top-level decls>  ::= (<data declaration>)*
     * <data declaration> ::= VAR <var-list>
     * ```
     *
     * Code example: `pbe.` or `pvxvybe.`
     * which, the later, stands for
     * ```
     * PROGRAM                  p
     * VAR X                    vx
     * VAR Y                    vy
     * BEGIN                    b
     * END                      e
     * .                        .
     * ```
     * Try a few cases and see what happens.
     */
    var declarations = theMainProgram.extend({

        // Process a data declaration.
        // A stub, it generates no code, and it doesn’t process a list.
        decl: function () {
            this.match('v');
            this.getChar();
        },

        // Parse and translate global declarations.
        topDecls: function () {
            while (this.look !== 'b') {
                switch (this.look) {
                case 'v':
                    this.decl();
                    break;
                default:
                    this.abort('Unrecognized Keyword "' + this.look + '"');
                }
            }
        },

        // Parse and translate a program.
        prog: function () {
            this.match('p');
            this.header();
            this.topDecls();
            this.doMain();
            this.match('.');
        }
    });

    /**
     * 10.4 Declarations and symbols
     * ------------------------------
     * A real compiler would issue assembler directives
     * to allocate storage for the variables.
     * It’s about time we actually produced some code.
     *
     * The **BNF** is the same as the previous section.
     * ```
     * <data declaration> ::= VAR <var-list>
     * <var-list> ::= <ident>
     * ```
     * Try again the code example: `pvxvyvzbe.`
     * which stands for
     * ```
     * PROGRAM                  p
     * VAR X                    vx
     * VAR Y                    vy
     * VAR Z                    yz
     * BEGIN                    b
     * END                      e
     * .                        .
     * ```
     * See how the storage is allocated? Simple, huh?
     */
    var declarationsAndSymbols = declarations.extend({

        // Parse and translate a data declaration.
        decl: function () {
            this.match('v');
            this.alloc(this.getName());
        },

        // Allocate storage for a variable.
        alloc: function (name) {
            io.writeLn(name, ':', this.TAB, 'DC 0');
        }
    });

    /**
     * ### 10.4.2 Variable list ###
     * We haven’t really parsed the correct syntax for a data declaration,
     * since it involves a variable list.
     * Our version only permits a single variable. That’s easy to fix
     * ```
     * <var-list> ::= <indent> (, <ident>)*
     * ```
     * Code example: `pvx,y,zbe.`
     * which stands for
     * ```
     * PROGRAM                  p
     * VAR X, Y, Z              vx,y,z
     * BEGIN                    b
     * END                      e
     * .                        .
     * ```
     * Try a number of VAR declarations, try a list of several
     * variables, and try combinations of the two. Does it work?
     */
    var variableList = declarationsAndSymbols.extend({

        // Parse and translate a data declaration.
        decl: function () {
            this.match('v');
            this.alloc(this.getName());
            while (this.look === ',') {         // <--
                this.getChar();
                this.alloc(this.getName());
            }
        }
    });

    /**
     * 10.5 Initializers
     * ------------------
     * The feature allows initializing data items in the declaration.
     * ```
     * <var-list> ::= <var> (, <var>)*
     * <var>      ::= <ident> [= <integer>]
     * ```
     *
     * ### 10.5.1 ###
     * Code example: `pva=1vx=5,y=3,zbe.`
     * which stands for
     * ```
     * PROGRAM                  p
     * VAR A = 1                va=1
     * VAR X = 5,               vx=5,
     *     Y = 3,               y=3,
     *     Z                    z
     * BEGIN                    b
     * END                      e
     * .                        .
     * ```
     * Try this version of TINY and verify that you can.
     * By golly, this thing is starting to look real!
     */
    var initializers = variableList.extend({

        // Allocate storage for a variable.
        alloc: function (name) {
            io.write(name, ':', this.TAB, 'DC ');
            if (this.look === '=') {
                this.match('=');
                io.writeLn(this.getNum());
            } else {
                io.writeLn('0');
            }
        }
    });

    /**
     * ### 10.5.2 Multi-digit integer ###
     * Use multi-digit version of `getNum` and
     * now we should be able to initialize variables
     * with negative and/or multi-digit values.
     *
     * Try some code for example: `pvx=15,y,z=-23be.`
     * which stands for
     * ```
     * PROGRAM                  p
     * VAR X = 15, Y, Z = -23   vx=15,y,z=-23
     * BEGIN                    b
     * END                      e
     * .                        .
     * ```
     * We should be able to initialize variables with negative and/or
     * multi-digit values.
     *
     * There’s one problem: the compiler doesn’t record a variable
     * when we declare it. So it is perfectly content to allocate storage
     * for several variables with the same name.
     *
     * Verify this with an input like `pvavavabe.`
     * Here we’ve declared the variable A three times.
     * As you can see, the compiler accept that, and generate three
     * identical labels. Not good.
     */
    var multiDigitInteger = initializers.extend({

        // Get a Number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var value = 0;
            while (this.isDigit(this.look)) {
                value = +this.look + 10 * value;
                this.getChar();
            }
            return value;
        },

        // Allocate storage for a variable.
        alloc: function (name) {
            io.write(name, ':', this.TAB, 'DC ');
            if (this.look === '=') {
                this.match('=');
                if (this.look === '-') {
                    io.write('-');
                    this.match('-');
                }
                io.writeLn(this.getNum());
            } else {
                io.writeLn('0');
            }
        }
    });

    /**
     * 10.6 The symbol table
     * ----------------------
     * The compiler will now catch duplicate declarations. Later, we can
     * also use InTable when generating references to the variables.
     *
     * Verify again this with the input `pvavavabe.`
     * The compiler will now catch duplicate declarations.
     * Later, we can also use `inTable` when generating references to
     * the variables.
     */
    var theSymbolTable = multiDigitInteger.extend({

        symbolTable: null,

        // Look for symbol in table.
        inTable: function (name) {
            return !!this.symbolTable[name];
        },

        // Allocate storage for a variable.
        alloc: function (name) {
            if (this.inTable(name)) {                          // <--
                this.abort('Duplicate Variable Name ' + name); // <
            }

            this.symbolTable[name] = 'v';                      // <--

            io.write(name, ':', this.TAB, 'DC ');
            if (this.look === '=') {
                this.match('=');
                if (this.look === '-') {
                    io.write('-');
                    this.match('-');
                }
                io.writeLn(this.getNum());
            } else {
                io.writeLn('0');
            }
        },

        // Initialize.
        init: function () {
            this.symbolTable = {};                              // <--
            this.getChar();
        }
    });

    /**
     * 10.7 Executable statements
     * ---------------------------
     * At this point, we can generate a null program that has some data
     * variables declared and possibly initialized.
     * But so far we haven’t arranged to generate the first line of
     * executable code.
     *
     * The BNF definition given earlier for the main program included
     * a statement block, which we have so far ignored
     * ```
     * <main> ::= BEGIN <block> END
     * ```
     * For now, we can just consider a block to be
     * a series of assignment statements
     * ```
     * <block> ::= (<assignment>)*
     * ```
     * ### 10.7.1 ###
     * Null assignment
     *
     * Code example `pvxbxye.`
     *
     * which stands for
     * ```
     * PROGRAM                  p
     * VAR X                    vx
     * BEGIN                    b
     *     X                    x
     *     Y                    y
     * END                      e
     * .                        .
     * ```
     * This version still won’t generate any code for the "assignment
     * statements"...
     * The next step, of course, is to flesh out the code for an
     * assignment statement.
     */
    var executableStatements = theSymbolTable.extend({

        // Parse and translate an assignment statement.
        assignment: function () {
            this.getChar();
        },

        // Parse and translate a block of statement.
        block: function () {
            while (this.look !== 'e') {
                this.assignment();
            }
        },

        // Main program.
        doMain: function () {
            this.match('b');
            this.prolog();
            this.block();           // <--
            this.match('e');
            this.epilog();
        }
    });

    /**
     * ### 10.7.2 Code generation routines ###
     * Can the CPU-dependent code be collected into one spot where it
     * would be easier to retarget to another CPU?
     *
     * The answer, of course, is yes.
     * To accomplish this, insert the following *code generation* routines
     */
    var codeGenerationRoutines = executableStatements.extend({

        // Clear the primary register.
        clear: function () {
            this.emitLn('CLR D0');
        },

        // Negate the primary register.
        negate: function () {
            this.emitLn('NEG D0');
        },

        // Load a constant value to primary register.
        loadConst: function (number) {
            this.emitLn('MOVE #' + number + ', D0');
        },

        // Load a variable to primary register.
        loadVar: function (name) {
            if (!this.inTable(name)) {
                this.undefined(name);
            }

            this.emitLn('MOVE ' + name + '(PC), D0');
        },

        // Push primary onto stack.
        push: function () {
            this.emitLn('MOVE D0, -(SP)');
        },

        // Add top of stack to primary.
        popAdd: function () {
            this.emitLn('ADD (SP)+, D0');
        },

        // Subtract primary from top of stack.
        popSub: function () {
            this.emitLn('SUB (SP)+, D0');
            this.emitLn('NEG D0');
        },

        // Multiply top of stack to primary.
        popMul: function () {
            this.emitLn('MULS (SP)+, D0');
        },

        // Divide top of stack by primary.
        popDiv: function () {
            this.emitLn('MOVE (SP)+, D1');
            this.emitLn('EXG  D0, D1');
            this.emitLn('DIVS D1, D0');
        },

        // Store primary to variable.
        store: function (name) {
            if (!this.inTable(name)) {
                this.undefined(name);
            }

            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
        },

        // Report an undefined identifier.
        undefined: function (name) {
            this.abort('Undefined Identifier ' + name);
        }
    });

    /**
     * ### 10.7.3 Assignment statement ###
     * We are ready to begin processing executable code, by replacing the
     * stub version of procedure Assignment.
     * ```
     * <assignment>   ::= <ident> = <expression>
     * <expression>   ::= <first term> (<addop> <term>)*
     * <first term>   ::= <first factor> <rest>
     * <term>         ::= <factor> <rest>
     * <rest>         ::= (<mulop> <factor>)*
     * <first factor> ::= [<addop>] <factor>
     * <factor>       ::= <var> | <number> | (<expression>)
     * ```
     * This version of the BNF is a bit different than we’ve used before.
     * It lets us handle negative constant values efficiently.
     *
     * Try, for example `pvx,y=-1bx=-22*(3-8)y=x+15e.`
     * which stands for
     * ```
     * PROGRAM                  p
     * VAR X,                   vx,
     *     Y = -1               y=-1
     * BEGIN                    b
     *     X = -22 * (3 - 8)    x=-22*(3-8)
     *     Y = X + 15           y=x+15
     * END                      e
     * .                        .
     * ```
     * We have a compiler!
     */
    var assignmentStatement = codeGenerationRoutines.extend({

        // Parse and translate a math factor.
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.expression();
                this.match(')');
            } else if (this.isAlpha(this.look)) {
                this.loadVar(this.getName());
            } else {
                this.loadConst(this.getNum());
            }
        },

        // Parse and translate a negative factor.
        negFactor: function () {
            this.match('-');
            if (this.isDigit(this.look)) {
                this.loadConst(-this.getNum());
            } else {
                this.factor();
                this.negate();
            }
        },

        // Parse and translate a leading factor.
        firstFactor: function () {
            switch (this.look) {
            case '+':
                this.match('+');
                this.factor();
                break;
            case '-':
                this.negFactor();
                break;
            default:
                this.factor();
            }
        },

        // Recognize and translate a multiply.
        multiply: function () {
            this.match('*');
            this.factor();
            this.popMul();
        },

        // Recognize and translate a divide.
        divide: function () {
            this.match('/');
            this.factor();
            this.popDiv();
        },

        // Recognize an addop.
        isMulop: function (c) {
            return c === '*' || c === '/';
        },

        // Common code used by term() and firstTerm().
        term1: function () {
            while (this.isMulop(this.look)) {
                this.push();
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

        // Parse and translate a math term.
        term: function () {
            this.factor();
            this.term1();
        },

        // Parse and translate a math term with possible leading sing.
        firstTerm: function () {
            this.firstFactor();
            this.term1();
        },

        // Recognize and translate an add.
        add: function () {
            this.match('+');
            this.term();
            this.popAdd();
        },

        // Recognize and translate a subtract.
        subtract: function () {
            this.match('-');
            this.term();
            this.popSub();
        },

        // Recognize an addop.
        isAddop: function (c) {
            return c === '+' || c === '-';
        },

        // parse and translate an expression.
        expression: function () {
            this.firstTerm();
            while (this.isAddop(this.look)) {
                this.push();
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

        // Parse and translate an assignment statement.
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.expression();
            this.store(name);
        }
    });

    /**
     * 10.8 Booleans
     * --------------
     * We must add Boolean expressions and relational operations.
     */

    /**
     * ### 10.8.1 More code generation routines ###
     * To begin, we’re going to need some more code generation routines.
     */
    var moreCodeGenerationRoutines = assignmentStatement.extend({

        // Complement the primary register.
        notIt: function () {
            this.emitLn('NOT D0');
        },

        // AND top of stack with primary.
        popAnd: function () {
            this.emitLn('AND (SP)+, D0');
        },

        // OR top of stack with primary.
        popOr: function () {
            this.emitLn('OR (SP)+, D0');
        },

        // XOR top of stack with primary.
        popXor: function () {
            this.emitLn('EOR (SP)+, D0');
        },

        // Compare top of stack with primary.
        popCompare: function () {
            this.emitLn('CMP (SP)+, D0');
        },

        // Set D0 If compare was `=`.
        setEqual: function () {
            this.emitLn('SEQ D0');
            this.emitLn('EXT D0');
        },

        // Set D0 If compare was `!=`.
        setNEqual: function () {
            this.emitLn('SNE D0');
            this.emitLn('EXT D0');
        },

        // Set D0 If compare was `>`.
        setGreater: function () {
            this.emitLn('SLT D0');
            this.emitLn('EXT D0');
        },

        // Set D0 If compare was `<`.
        setLess: function () {
            this.emitLn('SGT D0');
            this.emitLn('EXT D0');
        }
    });

    /**
     * ### 10.8.2 Boolean expressions ###
     * The **BNF for the boolean expressions** is
     * ```
     * <bool-expr>  ::= <bool-term> (<orop> <bool-term>)*
     * <bool-term>  ::= <not-factor> (<andop> <not-factor>)*
     * <not-factor> ::= ['!'] <relation>
     * <relation>   ::= <expression> [<relop> <expression>]
     * ```
     *
     * Try, for example `pvx,y,zbx=z>ye.`
     * which stands for
     * ```
     * PROGRAM                  p
     * VAR X, Y, Z              vx,y,z
     * BEGIN                    b
     *     X = Z > Y            x=z>y
     * END                      e
     * .                        .
     * ```
     * See how this assigns a Boolean value to X?
     */
    var booleanExpressions = moreCodeGenerationRoutines.extend({

        // Recognize a boolean orop.
        isOrop: function (c) {
            return c === '|' || c === '~';
        },

        // Recognize a relop.
        isRelop: function (c) {
            return c === '=' || c === '#' || c === '<' || c === '>';
        },

        // Recognize and translate a relational "equals".
        equals: function () {
            this.match('=');
            this.expression();
            this.popCompare();
            this.setEqual();
        },

        // Recognize and translate a relational "not equals".
        notEquals: function () {
            this.match('#');
            this.expression();
            this.popCompare();
            this.setNEqual();
        },

        // Recognize and translate a relational "less than".
        less: function () {
            this.match('<');
            this.expression();
            this.popCompare();
            this.setLess();
        },

        // Recognize and translate a relational "greater than".
        greater: function () {
            this.match('>');
            this.expression();
            this.popCompare();
            this.setGreater();
        },

        // Parse and translate a relation.
        relation: function () {
            this.expression();
            if (this.isRelop(this.look)) {
                this.push();
                switch (this.look) {
                case '=':
                    this.equals();
                    break;
                case '#':
                    this.notEquals();
                    break;
                case '<':
                    this.less();
                    break;
                case '>':
                    this.greater();
                    break;
                }
            }
        },

        // Parse and translate a boolean factor with leading NOT.
        notFactor: function () {
            if (this.look === '!') {
                this.match('!');
                this.relation();
                this.notIt();
            } else {
                this.relation();
            }
        },

        // Parse and translate a boolean term.
        boolTerm: function () {
            this.notFactor();
            while (this.look === '&') {
                this.push();
                this.match('&');
                this.notFactor();
                this.popAnd();
            }
        },

        // Recognize and translate a boolean OR.
        boolOr: function () {
            this.match('|');
            this.boolTerm();
            this.popOr();
        },

        // Recognize and translate an exclusive or (XOR).
        boolXor: function () {
            this.match('~');
            this.boolTerm();
            this.popXor();
        },

        // Parse and translate a boolean expression.
        boolExpression: function () {
            this.boolTerm();
            while (this.isOrop(this.look)) {
                this.push();
                switch (this.look) {
                case '|':
                    this.boolOr();
                    break;
                case '~':
                    this.boolXor();
                    break;
                }
            }
        },

        // Parse and translate a math factor.
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.boolExpression();      // <--
                this.match(')');
            } else if (this.isAlpha(this.look)) {
                this.loadVar(this.getName());
            } else {
                this.loadConst(this.getNum());
            }
        },

        // Parse and translate an assignment statement.
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.boolExpression();          // <--
            this.store(name);
        }
    });

    /**
     * 10.9 Control structures
     * ------------------------
     * We’re almost home. With Boolean expressions in place, it’s a
     * simple matter to add control structures.
     * For **TINY**, we’ll only allow two kinds of them,
     * the `IF` and the `WHILE`
     * ```
     * <block>     ::= (<statement>)*
     * <statement> ::= <if> | <while> | <assignment>
     * <if>        ::= IF <bool-expression> <block> [ELSE <block>] ENDIF
     * <while>     ::= WHILE <bool-expression> <block> ENDWHILE
     * ```
     *
     * Code example `pvc=1,sbwc<11s=s+cc=c+1ee.`
     * which stands for
     * ```
     * PROGRAM                      p
     * VAR COUNT = 1,               vc=1
     *     SUM                      s
     * BEGIN                        b
     *     WHILE COUNT < 11         wc<11
     *         SUM = SUM + COUNT    s=s+c
     *         COUNT = COUNT + 1    c=c+1
     *     ENDWHILE                 e
     * END                          e
     * .
     * ```
     * You should be able to parse the single-character versions of any
     * of the control constructs. It’s looking pretty good!
     *
     * So far, we have **TINY version 0.1**.
     */
    var controlStructures = booleanExpressions.extend({

        // Add two new code generation routines `branch` and `branchFalse`.

        // Branch uncoditional.
        branch: function (label) {
            this.emitLn('BRA ' + label);
        },

        // Branch false.
        branchFalse: function (label) {
            this.emitLn('TST D0');
            this.emitLn('BEQ ' + label);
        },

        // Generate a unique label.
        newLabel: function () {
            var label = 'L' + this.lCount;
            this.lCount += 1;
            return label;
        },

        // Recognize and translate an IF constructor.
        doIf: function () {
            var label1, label2;

            this.match('i');
            this.boolExpression();
            label1 = label2 = this.newLabel();
            this.branchFalse(label1);
            this.block();

            if (this.look === 'l') {
                this.match('l');
                label2 = this.newLabel();
                this.branch(label2);
                this.postLabel(label1);
                this.block();
            }

            this.postLabel(label2);
            this.match('e');
        },

        // Parse and translate a WHILE statement.
        doWhile: function () {
            var label1, label2;

            this.match('w');
            label1 = this.newLabel();
            label2 = this.newLabel();
            this.postLabel(label1);
            this.boolExpression();
            this.branchFalse(label2);
            this.block();
            this.match('e');
            this.branch(label1);
            this.postLabel(label2);
        },

        // Recognize and translate a statement block.
        block: function () {
            while (this.look !== 'e' && this.look !== 'l') {
                switch (this.look) {
                case 'i':                   // <--
                    this.doIf();
                    break;
                case 'w':                   // <--
                    this.doWhile();
                    break;
                default:
                    this.assignment();
                }
            }
        },

        // Initialize.
        init: function () {
            this.symbolTable = {};
            this.lCount = 0;
            this.getChar();
        }
    });

    /**
     * 10.10 Lexical scanning
     * -----------------------
     * Next we have to convert the program so that it can deal with
     * multicharacter keywords, newlines, and whitespace.
     *
     * Now we can complile the previous code
     * ```
     * program
     * var count = 1,
     *     sum
     * begin
     *     while count < 11
     *     count = count + 1
     * endwhile
     * end
     * .
     * ```
     * Did it work? We’re just about home. In fact, with a few minor
     * exceptions we’ve already got a compiler that’s usable.
     */
    var lexicalScanning = controlStructures.extend({

        // Variable declarations.
        token: '',      // encoded token
        value: '',      // unencoded token

        keywordCodeTable: {
            IF:       'i',
            ELSE:     'l',
            ENDIF:    'e',
            WHILE:    'w',
            ENDWHILE: 'e',
            VAR:      'v',
            BEGIN:    'b',
            END:      'e',
            PROGRAM:  'p'
        },

        keywordCode: function (val) {
            return this.keywordCodeTable[val] || 'x';
        },

        // Get an identifier and scan it for keywords.
        scan: function () {
            this.getName();
            this.token = this.keywordCode(this.value);
        },

        // Recognize an alphanumeric character.
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
        },

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

        // Skip over an end-of-line.
        newLine: function () {
            while (this.look === this.CR || this.look === this.LF) {
                this.getChar();
                this.skipWhite();
            }
        },

        // Match a specific input character.
        match: function (x) {
            this.newLine();                     // <--
            if (this.look !== x) {
                this.expected('"' + x + '"');
            }

            this.getChar();
            this.skipWhite();                   // <--
        },

        // Match a specific input string.
        matchString: function (str) {
            if (this.value !== str) {
                this.expected('"' + str + '"');
            }
        },

        // Get an identifier.
        getName: function () {
            this.newLine();                     // <--
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            this.value = '';
            while (this.isAlNum(this.look)) {
                this.value += this.look.toUpperCase();
                this.getChar();
            }
            this.skipWhite();                   // <--
        },

        // Get a Number.
        getNum: function () {
            var value = 0;
            this.newLine();                     // <--
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            while (this.isDigit(this.look)) {
                value = +this.look + 10 * value;
                this.getChar();
            }
            this.skipWhite();                   // <--
            return value;
        },

        // Parse and translate a math factor.
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.boolExpression();
                this.match(')');
            } else if (this.isAlpha(this.look)) {
                this.getName();
                this.loadVar(this.value);
            } else {
                this.loadConst(this.getNum());
            }
        },

        // Parse and translate a data declaration.
        decl: function () {
            this.getName();
            this.alloc(this.value);
            while (this.look === ',') {         // <--
                this.match(',');
                this.getName();
                this.alloc(this.value);
            }
        },

        // Parse and translate an assignment statement.
        assignment: function () {
            var name = this.value;
            this.match('=');
            this.boolExpression();
            this.store(name);
        },

        // Recognize and translate an IF constructor.
        doIf: function () {
            var label1, label2;

            this.boolExpression();
            label1 = label2 = this.newLabel();
            this.branchFalse(label1);
            this.block();

            if (this.token === 'l') {
                label2 = this.newLabel();
                this.branch(label2);
                this.postLabel(label1);
                this.block();
            }

            this.postLabel(label2);
            this.matchString('ENDIF');
        },

        // Parse and translate a WHILE statement.
        doWhile: function () {
            var label1 = this.newLabel(),
                label2 = this.newLabel();

            this.postLabel(label1);
            this.boolExpression();
            this.branchFalse(label2);
            this.block();
            this.matchString('ENDWHILE');
            this.branch(label1);
            this.postLabel(label2);
        },

        // Recognize and translate a statement block.
        block: function () {
            this.scan();
            while (this.token !== 'e' && this.token !== 'l') {  // <-- token
                switch (this.token) {                           // <
                case 'i':
                    this.doIf();
                    break;
                case 'w':
                    this.doWhile();
                    break;
                default:
                    this.assignment();
                }
                this.scan();
            }
        },

        // Parse and translate global declarations.
        topDecls: function () {
            this.scan();
            while (this.token !== 'b') {
                switch (this.token) {
                case 'v':
                    this.decl();
                    break;
                default:
                    this.abort('Unrecognized Keyword "' + this.value + '"');
                }
                this.scan();
            }
        },

        // Main program.
        doMain: function () {
            this.matchString('BEGIN');
            this.prolog();
            this.block();
            this.matchString('END');
            this.epilog();
        },

        // Parse and translate a program.
        prog: function () {
            this.matchString('PROGRAM');
            this.header();
            this.topDecls();
            this.doMain();
            this.match('.');
        },

        // Initialize.
        init: function () {
            this.symbolTable = {};
            this.lCount = 0;
            this.getChar();
            this.scan();
        }
    });

    /**
     * 10.11 Multi-character variable names
     * ------------------------------------
     * Skipped (Already supported).
     */

    /**
     * 10.12 More relops
     * ------------------
     * We still have one remaining single-character restriction, **relops**.
     * Some of the relops are indeed single characters,
     * but others require two, such as `<=` and `>=`.
     *
     * We extend the relop set to include
     * `<`, `<=`, `=`, `<>`, `#`, `>`, and `>=`.
     *
     * Now you can process all the relops.
     * For example
     * ```
     * program
     * var foo, bar, answer
     * begin
     * if foo >= bar + 20
     *     answer = 10 * foo
     * else
     *     answer = -12 / bar
     * endif
     * foo = foo - 1
     * end
     * .
     * ```
     *  Try it.
     */
    var moreRelops = lexicalScanning.extend({

        // TODO: double check the Scc command!

        // Set D0 if compare was `<=`.
        setLessOrEqual: function () {
            this.emitLn('SGE D0');
            this.emitLn('EXT D0');
        },

        // Set D0 if compare was `>=`.
        setGreaterOrEqual: function () {
            this.emitLn('SLE D0');
            this.emitLn('EXT D0');
        },

        // Recognize and translate a relational "less than or equal".
        lessOrEqual: function () {
            this.match('=');
            this.expression();
            this.popCompare();
            this.setLessOrEqual();
        },

        // Recognize and translate a relational "not equals".
        notEqual: function () {
            this.match('>');
            this.expression();
            this.popCompare();
            this.setNEqual();
        },

        // Recognize and translate a relational "less than".
        less: function () {
            this.match('<');
            switch (this.look) {
            case '=':   // <=  less or equal
                this.lessOrEqual();
                break;
            case '>':   // <>  not equal
                this.notEqual();
                break;
            default:    // <  less
                this.expression();
                this.popCompare();
                this.setLess();
            }
        },

        // Recognize and translate a relational "greater than".
        greater: function () {
            this.match('>');
            if (this.look === '=') {   // >=  greater or equal
                this.match('=');
                this.expression();
                this.popCompare();
                this.setGreaterOrEqual();
            } else {        // >  greater
                this.expression();
                this.popCompare();
                this.setGreater();
            }
        }
    });

    /**
     * 10.13 Input / Output
     * ---------------------
     * We now have a complete, working language, except we have no way
     * to get data in or out. We need some I/O.
     *
     * Assuming a library call `TINYLIB.LIB` exists.
     *
     * Try, for example
     * ```
     * program
     * var foo, bar
     * begin
     * read(foo, bar)
     * if foo >= bar
     *     bar = 10 * foo
     * endif
     * write(foo * 2, bar)
     * end
     * .
     * ```
     * That’s all there is to it. NOW we have a language!
     */
    var inputOutput = moreRelops.extend({

        keywordCodeTable: {
            IF:       'i',
            ELSE:     'l',
            ENDIF:    'e',
            WHILE:    'w',
            ENDWHILE: 'e',
            READ:     'R',                              // <--
            WRITE:    'W',                              // <--
            VAR:      'v',
            BEGIN:    'b',
            END:      'e',
            PROGRAM:  'p'
        },

        // Write header info.
        header: function () {
            io.writeLn('WARMST', this.TAB, 'EQU $A01E');
            this.emitLn('LIB TINYLIB');                 // <--
        },

        // Read variable to primary register.
        readVar: function () {
            this.emitLn('BSR READ');
            this.store(this.value);
        },

        // Write variable from primary register.
        writeVar: function () {
            this.emitLn('BSR WRITE');
        },

        // Process a read statement.
        doRead: function () {
            this.match('(');
            this.getName();
            this.readVar();
            while (this.look === ',') {
                this.match(',');
                this.getName();
                this.readVar();
            }
            this.match(')');
        },

        // Process a write statement.
        doWrite: function () {
            this.match('(');
            this.expression();
            this.writeVar();
            while (this.look === ',') {
                this.match(',');
                this.expression();
                this.writeVar();
            }
            this.match(')');
        },

        // Recognize and translate a statement block.
        block: function () {
            this.scan();
            while (this.token !== 'e' && this.token !== 'l') {
                switch (this.token) {
                case 'i':
                    this.doIf();
                    break;
                case 'w':
                    this.doWhile();
                    break;
                case 'R':                               // <--
                    this.doRead();
                    break;
                case 'W':                               // <--
                    this.doWrite();
                    break;
                default:
                    this.assignment();
                }
                this.scan();
            }
        }
    });
    /**
     * 10.14 Conclusion
     * -----------------
     * At this point we have **TINY Version 1.0** completely defined.
     * It has only one data type and no subroutines...,
     * but it’s a complete, usable language. Not too bad for a toy.
     */


    return {

        // 10.2.1
        // <program> ::= PROGRAM .
        firstStep: firstStep,

        // 10.2.2
        // <program> ::= PROGRAM BEGIN END '.'
        theMainProgram: theMainProgram,

        // 10.3
        // <program>          ::= PROGRAM <top-level decls> BEGIN END '.'
        // <top-level decls>  ::= (<data declaration>)*
        // <data declaration> ::= VAR <var-list>
        declarations: declarations,

        // 10.4.1
        // <data declaration> ::= VAR <var-list>
        // <var-list> ::= <ident>
        declarationsAndSymbols: declarationsAndSymbols,

        // 10.4.2
        // <var-list> ::= <indent> (, <ident>)*
        variableList: variableList,

        // 10.5.1
        // <var-list> ::= <var> (, <var>)*
        // <var>      ::= <ident> [= <integer>]
        initializers: initializers,

        // 10.5.2
        multiDigitInteger: multiDigitInteger,

        // 10.6
        theSymbolTable: theSymbolTable,

        // 10.7.1
        // <main> ::= BEGIN <block> END
        // <block> ::= (<assignment>)*
        executableStatements: executableStatements,

        // 10.7.2
        codeGenerationRoutines: codeGenerationRoutines,

        // 10.7.3
        // <assignment>   ::= <ident> = <expression>
        // <expression>   ::= <first term> (<addop> <term>)*
        // <first term>   ::= <first factor> <rest>
        // <term>         ::= <factor> <rest>
        // <rest>         ::= (<mulop> <factor>)*
        // <first factor> ::= [<addop>] <factor>
        // <factor>       ::= <var> | <number> | (<expression>)
        assignmentStatement: assignmentStatement,

        // 10.8.1
        moreCodeGenerationRoutines: moreCodeGenerationRoutines,

        // 10.8.2
        // <bool-expr>  ::= <bool-term> (<orop> <bool-term>)*
        // <bool-term>  ::= <not-factor> (<andop> <not-factor>)*
        // <not-factor> ::= ['!'] <relation>
        // <relation>   ::= <expression> [<relop> <expression>]
        booleanExpressions: booleanExpressions,

        // 10.9
        // <block>     ::= (<statement>)*
        // <statement> ::= <if> | <while> | <assignment>
        // <if>        ::= IF <bool-expression> <block> [ELSE <block>] ENDIF
        // <while>     ::= WHILE <bool-expression> <block> ENDWHILE
        controlStructures: controlStructures,

        //10.10
        lexicalScanning: lexicalScanning,

        // 10.12
        moreRelops: moreRelops,

        // 10.13
        inputOutput: inputOutput
    };
});
