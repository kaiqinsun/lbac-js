/*global define*/

/**
 * Chapter 15 Back to The Future
 * =============================
 */

define(['./object', 'io'], function (object, io) {
    'use strict';

    /**
     * 15.1 Introduction
     * -----------------
     *
     * 15.2 New starts, old directions
     * -------------------------------
     *
     * 15.3 Starting over?
     * -------------------
     */

    /**
     * 15.4 The input unit
     * -------------------
     */
    //{
    var input = {
        look: '',   // lookahead character

        // Read new character from input stream.
        getChar: function () {
            this.look = io.read();
        },

        // Unit initialization.
        init: function () {
            this.getChar();
        }
    };

    // A test program.
    var theInputUnit = {

        // Main program.
        main: function () {
            input.init();
            io.writeLn(input.look);
        }
    };
    //}

    /**
     * 15.5 The output unit
     * --------------------
     */
    //{
    var output = (function () {
        var TAB = '\t';

        return {

            // Emit an instruction.
            emit: function (str) {
                io.write(TAB, str);
            },

            // Emit an instruction, followed by a newline.
            emitLn: function (str) {
                this.emit(str);
                io.writeLn();
            }
        };
    }());

    // A test program.
    var theOutputUnit = {

        // Main program.
        main: function () {
            io.writeLn('MAIN:');
            output.emitLn('Hello, world!');
        }
    };
    //}

    /**
     * 15.6 The error unit
     * -------------------
     *
     */
    //{
    var errors = {

        // Write error message and halt.
        error: function (str) {
            io.writeLn('Error: ', str, '.');
            io.halt();
        },

        // Write "<something> expected".
        expected: function (str) {
            this.error(str + ' expected');
        }
    };

    // A test program.
    var theErrorUnit = {

        // Main program.
        main: function () {
            errors.expected('Integer');
        }
    };
    //}

    /**
     * 15.7 Scanning and parsing
     * -------------------------
     * ```
     * <variable>  ::= <alpha>
     * <constant> ::= <digit>
     * ```
     * This code will recognize all sentences of the form
     * ```
     * x=0+y
     * ```
     * where *x* and *y* can be any single-character variable names, and
     * *0* any digit. The code will reject all other sentences, and give
     * a meaningful error message.
     */
    //{
    var scanner1 = object.extend({

        // Recognize an alpha character.
        isAlpha: function (c) {
            return (/[A-Z]/i).test(c);
        },

        // Recognize a numeric character.
        isDigit: function (c) {
            return (/\d/).test(c);
        },

        // Recognize an alphanumeric character.
        isAlNum: function (c) {
            return this.isAlpha(c) || this.isDigit(c);
        },

        // Recognize an addition operator.
        isAddop: function (c) {
            return c === '+' || c === '-';
        },

        // Recognize a multiplication operator.
        isMulop: function (c) {
            return c === '*' || c === '/';
        },

        // Match one character.
        match: function (x) {
            if (input.look !== x) {
                errors.expected('"' + x + '"');
            }

            input.getChar();
        },

        // Get an identifier.
        getName: function () {
            if (!this.isAlpha(input.look)) {
                errors.expected('Name');
            }

            var name = input.look.toUpperCase();
            input.getChar();
            return name;
        },

        // Get a number.
        getNumber: function () {
            if (!this.isDigit(input.look)) {
                errors.expected('Integer');
            }

            var num = input.look;
            input.getChar();
            return num;
        }
    });

    // A test program.
    var scanningAndParsing = {

        // Main program.
        main: function () {
            input.init();
            io.write(scanner1.getName());
            scanner1.match('=');
            io.write(scanner1.getNumber());
            scanner1.match('+');
            io.writeLn(scanner1.getName());
        }
    };
    //}

    /**
     * 15.8 The scanner unit
     * ---------------------
     * ```
     * <variable>  ::= <alpha> [<alpha> | <digit>]+
     * <constant> ::= [<digit>]+
     * ```
     * This code will recognize all sentences of the form
     * ```
     * variable1=123+variable2
     * ```
     */
    //{
    var scanner = scanner1.extend({

        // Get an identifier.
        getName: function () {
            if (!this.isAlpha(input.look)) {
                errors.expected('Name');
            }

            var name = '';
            while (this.isAlNum(input.look)) {
                name += input.look.toUpperCase();
                input.getChar();
            }
            return name;
        },

        // Get a number.
        getNumber: function () {
            if (!this.isDigit(input.look)) {
                errors.expected('Integer');
            }

            var num = '';
            while (this.isDigit(input.look)) {
                num += input.look;
                input.getChar();
            }
            return num;
        }
    });

    // A test program.
    var theScannerUnit = {

        // Main program.
        main: function () {
            input.init();
            io.write(scanner.getName());
            scanner.match('=');
            io.write(scanner.getNumber());
            scanner.match('+');
            io.writeLn(scanner.getName());
        }
    };
    //}

    /**
     * 15.9 Decisions, decisions
     * -------------------------
     *
     * ```
     * <constant> ::= [<digit>]+
     * ```
     */
    //{
    var scannerD = scanner.extend({

        // Get a number.
        getNumber: function () {
            if (!this.isDigit(input.look)) {
                errors.expected('Integer');
            }

            var num = 0;                            // <--
            while (this.isDigit(input.look)) {
                num = +input.look + 10 * num;       // <
                input.getChar();
            }
            return num;
        }
    });

    var decisionsDecisions = {

        // Main program.
        main: function () {
            input.init();
            io.write(scannerD.getName());
            scannerD.match('=');
            io.write(scannerD.getNumber());
            scannerD.match('+');
            io.writeLn(scannerD.getName());
        }
    };
    //}

    /**
     * 15.10 Parsing
     * -------------
     *
     * ```
     * <factor> ::= <variable> | <constant>
     * ```
     */
    //{
    var parser = object.extend({

        // Parse and translate a factor.
        factor: function () {
            if (scannerD.isDigit(input.look)) {
                codeGen.loadConstant(scannerD.getNumber());
            } else if (scannerD.isAlpha(input.look)) {
                codeGen.loadVariable(scannerD.getName());
            } else {
                errors.error('Unrecognized character ' + input.look);
            }
        }
    });

    var codeGen = object.extend({

        // Load the primary register with a constant.
        loadConstant: function (num) {
            output.emitLn('MOVE #' + num + ', D0');
        },

        // Load a variable to the primary register.
        loadVariable: function (name) {
            output.emitLn('MOVE ' + name + '(PC), D0');
        }
    });

    // A test program.
    var parsing = {

        // Main program.
        main: function () {
            input.init();
            parser.factor();
        }
    };
    //}

    /**
     * 15.11 References
     * ----------------
     * 1. Crenshaw, J. W., "Object-Oriented Design of Assemblers and
     *    Compilers", *Proc. Software Development* ’91 Conference, Miller
     *    Freeman, San Francisco, CA, Feb. 1991, pp. 143-155.
     * 2. Crenshaw, J.W., "A Perfect Marriage", *Computer Language*,
     *    **8**(6), Jun. 1991, pp. 44-55.
     * 3. Crenshaw, J.W., "Syntax-Driven Object-Oriented Design", *Proc.
     *    1991 Embedded Systems Conference*, Miller Freeman, San
     *    Francisco, CA, Sep. 1991, pp. 45-60.
     */


    return {

        // 15.4
        theInputUnit: theInputUnit,

        // 15.5
        theOutputUnit: theOutputUnit,

        // 15.6
        theErrorUnit: theErrorUnit,

        // 15.7
        // <variable>  ::= <alpha>
        // <constant> ::= <digit>
        scanningAndParsing: scanningAndParsing,

        // 15.8
        // <variable>  ::= <alpha> [<alpha> | <digit>]+
        // <constant> ::= [<digit>]+
        theScannerUnit: theScannerUnit,

        // 15.9
        // <constant> ::= [<digit>]+
        decisionsDecisions: decisionsDecisions,

        // 15.10
        // <factor> ::= <ident> | <number>
        parsing: parsing,

        // All units
        input: input,
        output: output,
        errors: errors,
        scanner: scannerD,
        parser: parser,
        codeGen: codeGen
    };
});
