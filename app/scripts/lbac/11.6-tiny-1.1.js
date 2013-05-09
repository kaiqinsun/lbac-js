/*global define*/
/*jshint camelcase: false*/

/**
 * 11.6 Conclusion
 * ----------------
 * **Program Tiny v1.1** concludes chapter 11 Lexical scan revisited.
 */

define(['./object', 'io'], function (object, io) {
    'use strict';

    var tiny11 = object.extend({

        // Constant declarations
        TAB: '\t',
        CR: '\r',
        LF: '\n',

        // Variable declarations
        look: '',       // lookahead character
        lCount: 0,      // label counter
        token: '',      // encoded token
        value: '',      // unencoded token
        symbolTable: null,

        keywordCodeTable: {
            IF: 'i',
            ELSE: 'l',
            ENDIF: 'e',
            WHILE: 'w',
            ENDWHILE: 'e',
            READ: 'R',
            WRITE: 'W',
            VAR: 'v',
            BEGIN: 'b',
            END: 'e',
            PROGRAM: 'p'
        },

        keywordCode: function (val) {
            return this.keywordCodeTable[val] || 'x';
        },

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

        // Report an undefined identifier
        undef: function (name) {
            this.abort('Undefined Identifier ' + name);
        },

        // Report a duplicate identifier
        duplicate: function (name) {
            this.abort('Duplicate Identifier ' + name);
        },

        // Check to make sure the current token is an identifier
        checkIdent: function () {
            if (this.token !== 'x') {
                this.expected('Identifier');
            }
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

        // Recognize a boolean orop
        isOrop: function (c) {
            return c === '|' || c === '~';
        },

        // Recognize a relop
        isRelop: function (c) {
            return c === '=' || c === '#' || c === '<' || c === '>';
        },

        // Recognize white space
        isWhite: function (c) {
            return c === ' ' || c === this.TAB ||
                   c === this.CR || c === this.LF;
        },

        // Skip over leading white space
        skipWhite: function () {
            while (this.isWhite(this.look)) {
                this.getChar();
            }
        },

        // Look for symbol in table
        inTable: function (name) {
            return !!this.symbolTable[name];
        },

        // Check to see if an identifier is in the symbol table
        // Report an error if it's not.
        checkTable: function (name) {
            if (!this.inTable(name)) {
                this.undef(name);
            }
        },

        // Check the symbol table for a duplicate identifier
        // Report an error if identifier is already in table.
        checkDup: function (name) {
            if (this.inTable(name)) {
                this.duplicate(name);
            }
        },

        // Add a new entry to symbol table
        addEntry: function (name, type) {
            this.checkDup(name);
            this.symbolTable[name] = type;
        },

        // Get an identifier
        getName: function () {
            this.skipWhite();
            if (!this.isAlpha(this.look)) {
                this.expected('Identifier');
            }
            this.token = 'x';
            this.value = '';
            do {
                this.value += this.look.toUpperCase();
                this.getChar();
            } while (this.isAlNum(this.look));
        },

        // Get a Number
        getNum: function () {
            this.skipWhite();
            if (!this.isDigit(this.look)) {
                this.expected('Number');
            }
            this.token = '#';
            this.value = '';
            do {
                this.value += this.look;
                this.getChar();
            } while (this.isDigit(this.look));
        },

        // Get an operator
        getOp: function () {
            this.token = this.look;
            this.value = this.look;
            this.getChar();
        },

        // Get the next input token
        next: function () {
            this.skipWhite();
            if (this.isAlpha(this.look)) {
                this.getName();
            } else if (this.isDigit(this.look)) {
                this.getNum();
            } else {
                this.getOp();
            }
        },

        // Scan the current identifier for keywords
        scan: function () {
            if (this.token === 'x') {
                this.token = this.keywordCode(this.value);
            }
        },

        // Match a specific input string
        matchString: function (str) {
            if (this.value !== str) {
                this.expected('"' + str + '"');
            }
            this.next();
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

        // Generate a unique lable
        newLabel: function () {
            var label = 'L' + this.lCount;
            this.lCount += 1;
            return label;
        },

        // Post a label to output
        postLabel: function (label) {
            io.writeLn(label + ':');
        },

        /**
         * Code generation routines
         */

         // Clear the primary register
        clear: function () {
            this.emitLn('CLR D0');
        },

        // Negate the primary register
        negate: function () {
            this.emitLn('NEG D0');
        },

        // Complement the primary register
        notIt: function () {
            this.emitLn('NOT D0');
        },

        // Load a constant value to primary register
        loadConst: function (number) {
            this.emitLn('MOVE #' + number + ', D0');
        },

        // Load a variable to primary register
        loadVar: function (name) {
            if (!this.inTable(name)) {
                this.undef(name);
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
        },

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

        // Store primary to variable
        store: function (name) {
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
        },

        // Branch uncoditional
        branch: function (label) {
            this.emitLn('BRA ' + label);
        },

        // Branch false
        branchFalse: function (label) {
            this.emitLn('TST D0');
            this.emitLn('BEQ ' + label);
        },

        // Read variable to primary register
        readIt: function () {
            this.emitLn('BSR READ');
            this.store(this.value);
        },

        // Write variable from primary register
        writeIt: function () {
            this.emitLn('BSR WRITE');
        },

        /**
         * TODO: provide BNF
         */

        // Write header info
        header: function () {
            io.writeLn('WARMST', this.TAB, 'EQU $A01E');
        },

        // Write the prolog
        prolog: function () {
            this.postLabel('MAIN');
        },

        // Write the epilog
        epilog: function () {
            this.emitLn('DC WARMST');
            this.emitLn('END MAIN');
        },

        // Allocate storage for a static variable
        allocate: function (name, value) {
            io.writeLn(name, ':', this.TAB, 'DC ', value);
        },

        /**
         * ```
         * <expression> ::= <term> [<addop> <term>]*
         * <term> ::= <factor> [<mulop> <factor>]*
         * <factor> ::= <number> | (<b-expression>) | <variable>
         * ```
         */

        // Parse and translate a math factor
        factor: function () {
            if (this.token === '(') {
                this.next();
                this.boolExpression();
                this.matchString(')');
            } else {
                if (this.token === 'x') {
                    this.loadVar(this.value);
                } else if (this.token === '#') {
                    this.loadConst(this.value);
                } else {
                    this.expected('Math Factor');
                }
                this.next();
            }
        },

        // Recognize and translate a multiply
        multiply: function () {
            this.next();
            this.factor();
            this.popMul();
        },

        // Recognize and translate a divide
        divide: function () {
            this.next();
            this.factor();
            this.popDiv();
        },

        // Parse and translate a math term
        term: function () {
            this.factor();
            while (this.isMulop(this.token)) {
                this.push();
                switch (this.token) {
                case '*':
                    this.multiply();
                    break;
                case '/':
                    this.divide();
                    break;
                }
            }
        },

        // Recognize and translate an add
        add: function () {
            this.next();
            this.term();
            this.popAdd();
        },

        // Recognize and translate a subtract
        subtract: function () {
            this.next();
            this.term();
            this.popSub();
        },

        // parse and translate an expression
        expression: function () {
            if (this.isAddop(this.token)) {
                this.clear();
            } else {
                this.term();
            }
            while (this.isAddop(this.token)) {
                this.push();
                switch (this.token) {
                case '+':
                    this.add();
                    break;
                case '-':
                    this.subtract();
                    break;
                }
            }
        },

        // Get another expression and compare
        compareExpression: function () {
            this.expression();
            this.popCompare();
        },

        // Get the next expression and compare
        nextExpression: function () {
            this.next();
            this.compareExpression();
        },

        // Recognize and translate a relational "equal"
        equal: function () {
            this.nextExpression();
            this.setEqual();
        },

        // Recognize and translate a relational "less than or equal"
        lessOrEqual: function () {
            this.nextExpression();
            this.setLessOrEqual();
        },

        // Recognize and translate a relational "not equals"
        notEqual: function () {
            this.nextExpression();
            this.setNEqual();
        },

        // Recognize and translate a relational "less than"
        less: function () {
            this.next();
            switch (this.token) {
            case '=':   // <=
                this.lessOrEqual();
                break;
            case '>':   // <>
                this.notEqual();
                break;
            default:    // <
                this.compareExpression();
                this.setLess();
            }
        },

        // Recognize and translate a relational "greater than"
        greater: function () {
            this.next();
            if (this.token === '=') {   // >=
                this.nextExpression();
                this.setGreaterOrEqual();
            } else {                    // >
                this.compareExpression();
                this.setGreater();
            }
        },

        // Parse and translate a relation
        relation: function () {
            this.expression();
            if (this.isRelop(this.token)) {
                this.push();
                switch (this.token) {
                case '=':
                    this.equals();
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
            if (this.token === '!') {
                this.next();
                this.relation();
                this.notIt();
            } else {
                this.relation();
            }
        },

        // Parse and translate a boolean term
        boolTerm: function () {
            this.notFactor();
            while (this.token === '&') {
                this.push();
                this.next();
                this.notFactor();
                this.popAnd();
            }
        },

        // Recognize and translate a boolean OR
        boolOr: function () {
            this.next();
            this.boolTerm();
            this.popOr();
        },

        // Recognize and translate an exclusive or (XOR)
        boolXor: function () {
            this.next();
            this.boolTerm();
            this.popXor();
        },

        // Parse and translate a boolean expression
        boolExpression: function () {
            this.boolTerm();
            while (this.isOrop(this.token)) {
                this.push();
                switch (this.token) {
                case '|':
                    this.boolOr();
                    break;
                case '~':
                    this.boolXor();
                    break;
                }
            }
        },

        // Parse and translate an assignment statement
        assignment: function () {
            var name;
            this.checkTable(this.value);
            name = this.value;
            this.next();
            this.matchString('=');
            this.boolExpression();
            this.store(name);
        },

        /**
         * ```
         * <program> ::= <block> END
         * <block> ::= [<statement>]*
         * <statement> ::= <if> | <assignment>
         * <if stmt> ::= IF <condition> <block> [ELSE <block>] ENDIF
         * <assignment> ::= <identifier> = <expression>
         * ```
         */

        // Recognize and translate an IF constructor
        doIf: function () {
            var label_1, label_2;
            this.next();
            this.boolExpression();
            label_1 = this.newLabel();
            label_2 = label_1;
            this.branchFalse(label_1);
            this.block();

            if (this.token === 'l') {
                this.next();
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
            var label_1, label_2;
            this.next();
            label_1 = this.newLabel();
            label_2 = this.newLabel();
            this.postLabel(label_1);
            this.boolExpression();
            this.branchFalse(label_2);
            this.block();
            this.matchString('ENDWHILE');
            this.branch(label_1);
            this.postLabel(label_2);
        },

        // Read variable to primary register
        readVar: function () {
            this.checkIdent();
            this.checkTable(this.value);
            this.readIt(this.value);
            this.next();
        },

        // Process a read statement
        doRead: function () {
            this.next();
            this.matchString('(');
            this.readVar();
            while (this.token === ',') {
                this.next();
                this.readVar();
            }
            this.matchString(')');
        },

        // Process a write statement
        doWrite: function () {
            this.next();
            this.matchString('(');
            this.expression();
            this.writeIt();
            while (this.token === ',') {
                this.next();
                this.expression();
                this.writeIt();
            }
            this.matchString(')');
        },

        // Recognize and translate a statement block
        block: function () {
            while (this.token !== 'e' && this.token !== 'l') {
                switch (this.token) {
                case 'i':
                    this.doIf();
                    break;
                case 'w':
                    this.doWhile();
                    break;
                case 'R':
                    this.doRead();
                    break;
                case 'W':
                    this.doWrite();
                    break;
                default:
                    this.assignment();
                }
                this.scan();
            }
        },

        // Allocate storage for a variable
        alloc: function () {
            this.next();
            if (this.token !== 'x') {
                this.expected('Variable Name');
            }
            this.checkDup(this.value);
            this.addEntry(this.value, 'v');
            this.allocate(this.value, '0');
            this.next();
        },

        // Parse and translate global declarations
        topDecls: function () {
            this.scan();
            while (this.token === 'v') {
                this.alloc();
                while (this.token === ',') {
                    this.alloc();
                }
                this.scan();    // <--
            }
        },

        // Initialize
        init: function () {
            this.symbolTable = {};
            this.lCount = 0;
            this.getChar();
            this.next();
        },

        // Main function
        main: function () {
            this.init();
            this.matchString('PROGRAM');
            this.header();
            this.topDecls();
            this.matchString('BEGIN');
            this.prolog();
            this.block();
            this.matchString('END');
            this.epilog();
        }
    });

    return {
        object: tiny11
    };
});
