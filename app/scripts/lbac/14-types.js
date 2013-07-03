/*global define*/

/**
 * Chapter 14 Types
 * ========
 */

define(['./object', 'io'], function (object, io) {
    'use strict';

    /**
     * 14.1 Introduction
     * -----------------
     * We’ll talk about how to deal with different data types.
     * Here we will ONLY be talking about the simple, predefined types.
     * We won’t even deal with arrays, pointers or strings,
     * and we also will not discuss user-defined types.
     *
     * Handling variables of different types is straightforward enough.
     * The complexity comes in when you add rules about conversion between
     * types. In general, you can make the compiler as simple or as complex
     * as you choose to make it.
     */

    /**
     * 14.2 What's coming next?
     * ------------------------
     * The plan, in fact, is to have THREE compilers:
     * One for a *single-character version* of **TINY** (to use for our
     * experiments), one for **TINY** and one for **KISS**.
     *
     * The differences between TINY and KISS
     *
     * - **TINY** will support only two data types: The character and the
     *   16-bit integer.
     * - **TINY** will only have two control constructs, the `IF` and the
     *   `WHILE`. **KISS** will support a very rich set of constructs,
     *   including one we haven’t discussed here before, the `CASE`.
     * - **KISS** will suport separately compilable modules.
     */

    /**
     * 14.3 The symbol table
     * ---------------------
     * It should be apparent that, if we’re going to deal with variables of
     * different types, we’re going to need someplace to record what those
     * types are. The obvious vehicle for that is the symbol table.
     *
     * Press *Enter* in the console to see the output.
     */
    var theSymbolTable = object.extend({

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

        // Dump the symbol table.
        dumpTable: function () {
            for (var name in this.symbolTable) {
                io.writeLn(name, ' ', this.symbolTable[name]);
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
            this.skipWhite();
        },

        // Get an identifier.
        getName: function () {
            if (!this.isAlpha(this.look)) {
                this.expected('Name');
            }

            var name = this.look.toUpperCase();
            this.getChar();
            this.skipWhite();
            return name;
        },

        // Get a number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var num = this.look;
            this.getChar();
            this.skipWhite();
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

        // Initialize.
        init: function () {
            this.symbolTable = {};
            this.getChar();
            this.skipWhite();
        },

        // Main program.
        main: function () {
            this.init();
            this.symbolTable = {
                A: 'a',     // for
                P: 'b',     // testing
                X: 'c'      // purposes
            };
            this.dumpTable();
        }
    });

    /**
     * 14.4 Adding entries
     * -------------------
     * Writing to the table directly is pretty poor practice. What we need
     * is a procedure to add entries to the table. At the same time,
     * we’re going to need to test the table, to make sure that we aren’t
     * redeclaring a variable that’s already in use.
     *
     * Press *Enter* again in the console to see the output.
     */
    var addingEntries = theSymbolTable.extend({

        // Get type of symbol.
        typeOf: function (name) {
            return this.symbolTable[name];
        },

        // Look for symbol in table.
        inTable: function (name) {
            return !!this.symbolTable[name];
        },

        // Check for a duplicate variable name.
        checkDup: function (name) {
            if (this.inTable(name)) {
                this.abort('Duplicate name ' + name);
            }
        },

        // Add a new entry to symbol table.
        addEntry: function (name, type) {
            this.checkDup(name);
            this.symbolTable[name] = type;
        },

        // Main program.
        main: function () {
            this.init();
            this.addEntry('A', 'a');    // for
            this.addEntry('P', 'b');    // testing
            this.addEntry('X', 'c');    // purposes
            this.dumpTable();
            this.addEntry('A', 'a');    // test for duplicate entry
        }
    });

    /**
     * 14.5 Allocating storage
     * -----------------------
     * We have already addressed the issue of declaring global variables,
     * and the code generated for them. Let’s build a vestigial version.
     * ```
     * <program>     ::= <declaration> '.'
     * <declaration> ::= (<data decl>)*
     * <data decl>   ::= VAR <identifier>
     * ```
     * Try allocating a few variables, and note the resulting code
     * generated. For example
     * ```
     * v a
     * v p
     * .
     * ```
     * Try declaring two variables with the same name, and verify that
     * the parser catches the error.
     */
    var allocatingStorage = addingEntries.extend({

        // Allocate storage for a variable.
        alloc: function (name) {
            this.addEntry(name, 'v');
            io.writeLn(name, ':', this.TAB, 'DC 0');
        },

        // Parse and translate a data declaration.
        decl: function () {
            this.match('v');
            this.alloc(this.getName());
        },

        // Parse and translate global declarations.
        topDecls: function () {
            while (this.look !== '.') {
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
            this.topDecls();                        // <--
            this.dumpTable();
        }
    });

    /**
     * 14.6 Declaring types
     * --------------------
     * Allocating storage of different sizes is as easy as modifying
     * procedure `topDecls` to recognize more than one keyword.
     * ```
     * <data decl> ::= <typename> <identifier>
     * <typename>  ::= BYTE | WORD | LONG
     * ```
     *
     * Give the thing a try. Use the single characters `b`, `w`, and `l`
     * for the keywords.
     * For example
     * ```
     * b a          ; BYTE A
     * w b          ; WORD B
     * l c          ; LONG C
     * .
     * ```
     * You will see that in each case, we are allocating
     * the proper storage size. Note from the dumped symbol table that
     * the sizes are also recorded for later use.
     */
    var declaringTypes = allocatingStorage.extend({

        // Generate code for allocation of a variable.
        allocVar: function (name, type) {
            io.writeLn(name, ':', this.TAB, 'DC.', type, ' 0');
        },

        // Allocate storage for a variable.
        alloc: function (name, type) {              // <--
            this.addEntry(name, type);              // <
            this.allocVar(name, type);              // <
        },

        // Parse and translate a data declaration.
        decl: function () {
            var type = this.getName();              // <--
            this.alloc(this.getName(), type);       // <
        },

        // Parse and translate global declarations.
        topDecls: function () {
            while (this.look !== '.') {
                switch (this.look) {
                case 'b':   // fall through         // <--
                case 'w':   // fall through         // <
                case 'l':                           // <
                    this.decl();
                    break;
                default:
                    this.abort('Unrecognized keyword ' + this.look);
                }
                this.fin();
            }
        }
    });

    /**
     * 14.7 Assignments
     * ----------------
     * Now that we can declare variables of different sizes, it stands to
     * reason that we ought to be able to do something with them.
     * ```
     * <program>     ::= <declaration> BEGIN <block> '.'
     * <declaration> ::= (<data decl>)*
     * <data decl>   ::= VAR <identifier>
     * <block>       ::= (<assignment>)*
     * <assignment>  ::= <ident> = <expression>
     * <expression>  ::= <ident>
     * ```
     * Run this program. Try the input
     * ```
     * b a           ; byte a
     * w b           ; word b
     * l c           ; long c
     * B             ; begin
     *     a = a
     *     a = b
     *     a = c
     *     b = a
     *     b = b
     *     b = c
     *     c = a
     *     c = b
     *     c = c
     * .
     * ```
     * There’s only one small little problem: The generated code is WRONG!
     * we have run into here, early on, is the issue of
     * **TYPE CONVERSION**, or **COERCION**.
     */
    var assignments = declaringTypes.extend({

        // Load a variable to primary register.
        loadVar: function (name, type) {
            this.move(type, name + '(PC)', 'D0');
        },

        // Generate a move instruction.
        move: function (size, source, dest) {
            this.emitLn('MOVE.' + size + ' ' + source + ', ' + dest);
        },

        // Recognize a legal variable type.
        isVarType: function (type) {
            return type === 'B' || type === 'W' || type === 'L';
        },

        // Get a variable type from the symbol table.
        varType: function (name) {
            var type = this.typeOf(name);
            if (!this.isVarType(type)) {
                this.abort('Identifier ' + name + ' is not a variable');
            }
            return type;
        },

        // Load a variable to the primary register.
        load: function (name) {
            this.loadVar(name, this.varType(name));
        },

        // Store primary to variable.
        storeVar: function (name, type) {
            this.emitLn('LEA ' + name + '(PC), A0');
            this.move(type, 'D0', '(A0)');
        },

        // Store a variable from the primary register.
        store: function (name) {
            this.storeVar(name, this.varType(name));
        },

        // Parse and translate an expression.
        expression: function () {
            this.load(this.getName());
        },

        // Parse and translate an assignment statement.
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.expression();
            this.store(name);
        },

        // Parse and translate a block of statements.
        block: function () {
            while (this.look !== '.') {
                this.skipWhite();
                this.assignment();
                this.fin();
            }
        },

        // Parse and translate global declarations.
        topDecls: function () {
            while (this.look !== 'B') {             // <--
                switch (this.look) {
                case 'b':   // fall through
                case 'w':   // fall through
                case 'l':
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
            this.match('B');
            this.fin();
            this.block();
            this.dumpTable();
        }
    });

    /**
     * 14.8 The coward's way out
     * -------------------------
     * There is one super-simple way to solve the problem: simply promote
     * every variable to a long integer when we load it!
     *
     * Run this program. Try again the input
     * ```
     * b a           ; byte a
     * w b           ; word b
     * l c           ; long c
     * B             ; begin
     *     a = a
     *     a = b
     *     a = c
     *     b = a
     *     b = b
     *     b = c
     *     c = a
     *     c = b
     *     c = c
     * .
     * ```
     * With this version, a byte is treated as unsigned (as in Pascal and C)
     * while a word is treated as signed.
     */
    var theCowardsWayOut = assignments.extend({

        // Load a variable to primary register.
        loadVar: function (name, type) {
            if (type === 'B') {
                this.emitLn('CLR.L D0');
            }
            this.move(type, name + '(PC)', 'D0');
            if (type === 'W') {
                this.emitLn('EXT.L D0');
            }
        }
    });

    /**
     * 14.9 A more reasonable solution
     * -------------------------------
     * As we’ve seen, promoting every variable to long while it’s in memory
     * solves the problem, but it can hardly be called efficient, and
     * probably wouldn’t be acceptable even for those of us who claim
     * be unconcerned about efficiency.
     *
     * All we have to do is to make the conversion at the other end...
     * that is, we convert on the way OUT, when the data is stored,...
     * rather than on the way in.
     *
     * Run the same test cases as before
     * ```
     * b a           ; byte a
     * w b           ; word b
     * l c           ; long c
     * B             ; begin
     *     a = a
     *     a = b
     *     a = c
     *     b = a
     *     b = b
     *     b = c
     *     c = a
     *     c = b
     *     c = c
     * .
     * ```
     * You will see that all types of data are converted properly, and there
     * are few if any wasted instructions. Only the byte-to-long conversion
     * uses two instructions where one would do, and we could easily modify
     * `convert` to handle this case, too.
     */
    var aMoreReasonableSolution = assignments.extend({

        // Convert a data item from one type to another.
        convert: function (source, dest) {
            if (source !== dest) {
                if (source === 'B') {
                    this.emitLn('AND.W #$FF, D0');
                }
                if (dest === 'L') {
                    this.emitLn('EXT.L D0');
                }
            }
        },

        // Load a variable to the primary register.
        load: function (name) {
            var type = this.varType(name);
            this.loadVar(name, type);
            return type;                                // <--
        },

        // Store a variable from the primary register.
        store: function (name, type1) {                 // <--
            var type2 = this.varType(name);             // <
            this.convert(type1, type2);                 // <
            this.storeVar(name, type2);                 // <
        },

        // Parse and translate an expression.
        expression: function () {
            return this.load(this.getName());           // <--
        },

        // Parse and translate an assignment statement.
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.store(name, this.expression());        // <--
        }
    });

    /**
     * 14.10 Literal arguments
     * -----------------------
     * We don’t have a proper form of a simple factor yet, because we don’t
     * allow for loading literal constants, only variables. Let’s fix that
     * now.
     * ```
     * <expression> ::= <ident> | <number>
     * <number>     ::= (<digit>)+
     * ```
     *
     * Give it a try, for example
     * ```
     * b a           ; byte a
     * w b           ; word b
     * l c           ; long c
     * B             ; begin
     *     a = 123
     *     b = 12345
     *     c = 123456789
     * .
     * ```
     * You’ll see that it now works for either variables or constants as
     * valid expressions.
     *
     * The code won’t be correct at this point, but the parser should
     * handle expressions of arbitrary complexity.
     */
    var literalArguments = aMoreReasonableSolution.extend({

        // Get a number.
        getNum: function () {
            if (!this.isDigit(this.look)) {
                this.expected('Integer');
            }

            var value = 0;
            while (this.isDigit(this.look)) {
                value = +this.look + 10 * value;
                this.getChar();
            }
            this.skipWhite();
            return value;
        },

        // Load a constant to the primary register.
        loadNum: function (num) {
            var type;

            if (Math.abs(num) <= 127) {
                type = 'B';
            } else if (Math.abs(num) <= 32767) {
                type = 'W';
            } else {
                type = 'L';
            }
            this.loadConst(num, type);
            return type;
        },

        // Load a constant to the primary register.
        loadConst: function (num, type) {
            this.move(type, '#' + num, 'D0');
        },

        // Parse and translate an expression.
        expression: function () {
            if (this.isAlpha(this.look)) {                      // <--
                return this.load(this.getName());
            } else if (this.isDigit(this.look)) {               // <
                return this.loadNum(this.getNum());             // <
            } else {                                            // <
                this.abort('Invalid expression ' + this.look);  // <
            }
        }
    });

    /**
     * 14.11 Additive expressions
     * --------------------------
     * We already have a pattern for dealing with more complex expressions.
     * All we have to do is to make sure that all the procedures called
     * by `expression` (`term`, `factor`, etc.) always return a type
     * identifier.
     * ```
     * <expression> ::= <unary-op> <term> [<addop> <term>]*
     * <term>       ::= <ident> | <number>
     * ```
     *
     * Give it a try, for example
     * ```
     * b a           ; byte a
     * w b           ; word b
     * l c           ; long c
     * B             ; begin
     *     a = -b + 12
     *     b = b + c
     *     c = 25 + a + b
     * .
     * ```
     * Try mixing up variables of different sizes, and also literals.
     * As usual, it’s a good idea to try some erroneous expressions and
     * see how the compiler handles them.
     */
    var additiveExpressions = literalArguments.extend({

        // Parse and translate a term.
        // Copy from previous `expression`.
        term: function () {
            if (this.isAlpha(this.look)) {
                return this.load(this.getName());
            } else if (this.isDigit(this.look)) {
                return this.loadNum(this.getNum());
            } else {
                this.abort('Invalid expression ' + this.look);
            }
        },

        // Parse and translate an expression.
        expression: function () {
            var type;

            if (this.isAddop(this.look)) {
                type = this.unop();
            } else {
                type = this.term();
            }
            while (this.isAddop(this.look)) {
                this.push(type);
                switch (this.look) {
                case '+':
                    type = this.add(type);
                    break;
                case '-':
                    type = this.subtract(type);
                    break;
                }
            }
            return type;
        },

        // Process a term with leading unary operator.
        unop: function () {
            this.clear();
            return 'W';
        },

        // Clear the primary register.
        clear: function () {
            this.emitLn('CLR D0');
        },

        // Push primary onto stack.
        push: function (size) {
            this.move(size, 'D0', '-(SP)');
        },

        // Recognize and translate an add.
        add: function (type1) {
            this.match('+');
            return this.popAdd(type1, this.term());
        },

        // Recognize and translate a subtract.
        subtract: function (type1) {
            this.match('-');
            return this.popSub(type1, this.term());
        },

        // Pop stack into secondary register.
        pop: function (size) {
            this.move(size, '(SP)+', 'D7');
        },

        // Convert a data item from one type to another.
        convert: function (source, dest, register) {        // <--
            if (source !== dest) {
                if (source === 'B') {
                    this.emitLn('AND.W #$FF, ' + register); // <
                }
                if (dest === 'L') {
                    this.emitLn('EXT.L D0' + register);     // <
                }
            }
        },

        // Promote the size of a register value.
        promote: function (type1, type2, register) {
            var type = type1;

            if (type1 !== type2) {
                if (type1 === 'B' || type1 === 'W' && type2 === 'L') {
                    this.convert(type1, type2, register);
                    type = type2;
                }
            }
            return type;
        },

        // Force both arguments to same type.
        sameType: function (type1, type2) {
            type1 = this.promote(type1, type2, 'D7');
            return this.promote(type2, type1, 'D0');
        },

        // Generate code to add primary to the stack.
        popAdd: function (type1, type2) {
            this.pop(type1);
            type2 = this.sameType(type1, type2);
            this.genAdd(type2);
            return type2;
        },

        // Generate code to subtract primary from the stack.
        popSub: function (type1, type2) {
            this.pop(type1);
            type2 = this.sameType(type1, type2);
            this.genSub(type2);
            return type2;
        },

        // Add top of stack to primary.
        genAdd: function (size) {
            this.emitLn('ADD.' + size + ' D7, D0');
        },

        // Subtract primary from top of stack.
        genSub: function (size) {
            this.emitLn('SUB.' + size + ' D7, D0');
            this.emitLn('NEG.' + size + ' D0');
        }
    });

    /**
     * 14.12 Why so many procedures?
     * -----------------------------
     * At this point, you may think I’ve pretty much gone off the deep
     * end in terms of deeply nested procedures.
     */

    /**
     * 14.13 Multiplicative expressions
     * --------------------------------
     * The procedure for dealing with multiplicative operators is much
     * the same. In fact, at the first level, they are almost identical.
     *
     * ```
     * <expression> ::= <unary-op> <term> [<addop> <term>]*
     * <term>       ::= <factor> (<mulop> <factor>)*
     * <factor>     ::= '(' expression ')' | <ident> | <number>
     * ```
     *
     * Give it a try, for example
     * ```
     * b a           ; byte a
     * w b           ; word b
     * l c           ; long c
     * B             ; begin
     *     a = b * (a - 12) / (a * c)
     * .
     * ```
     * The code won’t be correct at this point, but the parser should
     * handle expressions of arbitrary complexity.
     */
    var multiplicativeExpressions = additiveExpressions.extend({

        // Parse and translate a math factor.
        factor: function () {
            var type;

            if (this.look === '(') {
                this.match('(');
                type = this.expression();
                this.match(')');
            } else if (this.isAlpha(this.look)) {
                type = this.load(this.getName());
            } else if (this.isDigit(this.look)) {
                type = this.loadNum(this.getNum());
            } else {
                this.abort('Invalid expression ' + this.look);
            }
            return type;
        },

        // Recognize and translate a multiply.
        multiply: function (type1) {
            this.match('*');
            return this.popMul(type1, this.factor());
        },

        // Recognize and translate a divide.
        divide: function (type1) {
            this.match('/');
            return this.popDiv(type1, this.factor());
        },

        // Parse and translate a math term.
        term: function () {
            var type = this.factor();

            while (this.isMulop(this.look)) {
                this.push(type);
                switch (this.look) {
                case '*':
                    type = this.multiply(type);
                    break;
                case '/':
                    type = this.divide(type);
                    break;
                }
            }
            return type;
        },

        // Generate code to multiply primary to the stack.
        // A dummy version.
        popMul: function (type1, type2) {
            this.emitLn('; popMul(' + type1 + ', ' + type2 + ')');
        },

        // Generate code to devide primary from the stack.
        // A dummy version.
        popDiv: function (type1, type2) {
            this.emitLn('; popDiv(' + type1 + ', ' + type2 + ')');
        }
    });

    /**
     * 14.14 Multiplication
     * --------------------
     * We need to figure out what it will take to generate the right code.
     * This is where things begin to get a little sticky, because the
     * rules are more complex.
     *
     * - The type of the product is typically not the same as that of
     *   the two operands. For the product of two words, we get a
     *   longword result.
     * - The 68000 does not support a 32 x 32 multiply, so a call to a
     *   software routine is needed. This routine will become part of
     *   the run-time library.
     * - It also does not support an 8 x 8 multiply, so all byte
     *   operands must be promoted to words.
     *
     * The actions that we have to take are best shown as follows
     * ```
     *   \ T1         B                 W                 L
     *  T2 \ --------------------------------------------------------
     *      |  Convert D0 to W    Convert D0 to W    Convert D0 to L
     *      |  Convert D7 to W
     *  B   |        MULS               MULS            JSR MUL32
     *      |     Result = W         Result = L         Result = L
     * -----+--------------------------------------------------------
     *      |  Convert D7 to W                       Convert D0 to L
     *  W   |        MULS               MULS            JSR MUL32
     *      |     Result = L         Result = L         Result = L
     * -----+--------------------------------------------------------
     *      |  Convert D7 to L    Convert D7 to L
     *  L   |     JSR MUL32          JSR MUL32          JSR MUL32
     *      |     Result = L         Result = L         Result = L
     * ```
     * There are three things to note
     *
     * 1. We assume a library routine MUL32 which performs a 32 x 32
     *    multiply, leaving a `32-bit` (not `64-bit`) product.
     * 2. The table is symmetric.
     * 3. The product is ALWAYS a longword, except when both operands
     *    are bytes.
     *
     * Go ahead and test the program, for example
     * ```
     * b a           ; byte a
     * w b           ; word b
     * l c           ; long c
     * B             ; begin
     *     a = b * (a - 12) / (a * c)
     * .
     * ```
     * Try all combinations of operand sizes.
     */
    var multiplication = multiplicativeExpressions.extend({

        // Multiply top of stack by primary (word).
        genMult: function () {
            this.emitLn('MULS D7, D0');
        },

        // Multiply top of stack by primary (long).
        genLongMult: function () {
            this.emitLn('JSR MUL32');
        },

        // Generate code to multiply primary by stack.
        popMul: function (type1, type2) {
            var type;

            this.pop(type1);
            type = this.sameType(type1, type2);
            this.convert(type, 'W', 'D7');
            this.convert(type, 'W', 'D0');
            if (type === 'L') {
                this.genLongMult();
            } else {
                this.genMult();
            }
            return type === 'B' ? 'W' : 'L';
        }
    });

    /**
     * 14.15 Division
     * --------------
     * The case of division is not nearly so symmetric.
     * ```
     *   \ T1         B                 W                 L
     *  T2 \ --------------------------------------------------------
     *      |  Convert D0 to W    Convert D0 to W    Convert D0 to L
     *      |  Convert D7 to W    Convert D7 to L
     *  B   |        DIVS               DIVS            JSR DIV32
     *      |     Result = B         Result = W         Result = L
     * -----+--------------------------------------------------------
     *      |  Convert D7 to L    Convert D7 to L    Convert D0 to L
     *  W   |        DIVS               DIVS            JSR DIV32
     *      |     Result = B         Result = W         Result = L
     * -----+--------------------------------------------------------
     *      |  Convert D7 to L    Convert D7 to L
     *  L   |     JSR DIV32          JSR DIV32          JSR DIV32
     *      |     Result = B         Result = W         Result = L
     * ```
     * The implications are as follows
     * - The type of the quotient must always be the same as that of
     *   the dividend. It is independent of the divisor.
     * - In spite of the fact that the CPU supports a longword dividend,
     *   the hardware-provided instruction can only be trusted for byte
     *   and word dividends. For longword dividends, we need another
     *   library routine that can return a long result.
     *
     * Give it a whirl, for example
     * ```
     * b a           ; byte a
     * w b           ; word b
     * l c           ; long c
     * B             ; begin
     *     b = a / b
     *     a = b * (a - 12) / (a * c)
     * .
     * ```
     * At this point you should be able to generate code for any kind of
     * arithmetic expression.
     */
    var division = multiplication.extend({

        // Generate code to divide stack by the primary.
        popDiv: function (type1, type2) {
            this.pop(type1);
            this.convert(type1, 'L', 'D7');
            if (type1 === 'L' || type2 === 'L') {
                this.convert(type2, 'L', 'D0');
                this.genLongDiv();
                return 'L';
            } else {
                this.convert(type2, 'W', 'D0');
                this.genDiv();
                return type1;
            }
        },

        // Divide top of stack by primary (word).
        genDiv: function () {
            this.emitLn('DIVS D0, D7');
            this.move('W', 'D7', 'D0');
        },

        // Divide top of stack by primary (long).
        genLongDiv: function () {
            this.emitLn('JSR DIV32');
        }
    });

    /**
     * 14.16 Beginning to wind down
     * ----------------------------
     * In the general case, we can think of every single operator as being
     * handled by a different procedure, depending upon the type of the
     * two operands. In Pascal, the equivalent operation would involve
     * nested Case statements. Some of the called procedures could then be
     * simple error routines, while others could effect whatever kind of
     * conversion we need. As more types are added, the number of procedures
     * goes up by a square-law rule, but that’s still not an unreasonably
     * large number of procedures.
     *
     * What we’ve done here is to collapse such a jump table into far fewer
     * procedures, simply by making use of symmetry and other simplifying
     * rules.
     */

    /**
     * 14.17 To coerce or not coerce
     * -----------------------------
     * It appears that TINY and KISS will probably NOT be strongly typed
     * languages, because of the automatic mixing and conversion of about
     * any type. Which brings up the next issue:
     *
     * Is this really what we want to do?
     *
     * The answer depends on what kind of language you want, and the way
     * you’d like it to behave.
     * What we have not addressed is the issue of when to allow and when
     * to deny the use of operations involving different data types.
     * In other words, what should be the SEMANTICS of our compiler?
     * Do we want automatic type conversion for all cases, for some cases,
     * or not at all?
     *
     * Let’s pause here to think about this a bit more. To do so, it will
     * help to look at a bit of history.
     *
     * - **FORTRAN II** supported only two simple data types: Integer and
     *   Real.
     * - This was changed in **FORTRAN IV** to support "mixed-mode"
     *   arithmetic.
     * - **C** is also a weakly typed language.
     * - The ultimate language in the direction of automatic type
     *   conversion is **PL/I**.
     * - **Pascal**, on the other hand, is a language which is "strongly
     *   typed".
     * - The ultimate in a strongly-typed language is **Ada**, which allows
     *   NO implicit type conversions at all, and also will not allow
     *   mixed-mode arithmetic.
     *
     * So what should we do in TINY and KISS? TINY will support only the
     * types Char and Integer, and we’ll use the C trick of promoting Chars
     * to Integers internally.
     * KISS, on the other hand, will support the type Long.
     * Should it support both signed and unsigned arithmetic?
     */

    /**
     * 14.18 Conclusion
     * ----------------
     * That wraps up our session on type conversions.
     */

    return {

        // 14.3
        theSymbolTable: theSymbolTable,

        // 14.4
        addingEntries: addingEntries,

        // 14.5
        // <program>     ::= <declaration> '.'
        // <declaration> ::= (<data decl>)*
        // <data decl>   ::= VAR <identifier>
        allocatingStorage: allocatingStorage,

        // 14.6
        // <data decl>   ::= <typename> <identifier>
        // <typename>    ::= BYTE | WORD | LONG
        declaringTypes: declaringTypes,

        // 14.7
        // <program>     ::= <declaration> BEGIN <block> '.'
        // <declaration> ::= (<data decl>)*
        // <data decl>   ::= VAR <identifier>
        // <block>       ::= (<assignment>)*
        // <assignment>  ::= <ident> = <expression>
        // <expression>  ::= <ident>
        assignments: assignments,

        // 14.8
        theCowardsWayOut: theCowardsWayOut,

        // 14.9
        aMoreReasonableSolution: aMoreReasonableSolution,

        // 14.10
        // <expression> ::= <ident> | <number>
        // <number>     ::= (<digit>)+
        literalArguments: literalArguments,

        // 14.11
        // <expression> ::= <unary-op> <term> [<addop> <term>]*
        // <term>       ::= <ident> | <number>
        additiveExpressions: additiveExpressions,

        // 14.13
        // <expression> ::= <unary-op> <term> [<addop> <term>]*
        // <term>       ::= <factor> [<mulop> <factor>]*
        // <factor>     ::= '(' expression ')' | <ident> | <number>
        multiplicativeExpressions: multiplicativeExpressions,

        // 14.14
        multiplication: multiplication,

        // 14.15
        division: division
    };
});
