/*global define*/

/**
 * Chapter 13 Procedures
 * ======================
 */

define(['./object', 'io'], function (object, io) {
    'use strict';

    /**
     * 13.1 Introduction
     * -----------------
     * At this point we’ve studied almost all the basic features of
     * compilers and parsing.
     * That’s nice, but what we have is still only a toy language.
     * We can’t read or write even a single character of text, and we
     * still don’t have procedures.
     */

    /**
     * 13.2 One last digression
     * ------------------------
     * We will be using single-character tokens again as we study
     * the concepts of procedures, unfettered by the other baggage
     * that we have accumulated in the previous sessions.
     */

    /**
     * 13.3 The basics
     * ---------------
     * All modern CPU’s provide direct support for procedure calls,
     * and the 68000 is no exception. For the 68000, the call is a
     * `BSR` (PC-relative version) or `JSR`, and the return is `RTS`.
     * All we have to do is to arrange for the compiler to issue
     * these commands at the proper place.
     *
     * Three things we have to address:
     *
     * 1. Call/return mechanism
     * 2. Defining the procedure
     * 3. Parameter passing
     *
     * None of these things are really very difficult.
     * The third, parameter passing will occupy most of our attention
     * because there are many options available.
     */

    /**
     * 13.4 A basis for experimentation
     * --------------------------------
     * As always, we will need some software to serve as a basis for
     * what we are doing.
     * The program here is that basis, a vestigial form of TINY:
     *
     * - With single-character tokens.
     * - It has data declarations, but only in their simplest form...
     * no lists or initializers.
     * - It has assignment statements, but only of the kind
     *
     *       <ident> = <ident>
     *
     *   In other words, the only legal expression is a single
     *   variable name. There are no control constructs.
     *   the only legal statement is the assignment.
     *
     * In this program, Most of the program is the standard
     * **Cradle** routines.
     * We start with a language in BNF
     * ```
     * <program>     ::= <declaration> BEGIN <block> END'.'
     * <declaration> ::= (<data decl>)*
     * <data decl>   ::= VAR <ident>
     * <block>       ::= (<assignment>)*
     * <assignment>  ::= <ident> = <expression>
     * <expression>  ::= <ident>
     * ```
     * Note that the assembly like comments are also included here.
     * Try something like
     * ```
     * v a                  ; var a
     * v b                  ; var b
     * v c                  ; var c
     * b                    ; begin
     *     a = b            ;     a = b
     *     b = c            ;     b = c
     * e.                   ; end.
     * ```
     * As usual, you should also make some deliberate errors, and
     * verify that the program catches them correctly.
     */
    var aBasisForExperimentation = object.extend({

        // Constant declarations.
        TAB: '\t',
        CR: '\r',
        LF: '\n',

        // Variable declarations.
        look: '',   // lookahead character
        symbolTable: null,

        // Read new character from input stream.
        getChar: function () {
            this.look = io.read();
        },

        // Report an error.
        error: function (str) {
            io.writeLn('Error: ', str, '.');
        },

        // Report error and halt.
        abort: function (str) {
            this.error(str);
            io.halt();
        },

        // Report what was expected.
        expected: function (str) {
            this.abort(str + ' Expected');
        },

        // Report an undefined identifier.
        undefined: function (name) {
            this.abort('Undefined identifier ' + name);
        },

        // Report a duplicate identifier.
        duplicate: function (name) {
            this.abort('Duplicate identifier ' + name);
        },

        // Get type of symbol.
        typeOf: function (name) {
            return this.symbolTable[name];
        },

        // Look for symbol in table.
        inTable: function (name) {
            return !!this.symbolTable[name];
        },

        // Add a new entry to symbol table.
        addEntry: function (name, type) {
            if (this.inTable(name)) {
                this.duplicate(name);
            }

            this.symbolTable[name] = type;
        },

        // Check an entry to make sure it's a variable.
        checkVar: function (name) {
            if (!this.inTable(name)) {
                this.undefined(name);
            }

            if (this.typeOf(name) !== 'v') {
                this.abort(name + ' is not a variable');
            }
        },

        // Recognize an alpha character.
        isAlpha: function (c) {
            return (/[A-Z]/i).test(c);
        },

        // Recognize a decimal digit.
        isDigit: function (c) {
            return (/\d/).test(c);
        },

        // Recognize an alphanumeric character.
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
        },

        // Recognize an addop.
        isAddop: function (c) {
            return c === '+' || c === '-';
        },

        // Recognize a mulop.
        isMulop: function (c) {
            return c === '*' || c === '/';
        },

        // Recognize a boolean orop.
        isOrop: function (c) {
            return c === '|' || c === '~';
        },

        // Recognize a relop.
        isRelop: function (c) {
            return c === '=' || c === '#' || c === '<' || c === '>';
        },

        // Recognize white space.
        isWhite: function (c) {
            return c === ' ' || c === this.TAB || c === ';';
        },

        // Skip over leading white space.
        skipWhite: function () {
            while (this.isWhite(this.look)) {
                if (this.look === ';') {
                    this.skipComment();
                } else {
                    this.getChar();
                }
            }
        },

        // Skip a comment field.
        skipComment: function () {
            while (this.look !== this.LF) {
                this.getChar();
            }
            this.getChar();
        },

        // Skip over and end-of-line.
        fin: function () {
            if (this.look === this.LF) {
                this.getChar();
            }
        },

        // Match a specific input character.
        match: function (x) {
            if (this.look !== x) {
                this.expected('"' + x + '"');
            }

            this.getChar();
            this.skipWhite();                       // <--
        },

        // Get an identifier.
        getName: function () {
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            var name = this.look.toUpperCase();
            this.getChar();
            this.skipWhite();                       // <--
            return name;
        },

        // Get a number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var num = this.look;
            this.getChar();
            this.skipWhite();                       // <--
            return num;
        },

        // Output a string with tab.
        emit: function (str) {
            io.write(this.TAB, str);
        },

        // Output a string with tab and newline.
        emitLn: function (str) {
            this.emit(str);
            io.writeLn();
        },

        // Post a label to output.
        postLabel: function (label) {
            io.writeLn(label + ':');
        },

        // Load a variable to primary register.
        loadVar: function (name) {
            this.checkVar(name);                    // <--
            this.emitLn('MOVE ' + name + '(PC), D0');
        },

        // Store the primary register.
        storeVar: function (name) {
            this.checkVar(name);                    // <--
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
        },

        // Initialize.
        init: function () {
            this.symbolTable = {};
            this.getChar();
            this.skipWhite();
        },

        // Parse and translate an expression
        // Vestigial version.
        expression: function () {
            this.loadVar(this.getName());
        },

        // Parse and translate an assignment statement.
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.expression();
            this.storeVar(name);
        },

        // Recognize and translate a block of statements.
        doBlock: function () {
            while (this.look !== 'e') {
                this.skipWhite();
                this.assignment();
                this.fin();
            }
        },

        // Parse and translate a begin-block.
        beginBlock: function () {
            this.match('b');
            this.fin();
            this.doBlock();
            this.match('e');
            this.fin();
        },

        // Allocate storage for a variable.
        alloc: function (name) {
            if (this.inTable(name)) {
                this.duplicate(name);
            }

            this.symbolTable[name] = 'v';
            io.writeLn(name, ':', this.TAB, 'DC 0');
        },

        // Parse and translate a data declaration.
        decl: function () {
            this.match('v');
            this.alloc(this.getName());
        },

        // Parse and translate global declarations.
        topDecls: function () {
            while (this.look !== 'b') {
                switch (this.look) {
                case 'v':
                    this.decl();
                    break;
                default:
                    this.abort('Unrecognized keyword ' + this.look);
                }
                this.fin();
            }
        },

        // Main program.
        main: function () {
            this.init();
            this.topDecls();
            this.beginBlock();
        }
    });

    /**
     * 13.5 Declarating a procedure
     * ----------------------------
     * It’s time to deal with the procedures. Since we haven’t talked
     * about parameters yet, we’ll begin by considering only
     * procedures that have no parameter lists.
     *
     * ### 13.5.1 ###
     * Let’s consider a simple program with a procedure, and think about
     * the code we’d like to see generated for it:
     * ```
     * Source Code                  Generated Code
     * -------------------------------------------
     * program foo;
     * .
     * .
     * procedure bar;               BAR:
     * begin                        .
     * .                            .
     * .                            .
     * end;                         RTS
     * begin main program           MAIN:
     * .                            .
     * .                            .
     * foo;                         BSR BAR
     * .                            .
     * .                            .
     * end.                         END MAIN
     * ```
     *
     * Declaring procedure is no different than declaring a variable,
     * and we can write the BNF
     * ```
     * <declaration> ::= (<data decl> | <procedure>)*
     * ```
     * What about the syntax of a procedure? Well, here’s a suggested
     * syntax, which is essentially that of Pascal
     * ```
     * <procedure>   ::= PROCEDURE <ident> <begin-block>
     * <begin-block> ::= BEGIN <block> END
     * ```
     *
     * Try something like
     * ```
     * v a                  ; var a
     * p f                  ; procedure f
     * b                    ; begin
     *     a = a            ;     a = a
     * e                    ; end
     *
     * v b                  ; var b
     * b                    ; begin       { of main }
     *     b = a            ;     b = a
     * e.                   ; end.
     * ```
     */
    var declaratingAProcedure = aBasisForExperimentation.extend({

        return: function () {
            this.emitLn('RTS');
        },

        // Parse and translate a procedure declaration.
        doProc: function () {
            var name;

            this.match('p');
            name = this.getName();
            this.fin();
            if (this.inTable(name)) {
                this.duplicate(name);
            }

            this.symbolTable[name] = 'p';
            this.postLabel(name);
            this.beginBlock();
            this.return();
        },

        // Parse and translate global declarations.
        topDecls: function () {
            while (this.look !== 'b') {
                switch (this.look) {
                case 'v':
                    this.decl();
                    break;
                case 'p':                           // <--
                    this.doProc();
                    break;
                default:
                    this.abort('Unrecognized keyword ' + this.look);
                }
                this.fin();
            }
        },

        // Write the prolog.
        prolog: function () {
            this.postLabel('MAIN');
        },

        // Write the epilog.
        epilog: function () {
            this.emitLn('DC WARMST');
            this.emitLn('END MAIN');
        },

        // Parse and translate a main program.
        doMain: function () {
            this.match('b');
            this.fin();
            this.prolog();
            this.doBlock();
            this.epilog();
        },

        // Main program.
        main: function () {
            this.init();
            this.topDecls();
            this.doMain();                          // <--
        }
    });

    /**
     * ### 13.5.2 The main program ###
     * Isn’t the main program just one more declaration, also?
     * The answer is yes.
     *
     * Suppose we use an explicit keyword, PROGRAM, to identify the main
     * program (Note that this means that we can’t start the file with
     * it, as in Pascal). In this case, our BNF becomes
     * ```
     * <declaration>  ::= <data decl> | <procedure> | <main program>
     * <procedure>    ::= PROCEDURE <ident> <begin-block>
     * <main program> ::= PROGRAM <ident> <begin-block>
     * ```
     *
     * The previous code becomes
     * ```
     * v a                  ; var a
     * p f                  ; procedure f
     * b                    ; begin
     *     a = a            ;     a = a
     * e                    ; end
     *
     * v b                  ; var b
     * P x                  ; program x
     * b                    ; begin
     *     b = a            ;     b = a
     * e.                   ; end.
     * ```
     * Note that any code after the main program will not be accessible.
     * However, we COULD access it via a FORWARD statement,
     * which we’ll be providing later.
     */
    var theMainProgram = declaratingAProcedure.extend({

        // Parse and translate a main program.
        doMain: function () {
            var name;

            this.match('P');
            name = this.getName();
            this.fin();
            if (this.inTable(name)) {
                this.duplicate(name);
            }

            this.prolog();
            this.beginBlock();
        },

        // Parse and translate global declarations.
        topDecls: function () {
            while (this.look !== '.') {             // <--
                switch (this.look) {
                case 'v':
                    this.decl();
                    break;
                case 'p':
                    this.doProc();
                    break;
                case 'P':                           // <--
                    this.doMain();
                    break;
                default:
                    this.abort('Unrecognized keyword ' + this.look);
                }
                this.fin();
            }
        },

        // Main program.
        main: function () {
            this.init();
            this.topDecls();
            this.epilog();                          // <--
        }
    });

    /**
     * 13.6 Calling the procedure
     * --------------------------
     * Let’s address the second half of the equation, the call.
     * Consider the BNF for a procedure call
     * ```
     * <proc call> ::= <ident>
     * ```
     * for an assignment statement, on the other hand, the BNF is
     * ```
     * <assignment>  ::= <ident> = <expression>
     * ```
     * At this point we seem to have a problem. The two BNF statements both
     * begin on the right-hand side with the token <ident>.
     * However, it turns out to be an easy problem to fix, since all we have
     * to do is to look at the type of the identifier, as recorded in the
     * symbol table.
     *
     * ```
     * <block>          ::= (<assign-or-proc>)*
     * <assign-or-proc> ::= assignment> | <proc call>
     * <proc call>      ::= <ident>
     * ```
     * Try something like
     * ```
     * v a                  ; var a
     * v b                  ; var b
     * p f                  ; procedure f
     * b                    ; begin
     *     a = b            ;     a = b
     *     f                ;     f       { call f recursively }
     * e                    ; end
     *
     * P x                  ; program x
     * b                    ; begin
     *     f                ;     f       { call f }
     *     b = a            ;     b = a
     * e.                   ; end.
     * ```
     * So even though we don’t allow nested DECLARATIONS, there is certainly
     * nothing to keep us from nesting CALLS, just as we would expect to do
     * in any language.
     *
     * So far we can only deal with procedures that have no parameters.
     * The procedures can only operate on the global variables by their
     * global names.
     */
    var callingTheProcedure = theMainProgram.extend({

        // Parse and translate an assignment statement.
        assignment: function (name) {               // <--
            this.match('=');
            this.expression();
            this.storeVar(name);
        },

        // Call a procedure.
        callProc: function (name) {
            this.emitLn('BSR ' + name);
        },

        // Decide if a statement is an assignment or procedure call.
        assignOrProc: function () {
            var name = this.getName();

            switch (this.typeOf(name)) {
            case ' ':
                this.undefined(name);
                break;
            case 'v':
                this.assignment(name);
                break;
            case 'p':
                this.callProc(name);
                break;
            default:
                this.abort('Identifier ' + name + ' cannot be used here');
            }
        },

        // Recognize and translate a block of statements.
        doBlock: function () {
            while (this.look !== 'e') {
                this.skipWhite();
                this.assignOrProc();                // <--
                this.fin();
            }
        }
    });

    /**
     * 13.7 Passing parameters
     * -----------------------
     * In general the procedure is given a parameter list, for example
     * ```
     * PROCEDURE FOO(X, Y, Z)
     * ```
     * In the declaration of a procedure, the parameters are called
     * *formal parameters*, and may be referred to in the body of the
     * procedure by those names.
     *
     * When a procedure is called, the *actual parameters* (arguments)
     * passed to it are associated with the formal parameters, on a
     * one-for-one basis. The BNF for the syntax looks like
     * ```
     * <procedure> ::= PROCEDURE <ident> '(' <param-list> ')' <begin-block>
     * <param-list> ::= <parameter> (',' <parameter>)* | null
     * ```
     * Similarly, the procedure call looks like:
     * ```
     * <proc call> ::= <ident> '(' <param-list> ')'
     * ```
     * Some languages such as Pascal and Ada, permit parameter lists to be
     * *optional*. Other languages, like C and Modula 2, require the parens
     * even if the list is empty. The BNF above corresponds to the former.
     *
     * Try something like
     * ```
     * v a                  ; var a
     * v b                  ; var b
     * p f(x, y)            ; procedure f(x, y)
     * b                    ; begin
     *     a = b            ;     a = b
     *     f(a, y)          ;     f(a, y)
     * e                    ; end
     *
     * P x                  ; program x
     * b                    ; begin
     *     f(n)             ;     f(n)
     *     b = a            ;     b = a
     * e.                   ; end.
     * ```
     * Note that there is NO checking to make sure that the number (and,
     * later, types) of formal and actual parameters match up.
     */
    var passingParameters = callingTheProcedure.extend({

        // Process a formal parameter.
        // A dummy version.
        formalParam: function () {
            this.getName();
        },

        // Process the formal parameter list of a procedure.
        formalList: function () {
            this.match('(');
            if (this.look !== ')') {
                this.formalParam();
                while (this.look === ',') {
                    this.match(',');
                    this.formalParam();
                }
            }
            this.match(')');
        },

        // Parse and translate a procedure declaration.
        doProc: function () {
            var name;

            this.match('p');
            name = this.getName();
            if (this.inTable(name)) {
                this.duplicate(name);
            }

            this.formalList();                      // <--
            this.fin();
            this.symbolTable[name] = 'p';
            this.postLabel(name);
            this.beginBlock();
            this.return();
        },

        // Process an actual parameter.
        // A dummy version.
        param: function () {
            this.getName();
        },

        // Process the parameter list for a procedure call.
        paramList: function () {
            this.match('(');
            if (this.look !== ')') {
                this.param();
                while (this.look === ',') {
                    this.match(',');
                    this.param();
                }
            }
            this.match(')');
        },

        call: function (name) {
            this.emitLn('BSR ' + name);
        },

        // Call a procedure.
        callProc: function (name) {
            this.paramList();                       // <--
            this.call(name);                        // <
        }
    });

    /**
     * 13.8 The semantics of parameters
     * --------------------------------
     * There are two main ways parameters are passed
     *
     * - By value
     * - By reference (address)
     *
     * The old FORTRAN compilers passed all parameters by reference.
     * This method created entirely too much coupling between the called
     * subroutine and its caller. In effect, it gave the subroutine complete
     * access to all variables that appeared in the parameter list.
     * Some FORTRAN programmers, in fact, made it a practice to copy ALL
     * parameters except those that were to be used as return values.
     *
     * There was, however, an even more insidious problem such as
     * ```
     * CALL FOO(A, B, J + 1)
     * ```
     * Here the third parameter is not a variable, and so it has no address.
     * The earliest FORTRAN compilers did not allow such things, so we had
     * to resort to subterfuges like:
     * ```
     * K = J + 1
     * CALL FOO(A, B, K)
     * ```
     * Here again, there was copying required, and the burden was on the
     * programmer to do it.
     * Later FORTRAN implementations got rid of this by allowing expressions
     * as parameters. What they did was to assign a compiler-generated
     * variable, store the value of the expression in the variable, and
     * then pass the address of the expression.
     *
     * The problem arose when someone decided to make things more efficient.
     * They reasoned, rightly enough, that the most common kind of
     * "expression" was a single integer value, as in
     * ```
     * CALL FOO(A, B, 4)
     * ```
     */

    /**
     * 13.9 Pass by value
     * ------------------
     * Let’s begin with the pass-by value case. Consider the procedure call
     * ```
     * FOO(X, Y)
     * ```
     * Almost the only reasonable way to pass the data is through the CPU
     * stack. So the code we’d like to see generated might look like
     * ```
     * MOVE X(PC), -(SP)    ; Push X
     * MOVE Y(PC), -(SP)    ; Push Y
     * BSR FOO              ; Call FOO
     * ```
     * When the BSR is executed, the CPU pushes the return address onto the
     * stack and jumps to FOO. At this point the stack will look like
     * ```
     * 6(SP)       Value of X     (2 bytes)
     * 4(SP)       Value of Y     (2 bytes)
     *  (SP)    –> Return Address (4 bytes)
     * ```
    * Now consider what the called procedure might look like
     * ```
     * PROCEDURE FOO(A, B)
     * BEGIN
     *     A = B
     * END
     * ```
     * The desired output code might look like
     * ```
     * FOO:    MOVE 4(SP), D0        ; D0 <- B
     *         MOVE D0, 6(SP)        ; A  <- D0
     *         RTS
     * ```
     *
     * Give it a try, for example
     * ```
     * v a                  ; var a
     * v b                  ; var b
     * p f(a, c)            ; procedure f(a, c)
     * b                    ; begin
     *     a = b            ;     a = b     { b is a global variable }
     *     b = c            ;     b = c     { a and c are local variables }
     *     f(a, c)          ;     f(a, c)   { call f recursively }
     * e                    ; end
     *
     * P x                  ; program x
     * b                    ; begin
     *     f(a, b)          ;     f(a, b)
     *     a = b            ;     a = b
     * e.                   ; end.
     * ```
     * Try declaring one or two procedures, each with a formal
     * parameter list. Then do some assignments, using combinations of global
     * and formal parameters.
     */
    var passByValue = passingParameters.extend({

        params: {},
        numParams: 0,

        // Initialize parameter table.
        clearParams: function () {
            this.params = {};
            this.numParams = 0;
        },

        // Initialize.
        init: function () {
            this.symbolTable = {};
            this.clearParams();                             // <--
            this.getChar();
            this.skipWhite();
        },

        // Parse and translate a procedure declaration.
        doProc: function () {
            var name;

            this.match('p');
            name = this.getName();
            if (this.inTable(name)) {
                this.duplicate(name);
            }

            this.formalList();
            this.fin();
            this.symbolTable[name] = 'p';
            this.postLabel(name);
            this.beginBlock();
            this.return();
            this.clearParams();                             // <--
        },

        // Find the paramter number.
        paramNumber: function (name) {
            return this.params[name];
        },

        // See if an identifier is a parameter.
        isParam: function (name) {
            return !!this.params[name];
        },

        // Add a new Parameter to table.
        addParam: function (name) {
            if (this.isParam(name)) {
                this.duplicate(name);
            }

            this.numParams += 1;
            this.params[name] = this.numParams;
        },

        // Load a parameter to the primary register.
        loadParam: function (num) {
            var offset = 4 + 2 * (this.numParams - num);
            this.emitLn('MOVE ' + offset + '(SP), D0');
        },

        // Store a parameter from the primary register.
        storeParam: function (num) {
            var offset = 4 + 2 * (this.numParams - num);
            this.emitLn('MOVE D0, ' + offset + '(SP)');
        },

        // Push the primary register to the stack.
        push: function () {
            this.emitLn('MOVE D0, -(SP)');
        },

        // Process a formal parameter.
        formalParam: function () {
            this.addParam(this.getName());                  // <--
        },

        // Get type of symbol.
        typeOf: function (name) {
            if (this.isParam(name)) {                       // <--
                return 'f';                                 // <
            }
            return this.symbolTable[name];
        },

        // Decide if a statement is an assignment or procedure call.
        assignOrProc: function () {
            var name = this.getName();

            switch (this.typeOf(name)) {
            case ' ':
                this.undefined(name);
                break;
            case 'v':   // fall through
            case 'f':                                       // <--
                this.assignment(name);
                break;
            case 'p':
                this.callProc(name);
                break;
            default:
                this.abort('Identifier ' + name + ' cannot be used here');
            }
        },

        // Parse and translate an expression
        // Vestigial version.
        expression: function () {
            var name = this.getName();
            if (this.isParam(name)) {                           // <--
                this.loadParam(this.paramNumber(name));     // <
            } else {
                this.loadVar(name);
            }
        },

        // Parse and translate an assignment statement.
        assignment: function (name) {
            this.match('=');
            this.expression();
            if (this.isParam(name)) {                       // <--
                this.storeParam(this.paramNumber(name));    // <
            } else {
                this.storeVar(name);
            }
        },

        // Process an actual parameter.
        param: function () {
            this.expression();                              // <--
            this.push();                                    // <
        }
    });

    /**
     * 13.10 What's wrong?
     * -------------------
     * The caller pushes each actual parameter onto the stack before it
     * calls the procedure. The procedure USES that information, but it
     * doesn’t change the stack pointer. That means that the stuff is still
     * there when we return.
     *
     * Fortunately, that’s easily fixed. All we have to do is to increment
     * the stack pointer when we’re finished.
     * Should we do that in the calling program, or the called procedure?
     * Here we let the caller clean up.
     *
     * Give it a try, for example
     * ```
     * v a                  ; var a
     * p f(x, y)            ; procedure f(x, y)
     * b                    ; begin
     *     x = y            ;     x = y
     * e                    ; end
     * P x                  ; program x
     * b                    ; begin
     *     f(a, a)          ;     f(a, a)
     * e.                   ; end.
     * ```
     */
    var whatsWrong = passByValue.extend({

        // Process the parameter list for a procedure call.
        paramList: function () {
            var num = 0;                            // <--
            this.match('(');
            if (this.look !== ')') {
                this.param();
                num += 1;                           // <
                while (this.look === ',') {
                    this.match(',');
                    this.param();
                    num += 1;                       // <
                }
            }
            this.match(')');
            return 2 * num;                         // <
        },

        // Call a procedure.
        callProc: function (name) {
            var num = this.paramList();             // <--
            this.call(name);
            this.cleanStack(num);                   // <
        },

        // Adjust the stack pointer upwards by num bytes.
        cleanStack: function (num) {
            if (num > 0) {
                this.emitLn('ADD #' + num + ', SP');
            }
        }
    });

    /**
     * ### 13.10.2 The next problem ###
     * Consider a different example as simple as
     * ```
     * PROCEDURE FOO(A, B)
     * BEGIN
     *     A = A + B
     * END
     * ```
     * The code generated by a simple-minded parser might be
     * ```
     * FOO: MOVE 6(SP), D0      ; Fetch A
     *      MOVE D0, -(SP)      ; Push it
     *      MOVE 4(SP), D0      ; Fetch B
     *      ADD (SP)+, D0       ; Add A
     *      MOVE D0, 6(SP)      ; Store A
     *      RTS
     * ```
     * This would be wrong. When we push the first argument onto the stack,
     * the offsets for the two formal parameters are no longer 4 and 6,
     * but are 6 and 8. So the second fetch would fetch A again, not B.
     *
     * The 68000 instruction set `LINK` lets you declare a frame pointer.
     * The complement, `UNLK`, restores the stack pointer and pops the old
     * value back into the register.
     * Using these two instructions, the previous code example becomes
     * ```
     * FOO: LINK A6, #0
     *      MOVE 10(A6), D0     ; Fetch A
     *      MOVE D0, -(SP)      ; Push it
     *      MOVE 8(A6), D0      ; Fetch B
     *      ADD (SP)+, D0       ; Add A
     *      MOVE D0, 10(A6)     ; Store A
     *      UNLK A6
     *      RTS
     * ```
     *
     * Give it a try, for example
     * ```
     * v n
     * p f(a, b)            ; procedure f(a, b)
     * b                    ; begin
     *     a = b            ;     a = b
     * e                    ; end
     * P x                  ; program x
     * b                    ; begin
     *     f(n, n)          ;     f(n, n)
     * e.                   ; end.
     * ```
     * There is still just one little small problem remaining
     * > WE HAVE NO WAY TO RETURN RESULTS TO THE CALLER!
     *
     * To get over the problem, we need to look at the alternative protocol.
     */
    var theNextProblem = whatsWrong.extend({

        // Write the prolog for a procedure.
        procProlog: function (name) {
            this.postLabel(name);
            this.emitLn('LINK A6, #0');
        },

        // Write the epilog for a procedure.
        procEpilog: function () {
            this.emitLn('UNLK A6');
            this.emitLn('RTS');
        },

        // Parse and translate a procedure declaration.
        doProc: function () {
            var name;

            this.match('p');
            name = this.getName();
            if (this.inTable(name)) {
                this.duplicate(name);
            }

            this.formalList();
            this.fin();
            this.symbolTable[name] = 'p';
            this.procProlog(name);                          // <--
            this.beginBlock();
            this.procEpilog();                              // <
            this.clearParams();
        },

        // Load a parameter to the primary register.
        loadParam: function (num) {
            var offset = 8 + 2 * (this.numParams - num);    // <--
            this.emitLn('MOVE ' + offset + '(A6), D0');     // <
        },

        // Store a parameter from the primary register.
        storeParam: function (num) {
            var offset = 8 + 2 * (this.numParams - num);    // <--
            this.emitLn('MOVE D0, ' + offset + '(A6)');     // <
        }
    });

    /**
     * 13.11 Call by reference
     * -----------------------
     * This one is easy, now that we have the mechanisms already in place.
     * We only have to make a few changes to the code generation.
     * Instead of pushing a value onto the stack, we must push an address.
     * The 68000 has an instruction `PEA` that does just that.
     *
     * we need the call `FOO(X, Y)` to be translated to:
     * ```
     * PEA X(PC)    ; Push the address of X
     * PEA Y(PC)    ; Push Y the address of Y
     * BSR FOO      ; Call FOO
     * ```
     * At the other end
     * ```
     * PROCEDURE FOO(A, B)
     * BEGIN
     *     A = A + B
     * END
     * ```
     * The references to the formal parameters must be
     * given one level of indirection
     * ```
     * FOO: LINK A6,#0
     *      MOVE.L 12(A6), A0   ; Fetch the address of A
     *      MOVE (A0), D0       ; Fetch A
     *      MOVE D0, -(SP)      ; Push it
     *      MOVE.L 8(A6), A0    ; Fetch the address of B
     *      MOVE (A0), D0       ; Fetch B
     *      ADD (SP)+, D0       ; Add A
     *      MOVE.L 12(A6), A0   ; Fetch the address of A
     *      MOVE D0, (A0)       ; Store A
     *      UNLK A6
     *      RTS
     * ```
     *
     * Give it a try and see if it’s generating reasonable-looking code.
     * For example
     * ```
     * v n                  ; var n
     * p f(a, b)            ; procedure f(a, b)
     * b                    ; begin
     *     a = b            ;     a = b
     * e                    ; end
     * P x                  ; program x
     * b                    ; begin
     *     f(n, n)          ;     f(n, n)
     * e.                   ; end.
     * ```
     * In the next version of TINY, we’ll use pass-by-reference for all
     * parameters. KISS will support both methods.
     */
    var callByReference = theNextProblem.extend({

        // Process an actual parameter.
        param: function () {
            this.emitLn('PEA ' + this.getName() + '(PC)');  // <--
        },

        // Load a parameter to the primary register.
        loadParam: function (num) {
            var offset = 8 + 4 * (this.numParams - num);    // <--
            this.emitLn('MOVE.L ' + offset + '(A6), A0');   // <
            this.emitLn('MOVE (A0), D0');                   // <
        },

        // Store a parameter from the primary register.
        storeParam: function (num) {
            var offset = 8 + 4 * (this.numParams - num);    // <--
            this.emitLn('MOVE.L ' + offset + '(A6), A0');   // <
            this.emitLn('MOVE D0, (A0)');                   // <
        },

        // Process the parameter list for a procedure call.
        paramList: function () {
            var num = 0;
            this.match('(');
            if (this.look !== ')') {
                this.param();
                num += 1;
                while (this.look === ',') {
                    this.match(',');
                    this.param();
                    num += 1;
                }
            }
            this.match(')');
            return 4 * num;                                 // <--
        }
    });

    /**
     * 13.12 Local variables
     * ---------------------
     * So far, we’ve said nothing about local variables, and our definition
     * of procedures doesn’t allow for them.
     *
     * Here again we are faced with a choice: Static or dynamic storage?
     * In those old FORTRAN programs, local variables were given static
     * storage just like global ones. That is, each local variable got a
     * name and allocated address, like any other variable, and was
     * referenced by that name.
     *
     * That can be an advantage in some applications; however, that makes
     * recursion impossible with static storage.
     *
     * The alternative is dynamic storage, in which storage is allocated on
     * the stack just as for passed parameters.
     *
     * In BNF
     * ```
     * <procedure> ::= PROCEDURE <ident> '(' <param-list> ')'
     *                 <loc-decls>
     *                 <begin-block>
     * <loc-decls> ::= (<loc-decl>)*
     * <loc-decl>  ::= VAR <ident>
     * ```
     * For example
     * ```
     * v n                  ; var n
     * p f(a, b)            ; procedure f(a, b)
     * v i                  ; var i
     * b                    ; begin
     *     a = b            ;     a = b
     *     b = i            ;     b = i
     * e                    ; end
     * P x                  ; program x
     * b                    ; begin
     *     f(n, n)          ;     f(n, n)
     * e.                   ; end.
     * ```
     */
    var localVariables = theNextProblem.extend({
        base: 0,

        // Load a parameter to the primary register.
        loadParam: function (num) {
            var offset = 8 + 2 * (this.base - num);         // <--
            this.emitLn('MOVE ' + offset + '(A6), D0');
        },

        // Store a parameter from the primary register.
        storeParam: function (num) {
            var offset = 8 + 2 * (this.base - num);         // <--
            this.emitLn('MOVE D0, ' + offset + '(A6)');
        },

        // Process the formal parameter list of a procedure.
        formalList: function () {
            this.match('(');
            if (this.look !== ')') {
                this.formalParam();
                while (this.look === ',') {
                    this.match(',');
                    this.formalParam();
                }
            }
            this.match(')');
            this.fin();                                     // <--
            this.base = this.numParams;                     // <
            this.numParams += 4;                            // <
        },

        // Parse and translate a local data declaration.
        locDecl: function () {
            this.match('v');
            this.addParam(this.getName());
            this.fin();
        },

        // Parse and translate local declarations.
        locDecls: function () {
            var num = 0;
            while (this.look === 'v') {
                this.locDecl();
                num += 1;
            }
            return num;
        },

        // Parse and translate a procedure declaration.
        doProc: function () {
            var name, k;                                    // <--

            this.match('p');
            name = this.getName();
            if (this.inTable(name)) {
                this.duplicate(name);
            }

            this.symbolTable[name] = 'p';
            this.formalList();
            k = this.locDecls();                            // <
            this.procProlog(name, k);                       // <
            this.beginBlock();
            this.procEpilog();
            this.clearParams();
        },

        // Write the prolog for a procedure.
        procProlog: function (name, k) {                    // <--
            this.postLabel(name);
            this.emitLn('LINK A6, #' + (-2 * k));           // <
        },

    });

    /**
     * 13.13 Conclusion
     * ----------------
     * At this point you know how to compile procedure declarations and
     * procedure calls, with parameters passed by reference and by value.
     * You can also handle local variables.
     */


    return {

        // 13.4
        // <program>     ::= <declaration> BEGIN <block> END'.'
        // <declaration> ::= (<data decl>)*
        // <data decl>   ::= VAR <ident>
        // <block>       ::= (<assignment>)*
        // <assignment>  ::= <ident> = <expression>
        // <expression>  ::= <ident>
        aBasisForExperimentation: aBasisForExperimentation,

        // 13.5.1
        // <declaration> ::= (<data decl> | <procedure>)*
        // <procedure>   ::= PROCEDURE <ident> <begin-block>
        // <begin-block> ::= BEGIN <block> END
        declaratingAProcedure: declaratingAProcedure,

        // 13.5.2
        // <declaration>  ::= <data decl> | <procedure> | <main program>
        // <procedure>    ::= PROCEDURE <ident> <begin-block>
        // <main program> ::= PROGRAM <ident> <begin-block>
        theMainProgram: theMainProgram,

        // 13.6
        // <block>          ::= (<assign-or-proc>)*
        // <assign-or-proc> ::= assignment> | <proc call>
        // <proc call>      ::= <ident>
        callingTheProcedure: callingTheProcedure,

        // 13.7
        // <procedure>  ::= PROCEDURE <ident> '(' <param-list> ')' <begin-block>
        // <param-list> ::= <parameter> (',' <parameter>)* | null
        // <proc call>  ::= <ident> '(' <param-list> ')'
        passingParameters: passingParameters,

        // 13.9
        passByValue: passByValue,

        // 13.10
        whatsWrong: whatsWrong,

        // 13.10.2
        theNextProblem: theNextProblem,

        // 13.11
        callByReference: callByReference,

        // 13.12
        // <procedure> ::= PROCEDURE <ident> '(' <param-list> ')'
        //                 <loc-decls>
        //                 <begin-block>
        // <loc-decls> ::= (<loc-decl>)*
        // <loc-decl>  ::= VAR <ident>
        localVariables: localVariables
    };
});
