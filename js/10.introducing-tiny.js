/**
 * Chapter 10 Introducing "Tiny"
 */

var LBAC = LBAC || {};

LBAC.introducingTiny = (function () {
    'use strict';

    var boundMain = LBAC.object.boundMain,
        gettingStarted,                 // 10.2.1
        theMainProgram,                 // 10.2.2
        declarations,                   // 10.3
        declarationsAndSymbols,         // 10.4.1
        variableList,                   // 10.4.2
        initializers,                   // 10.5.1
        multiDigitInteger,              // 10.5.2
        theSymbolTable,                 // 10.6
        executableStatements,           // 10.7.1
        codeGenerationRoutines,         // 10.7.2
        assignmentStatement,            // 10.7.3
        moreCodeGenerationRoutines,     // 10.8.1
        booleanExpressions,             // 10.8.2
        controlStructures,              // 10.9
        lexicalScanning,                // 10.10
        moreRelops,                     // 10.12
        inputOutput;                    // 10.13

    // 10.1 Introduction

    /**
     * 10.2 Getting started
     * Top-level definition for TINY (similar to Pascal):
     * <program> ::= PROGRAM <top-level decl> <main> '.'
     */

    /**
     * 10.2.1
     * <program> ::= PROGRAM .
     * only accepted code: p.
     */
    gettingStarted = LBAC.cradle.extend({

        // Parse and translate a program
        prog: function () {
            this.match('p');
            this.header();
            this.prolog();
            this.match('.');
            this.epilog();
        },

        // Write header info
        header: function () {
            writeLn('WARMST', this.TAB, 'EQU $A01E');
        },

        // Write the prolog
        prolog: function () {
            this.postLabel('MAIN');
        },

        // Post a label to output (ch 5.3)
        postLabel: function (label) {
            writeLn(label + ':');
        },

        // Write the epilog
        epilog: function () {
            this.emitLn('DC WARMST');
            this.emitLn('END MAIN');
        },

        // Main program
        main: function () {
            this.init();
            this.prog();
            if (this.look !== this.LF) {
                this.abort('Unexpected data after "."');
            }
        }

    });

    /**
     * 10.2.2 The main program
     * <program> ::= PROGRAM BEGIN END '.'
     * only accepted code: pbe.
     */
    theMainProgram = gettingStarted.extend({

        // Parse and translate a program
        prog: function () {
            this.match('p');
            this.header();
            this.doMain();
            this.match('.');
        },

        // Main program
        doMain: function () {
            this.match('b');
            this.prolog();
            this.match('e');
            this.epilog();
        }

    });

    /**
     * 10.3 Declarations
     * <program> ::= PROGRAM <top-level decls> BEGIN END '.'
     * <top-level decls> ::= ( <data declaration> )*
     * <data declaration> ::= VAR <var-list>
     *
     * code example: pbe. or pvabe.
     */
    declarations = theMainProgram.extend({

        // Process a data declaration
        decl: function () {
            this.match('v');
            this.getChar();
        },

        // Parse and translate global declarations
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

        // Parse and translate a program
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
     * <data declaration> ::= VAR <var-list>
     * <var-list> ::= <ident>
     * code example: pvxvyvzbe.
     */
    declarationsAndSymbols = declarations.extend({

        // Parse and translate a data declaration
        decl: function () {
            this.match('v');
            this.alloc(this.getName());
        },

        // Allocate storage for a variable
        alloc: function (name) {
            writeLn(name, ':', this.TAB, 'DC 0');
        }

    });

    /**
     * 10.4.2 Variable list
     * <var-list> ::= <indent> (, <ident>)*
     * code example: pvx,y,zbe.
     */
    variableList = declarationsAndSymbols.extend({

        // Parse and translate a data declaration
        decl: function () {
            this.match('v');
            this.alloc(this.getName());
            while (this.look === ',') {     // <--
                this.getChar();
                this.alloc(this.getName());
            }
        }

    });

    /**
     * 10.5 Initializers
     * <var-list> ::= <var> (, <var>)*
     * <var> ::= <ident> [ = <integer> ]
     */

    // 10.5.1
    // code example: pvx=5,y,z=3be.
    initializers = variableList.extend({

        // Allocate storage for a variable
        alloc: function (name) {
            write(name, ':', this.TAB, 'DC ');
            if (this.look === '=') {
                this.match('=');
                writeLn(this.getNum());
            } else {
                writeLn('0');
            }
        }

    });

    // 10.5.2 Multi-digit integer
    // code example: pvx=15,y,z=-23be.
    multiDigitInteger = initializers.extend({

        // Get a Number
        getNum: function () {
            var value = 0;
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            while (this.isDigit(this.look)) {
                value = +this.look + 10 * value;
                this.getChar();
            }
            return value;
        },

        // Allocate storage for a variable
        alloc: function (name) {
            write(name, ':', this.TAB, 'DC ');
            if (this.look === '=') {
                this.match('=');
                if (this.look === '-') {
                    write('-');
                    this.match('-');
                }
                writeLn(this.getNum());
            } else {
                writeLn('0');
            }
        }

    });

    /**
     * 10.6 The symbol table
     */
    theSymbolTable = multiDigitInteger.extend({

        symbolTable: null,

        // look for symbol in table
        inTable: function (name) {
            return !!this.symbolTable[name];
        },

        // Allocate storage for a variable
        alloc: function (name) {
            if (this.inTable(name)) {   // <-...
                this.abort('Duplicate Variable Name ' + name);
            }
            this.symbolTable[name] = 'v';   // <--

            write(name, ':', this.TAB, 'DC ');
            if (this.look === '=') {
                this.match('=');
                if (this.look === '-') {
                    write('-');
                    this.match('-');
                }
                writeLn(this.getNum());
            } else {
                writeLn('0');
            }
        },

        // Initialize
        init: function () {
            this.symbolTable = {};  // <--
            this.getChar();
        }

    });

    /**
     * 10.7 Executable statements
     * <main> ::= BEGIN <block> END
     * <block> ::= (<assignment>)*
     */

    // 10.7.1
    executableStatements = theSymbolTable.extend({

        // Parse and translate an assignment statement
        assignment: function () {
            this.getChar();
        },

        // Parse and translate a block of statement
        block: function () {
            while (this.look !== 'e') {
                this.assignment();
            }
        },

        // Main program
        doMain: function () {
            this.match('b');
            this.prolog();
            this.block();   // <--
            this.match('e');
            this.epilog();
        }

    });

    // 10.7.2 Code generation routines
    codeGenerationRoutines = executableStatements.extend({

        // Clear the primary register
        clear: function () {
            this.emitLn('CLR D0');
        },

        // Negate the primary register
        negate: function () {
            this.emitLn('NEG D0');
        },

        // Load a constant value to primary register
        loadConst: function (number) {
            this.emitLn('MOVE #' + number + ', D0');
        },

        // Load a variable to primary register
        loadVar: function (name) {
            if (!this.inTable(name)) {
                this.undefinedd(name);
            }
            this.emitLn('MOVE ' + name + '(PC), D0');
        },

        // Push primary onto stack
        push: function () {
            this.emitLn('MOVE D0, -(SP)');
        },

        // Add top of stack to primary
        popAdd: function () {
            this.emitLn('ADD (SP)+, D0');
        },

        // Subtract primary from top of stack
        popSub: function () {
            this.emitLn('SUB (SP)+, D0');
            this.emitLn('NEG D0');
        },

        // Multiply top of stack to primary
        popMul: function () {
            this.emitLn('MULS (SP)+, D0');
        },

        // Divide top of stack by primary
        popDiv: function () {
            this.emitLn('MOVE (SP)+, D1');
            this.emitLn('EXG  D0, D1');
            this.emitLn('DIVS D1, D0');
        },

        // Store primary to variable
        store: function (name) {
            if (!this.inTable(name)) {
                this.undefinedd(name);
            }
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
        },

        // Report an undefined identifier
        undefinedd: function (name) {
            this.abort('Undefined Identifier ' + name);
        }

    });

    /**
     * 10.7.3 Assignment statement
     * <assignment> ::= <ident> = <expression>
     * <expression> ::= <first term> ( <addop> <term> )*
     * <first term> ::= <first factor> <rest>
     * <term> ::= <factor> <rest>
     * <rest> ::= ( <mulop> <factor> )*
     * <first factor> ::= [ <addop> ] <factor>
     * <factor> ::= <var> | <number> | ( <expression> )
     */
    assignmentStatement = codeGenerationRoutines.extend({

        // Parse and translate a math factor
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

        // Parse and translate a negative factor
        negFactor: function () {
            this.match('-');
            if (this.isDigit(this.look)) {
                this.loadConst(-this.getNum());
            } else {
                this.factor();
                this.negate();
            }
        },

        // Parse and translate a leading factor
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

        // Recognize and translate a multiply
        multiply: function () {
            this.match('*');
            this.factor();
            this.popMul();
        },

        // Recognize and translate a divide
        divide: function () {
            this.match('/');
            this.factor();
            this.popDiv();
        },

        // Recognize an addop
        isMulop: function (c) {
            return c === '*' || c === '/';
        },

        // Common code used by term() and firstTerm()
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

        // Parse and translate a math term
        term: function () {
            this.factor();
            this.term1();
        },

        // Parse and translate a math term with possible leading sing
        firstTerm: function () {
            this.firstFactor();
            this.term1();
        },

        // Recognize and translate an add
        add: function () {
            this.match('+');
            this.term();
            this.popAdd();
        },

        // Recognize and translate a subtract
        subtract: function () {
            this.match('-');
            this.term();
            this.popSub();
        },

        // Recognize an addop
        isAddop: function (c) {
            return c === '+' || c === '-';
        },

        // parse and translate an expression
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

        // Parse and translate an assignment statement
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.expression();
            this.store(name);
        }

    });

    /**
     * 10.8 Booleans
     */

    // 10.8.1 More code generation routines
    moreCodeGenerationRoutines = assignmentStatement.extend({

        // Complement the primary register
        notIt: function () {
            this.emitLn('NOT D0');
        },

        // AND top of stack with primary
        popAnd: function () {
            this.emitLn('AND (SP)+, D0');
        },

        // OR top of stack with primary
        popOr: function () {
            this.emitLn('OR (SP)+, D0');
        },

        // XOR top of stack with primary
        popXor: function () {
            this.emitLn('EOR (SP)+, D0');
        },

        // Compare top of stack with primary
        popCompare: function () {
            this.emitLn('CMP (SP)+, D0');
        },

        // Set D0 If compare was =
        setEqual: function () {
            this.emitLn('SEQ D0');
            this.emitLn('EXT D0');
        },

        // Set D0 If compare was !=
        setNEqual: function () {
            this.emitLn('SNE D0');
            this.emitLn('EXT D0');
        },

        // Set D0 If compare was >
        setGreater: function () {
            this.emitLn('SLT D0');
            this.emitLn('EXT D0');
        },

        // Set D0 If compare was <
        setLess: function () {
            this.emitLn('SGT D0');
            this.emitLn('EXT D0');
        }

    });

    /**
     * 10.8.2 Boolean expressions
     * BNF for the boolean expressions:
     * <bool-expr> ::= <bool-term> ( <orop> <bool-term> )*
     * <bool-term> ::= <not-factor> ( <andop> <not-factor> )*
     * <not-factor> ::= [ '!' ] <relation>
     * <relation> ::= <expression> [ <relop> <expression> ]
     *
     * code example: pvx,y,zbx=z>ye.
     * which stands for:
     * -----
     * PROGRAM
     * VAR X, Y, Z
     * BEGIN
     * X = Z > Y
     * END.
     * -----
     */
    booleanExpressions = moreCodeGenerationRoutines.extend({

        // Recognize a boolean orop
        isOrop: function (c) {
            return c === '|' || c === '~';
        },

        // Recognize a relop
        isRelop: function (c) {
            return c === '=' || c === '#' || c === '<' || c === '>';
        },

        // Recognize and translate a relational "equals"
        equals: function () {
            this.match('=');
            this.expression();
            this.popCompare();
            this.setEqual();
        },

        // Recognize and translate a relational "not equals"
        notEquals: function () {
            this.match('#');
            this.expression();
            this.popCompare();
            this.setNEqual();
        },

        // Recognize and translate a relational "less than"
        less: function () {
            this.match('<');
            this.expression();
            this.popCompare();
            this.setLess();
        },

        // Recognize and translate a relational "greater than"
        greater: function () {
            this.match('>');
            this.expression();
            this.popCompare();
            this.setGreater();
        },

        // Parse and translate a relation
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

        // Parse and translate a boolean factor with leading NOT
        notFactor: function () {
            if (this.look === '!') {
                this.match('!');
                this.relation();
                this.notIt();
            } else {
                this.relation();
            }
        },

        // Parse and translate a boolean term
        boolTerm: function () {
            this.notFactor();
            while (this.look === '&') {
                this.push();
                this.match('&');
                this.notFactor();
                this.popAnd();
            }
        },

        // Recognize and translate a boolean OR
        boolOr: function () {
            this.match('|');
            this.boolTerm();
            this.popOr();
        },

        // Recognize and translate an exclusive or (XOR)
        boolXor: function () {
            this.match('~');
            this.boolTerm();
            this.popXor();
        },

        // Parse and translate a boolean expression
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

        // Parse and translate a math factor
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.boolExpression();  // <--
                this.match(')');
            } else if (this.isAlpha(this.look)) {
                this.loadVar(this.getName());
            } else {
                this.loadConst(this.getNum());
            }
        },

        // Parse and translate an assignment statement
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.boolExpression();  // <--
            this.store(name);
        }

    });

    /**
     * 10.9 Control structures
     * <block> ::= ( <statement> )*
     * <statement> ::= <if> | <while> | <assignment>
     * <if> ::= IF <bool-expression> <block> [ ELSE <block> ] ENDIF
     * <while> ::= WHILE <bool-expression> <block> ENDWHILE
     *
     * So far: TINY version 0.1
     */
    controlStructures = booleanExpressions.extend({

        // Branch uncoditional
        branch: function (label) {
            this.emitLn('BRA ' + label);
        },

        // Branch false
        branchFalse: function (label) {
            this.emitLn('TST D0');
            this.emitLn('BEQ ' + label);
        },

        // Generate a unique lable
        newLabel: function () {
            var label = 'L' + this.lCount;
            this.lCount += 1;
            return label;
        },

        // Recognize and translate an IF constructor
        doIf: function () {
            var label_1, label_2;

            this.match('i');
            this.boolExpression();
            label_1 = this.newLabel();
            label_2 = label_1;
            this.branchFalse(label_1);
            this.block();

            if (this.look === 'l') {
                this.match('l');
                label_2 = this.newLabel();
                this.branch(label_2);
                this.postLabel(label_1);
                this.block();
            }

            this.postLabel(label_2);
            this.match('e');
        },

        // Parse and translate a WHILE statement
        doWhile: function () {
            var label_1, label_2;
            this.match('w');
            label_1 = this.newLabel();
            label_2 = this.newLabel();
            this.postLabel(label_1);
            this.boolExpression();
            this.branchFalse(label_2);
            this.block();
            this.match('e');
            this.branch(label_1);
            this.postLabel(label_2);
        },

        // Recognize and translate a statement block
        block: function () {
            while (this.look !== 'e' && this.look !== 'l') {
                switch (this.look) {
                case 'i':
                    this.doIf();
                    break;
                case 'w':
                    this.doWhile();
                    break;
                default:
                    this.assignment();
                }
            }
        },

        // Initialize
        init: function () {
            this.symbolTable = {};
            this.lCount = 0;
            this.getChar();
        }

    });

    /**
     * 10.10 Lexical scanning
     */
    lexicalScanning = controlStructures.extend({

        // Variable declarations
        token: '',      // encoded token
        value: '',      // unencoded token

        keywordCodeTable: {
            IF: 'i',
            ELSE: 'l',
            ENDIF: 'e',
            WHILE: 'w',
            ENDWHILE: 'e',
            VAR: 'v',
            BEGIN: 'b',
            END: 'e',
            PROGRAM: 'p'
        },

        keywordCode: function (val) {
            return this.keywordCodeTable[val] || 'x';
        },

        // Get an identifier and scan it for keywords
        scan: function () {
            this.getName();
            this.token = this.keywordCode(this.value);
        },

        // Recognize an alphanumeric character
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
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

        // Skip over an end-of-line
        newLine: function () {
            while (this.look === this.CR || this.look === this.LF) {
                this.getChar();
                this.skipWhite();
            }
        },

        // Match a specific input character
        match: function (x) {
            this.newLine();     // <--
            if (this.look !== x) {
                this.expected('"' + x + '"');
            }
            this.getChar();
            this.skipWhite();   // <--
        },

        // Match a specific input string
        matchString: function (str) {
            if (this.value !== str) {
                this.expected('"' + str + '"');
            }
        },

        // Get an identifier
        getName: function () {
            this.newLine();     // <--
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }
            this.value = '';
            while (this.isAlNum(this.look)) {
                this.value += this.look.toUpperCase();
                this.getChar();
            }
            this.skipWhite();   // <--
        },

        // Get a Number
        getNum: function () {
            var value = 0;
            this.newLine();     // <--
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }
            while (this.isDigit(this.look)) {
                value = +this.look + 10 * value;
                this.getChar();
            }
            this.skipWhite();   // <--
            return value;
        },

        // Parse and translate a math factor
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

        // Parse and translate a data declaration
        decl: function () {
            this.getName();
            this.alloc(this.value);
            while (this.look === ',') {     // <--
                this.match(',');
                this.getName();
                this.alloc(this.value);
            }
        },

        // Parse and translate an assignment statement
        assignment: function () {
            var name = this.value;
            this.match('=');
            this.boolExpression();
            this.store(name);
        },

        // Recognize and translate an IF constructor
        doIf: function () {
            var label_1, label_2;

            this.boolExpression();
            label_1 = this.newLabel();
            label_2 = label_1;
            this.branchFalse(label_1);
            this.block();

            if (this.token === 'l') {
                label_2 = this.newLabel();
                this.branch(label_2);
                this.postLabel(label_1);
                this.block();
            }

            this.postLabel(label_2);
            this.matchString('ENDIF');
        },

        // Parse and translate a WHILE statement
        doWhile: function () {
            var label_1 = this.newLabel(),
                label_2 = this.newLabel();

            this.postLabel(label_1);
            this.boolExpression();
            this.branchFalse(label_2);
            this.block();
            this.matchString('ENDWHILE');
            this.branch(label_1);
            this.postLabel(label_2);
        },

        // Recognize and translate a statement block
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
                default:
                    this.assignment();
                }
                this.scan();
            }
        },

        // Parse and translate global declarations
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

        // Main program
        doMain: function () {
            this.matchString('BEGIN');
            this.prolog();
            this.block();
            this.matchString('END');
            this.epilog();
        },

        // Parse and translate a program
        prog: function () {
            this.matchString('PROGRAM');
            this.header();
            this.topDecls();
            this.doMain();
            this.match('.');
        },

        // Initialize
        init: function () {
            this.symbolTable = {};
            this.lCount = 0;
            this.getChar();
            this.scan();
        }

    });

    // 10.11 Multi-character variable names

    /**
     * 10.12 More relops
     * <, <= , =, <>, #, >, >=
     */
    moreRelops = lexicalScanning.extend({

        // TODO: double check the Scc command!

        // Set D0 if compare was <=
        setLessOrEqual: function () {
            this.emitLn('SGE D0');
            this.emitLn('EXT D0');
        },

        // Set D0 if compare was >=
        setGreaterOrEqual: function () {
            this.emitLn('SLE D0');
            this.emitLn('EXT D0');
        },

        // Recognize and translate a relational "less than or equal"
        lessOrEqual: function () {
            this.match('=');
            this.expression();
            this.popCompare();
            this.setLessOrEqual();
        },

        // Recognize and translate a relational "not equals"
        notEqual: function () {
            this.match('>');
            this.expression();
            this.popCompare();
            this.setNEqual();
        },

        // Recognize and translate a relational "less than"
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

        // Recognize and translate a relational "greater than"
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
     * 10.13 Input/Output
     * Assuming a library call TINYLIB.LIB exists
     */
    inputOutput = moreRelops.extend({

        keywordCodeTable: {
            IF: 'i',
            ELSE: 'l',
            ENDIF: 'e',
            WHILE: 'w',
            ENDWHILE: 'e',
            READ: 'R',      // <--
            WRITE: 'W',     // <--
            VAR: 'v',
            BEGIN: 'b',
            END: 'e',
            PROGRAM: 'p'
        },

        // Write header info
        header: function () {
            writeLn('WARMST', this.TAB, 'EQU $A01E');
            this.emitLn('LIB TINYLIB');
        },

        // Read variable to primary register
        readVar: function () {
            this.emitLn('BSR READ');
            this.store(this.value);
        },

        // Write variable from primary register
        writeVar: function () {
            this.emitLn('BSR WRITE');
        },

        // Process a read statement
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

        // Process a write statement
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

        // Recognize and translate a statement block
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
                case 'R':   // <--
                    this.doRead();
                    break;
                case 'W':   // <--
                    this.doWrite();
                    break;
                default:
                    this.assignment();
                }
                this.scan();
            }
        }

    });

    // 10.14 Conclusion
    // TINY Version 1.0


    // return main functions for executions
    return {

        // 10.2.1
        gettingStarted: boundMain(gettingStarted),
        // 10.2.2
        theMainProgram: boundMain(theMainProgram),
        // 10.3
        declarations: boundMain(declarations),
        // 10.4.1
        declarationsAndSymbols: boundMain(declarationsAndSymbols),
        // 10.4.2
        variableList: boundMain(variableList),
        // 10.5.1
        initializers: boundMain(initializers),
        // 10.5.2
        multiDigitInteger: boundMain(multiDigitInteger),
        // 10.6
        theSymbolTable: boundMain(theSymbolTable),
        // 10.7.1
        executableStatements: boundMain(executableStatements),
        // 10.7.3
        assignmentStatement: boundMain(assignmentStatement),
        // 10.8.2
        booleanExpressions: boundMain(booleanExpressions),
        // 10.9
        controlStructures: boundMain(controlStructures),
        //10.10
        lexicalScanning: boundMain(lexicalScanning),
        // 10.12
        moreRelops: boundMain(moreRelops),
        // 10.13
        inputOutput: boundMain(inputOutput)

    };

}());