/*global define*/

/**
 * Chapter 12 Miscellany
 * ======================
 */

define(['./11.6-tiny-1.1', 'io'], function (tiny11, io) {
    'use strict';

    /**
     * 12.1 Introduction
     * ------------------
     * This installment is another one of those excursions into side alleys
     * that don’t seem to fit into the mainstream of this tutorial series.
     * Perhaps you’ve wondered about **semicolons** and **comments**, and
     * wondered how things would change if we had to deal with them.
     */

    /**
     * 12.2 Semicolons
     * ----------------
     * Ever since the introduction of Algol, semicolons have been a part of
     * almost every modern language.
     *
     * To understand the role of the semicolon, you have to look at a little
     * history. When the fathers of Algol introduced that language, they
     * wanted to get away from *line-oriented* programs like FORTRAN and
     * BASIC, and allow for *free-form* input. This included the possibility
     * of stringing multiple statements on a single line, as in
     * ```
     * a = b ; c = d ; e = e + 1;
     * ```
     * The same line, without the semicolons, just looks "funny":
     * ```
     * a = b c= d e = e + 1
     * ```
     * This is the major, perhaps ONLY, reason for semicolons: to keep
     * programs from looking funny.
     * Howerver, the TINY compiler is perfectly happy to parse the most
     * complicated statement, spread over any number of lines,
     * **without** semicolons.
     */

    /**
     * 12.3 Syntactic sugar
     * ---------------------
     * This whole discussion brings up the issue of "syntactic sugar"...
     * constructs that are added to a language, not because they are needed,
     * but because they help make the programs look right to the programmer.
     *
     * The best example of useful sugar is the semicolon itself.
     * Consider the code fragment:
     * ```
     * a = 1 + (2 * b + c)   b...
     * ```
     * Since there is no operator connecting the token `b` with the rest of
     * the statement, the compiler will conclude that the expression ends
     * with the `)`, and the `b` is the beginning of a new statement.
     * But suppose I have simply left out the intended operator, and I
     * really want to say:
     * ```
     * a = 1 + (2 * b + c) * b...
     * ```
     * In this case the compiler will get an error, all right, but it won’t
     * be very meaningful since it will be expecting an `=` sign after the
     * `b` that really shouldn’t be there.
     *
     * If, on the other hand, I include a semicolon after the `b`, THEN
     * there can be no doubt where I intend the statement to end.
     * Syntactic sugar, then, can serve a very useful purpose by providing
     * some additional insurance that we remain on track.
     */

    /**
     * 12.4 Dealing with semicolons
     * -----------------------------
     * There are two distinct ways in which semicolons are used in popular
     * languages.
     * In **Pascal**, semicolon is a statement *SEPARATOR*.
     * No semicolon is required after the last statement in a block.
     * ```
     * <block> ::= <statement> (';' <statement>)*
     * <statement> ::= <assignment> | <if> | <while> ... | null
     * ```
     * In **C** and **Ada**, semicolon is a statement *TERMINATOR*,
     * and follows all statements
     * ```
     * <block> ::= (<statement> ';')*
     * ```
     *
     * ### 12.4.1 The C version ###
     * Let’s take the last case first, since it’s simpler.
     * ```
     * <program>          ::= PROGRAM';' <top-level decls> BEGIN END '.'
     * <top-level decls>  ::= (<data declaration> ';')*
     * <data declaration> ::= VAR <var-list>
     * <block>            ::= (<statement> ';')*
     * <statement>        ::= <assignment> | <if> | <while> ... | null
     * ```
     * Try to write a program in the editor, for example
     * ```
     * program;
     * var num, fact;
     * var count;
     * begin
     *     fact = 1; count = 1;
     *     read(num);
     *     while count <= num
     *         fact = fact * count;
     *         count = count + 1;
     *     endwhile;
     *     write(fact);
     * end
     * .
     * ```
     */
    var theCVersion = tiny11.object.extend({

        // Match a semicolon.
        semi: function () {
            this.matchString(';');
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
                case 'R':
                    this.doRead();
                    break;
                case 'W':
                    this.doWrite();
                    break;
                case 'x':                           // <--
                    this.assignment();
                    break;
                }
                this.semi();                        // <--
                this.scan();
            }
        },

        // Parse and translate global declarations.
        topDecls: function () {
            this.scan();
            while (this.token === 'v') {
                this.alloc();
                while (this.token === ',') {
                    this.alloc();
                }
                this.semi();                        // <--
                this.scan();
            }
        },

        // Main program.
        main: function () {
            this.init();
            this.matchString('PROGRAM');
            this.semi();                            // <--
            this.header();
            this.topDecls();
            this.matchString('BEGIN');
            this.prolog();
            this.block();
            this.matchString('END');
            this.epilog();
        }
    });

    /**
     * ### 12.4.2 The Pascal version ###
     * The Pascal version is a little trickier, but it still only requires
     * minor changes, and those only to procedure Block.
     * ```
     * <block> ::= <statement> (';' <statement>)*
     * <statement> ::= <assignment> | <if> | <while> ... | null
     * ```
     *
     * Try some code, for example
     * ```
     * program;
     * var num, fact;
     * var count;
     * begin
     *     fact = 1; count = 1;
     *     read(num);
     *     while count <= num
     *         fact = fact * count;
     *         count = count + 1
     *     endwhile;
     *     write(fact);
     *     if fact > 100
     *         fact = 100
     *     endif
     * end
     * .
     * ```
     * Note that the semicolon for statement at each end of block,
     * `count = count + 1` within **while**, `fact = 100` whithin **if**,
     * or `if...endif` in **main** block is now optional.
     */
    var thePascalVersion = theCVersion.extend({

        // Recognize and translate a single statement.
        statement: function () {
            this.scan();
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
            case 'x':
                this.assignment();
                break;
            }
        },

        // Parse and translate a block of statement.
        block: function () {
            this.statement();
            while (this.token === ';') {
                this.next();
                this.statement();
            }
        }
    });

    /**
     * 12.5 A compromise
     * ------------------
     * Make all the semicolon optional
     * ```
     * <program>          ::= PROGRAM [';'] <top-level decls> BEGIN END '.'
     * <top-level decls>  ::= (<data declaration> [';'])*
     * <data declaration> ::= VAR <var-list>
     * <block>            ::= (<statement> [';'])*
     * <statement>        ::= <assignment> | <if> | <while> ... | null
     * ```
     * We have TINY Version 1.2.
     */
    var aCompromise = theCVersion.extend({

        // Match a semicolon.
        semi: function () {
            if (this.token === ';') {               // <--
                this.next();                        // <
            }
        }
    });

    /**
     * 12.6 Comments
     * -------------
     * At one extreme, comments can be intercepted almost the instant
     * they enter the compiler. At the other, we can treat them as
     * lexical elements.
     * Things tend to get interesting when you consider things like
     * comment delimiters contained in quoted strings.
     */

    /**
     * 12.7 Single character delimiters
     * --------------------------------
     * Here’s an example. Suppose we assume the Turbo Pascal standard and
     * use curly braces for comments.
     * In this case we have single-character delimiters, so our parsing is
     * a little easier.
     *
     * ### 12.7.1 Strip the comments out ###
     * One approach is to strip the comments out the instant we encounter
     * them in the input stream; that is, right in procedure `getChar`.
     *
     * Give it a try, for example
     * ```
     * program
     * var num, ans
     * begin
     *     read(num)
     *     { Calculate the absolute value of num }
     *     if num < 0
     *         ans = -num
     *     else
     *         ans = num
     *     endif
     * end
     * .
     * ```
     * You’ll find that you can, indeed, bury comments
     * anywhere you like. The comments never even get into the parser.
     *
     * Problems: first, this version doesn’t care WHERE you put comments.
     * Try to replace `ans = num` by
     * `a{ in the middle of a name }ns = nu{again}m`.
     * Second, the rest of the parser can’t receive a `{` character, you
     * will not be allowed to put one in a quoted string.
     */
    var stripTheCommentsOut = aCompromise.extend({

        // Read new character from input.
        // Renamed from `getChar` (temporarily).
        getCharX: function () {
            this.look = io.read();
        },

        // Skip a comment field.
        skipComment: function () {
            while (this.look !== '}') {
                this.getCharX();
            }
            this.getCharX();
        },

        // Get character from input stream.
        // Skip any comments.
        getChar: function () {
            this.getCharX();
            if (this.look === '{') {
                this.skipComment();
            }
        }

    });

    /**
     * ### 12.7.2 The conventional treatment ###
     * If you want to the conventional treatment, we need to move the
     * interception point downstream a little further.
     *
     * Try again
     * ```
     * program
     * var num, ans
     * var{The comment is now treated as whitespace}test
     * begin
     *     read(num)
     *     { Calculate the absolute value of num. }
     *     if num < 0
     *         ans = -num
     *     else
     *         ans = num
     *     endif
     * end
     * .
     * ```
     * and also try to replace `ans = num` by
     * `a{ in the middle of a name }ns = nu{again}m`. Does it still work?
     * Now the comments are treated as whitespace.
     */
    var theConventionalTreatment = aCompromise.extend({

        // Skip a comment field.
        skipComment: function () {
            while (this.look !== '}') {
                this.getChar();                     // <-- original `getChar`
            }
            this.getChar();                         // <
        },

        // Recognize white space.
        isWhite: function (c) {
            return c === ' ' || c === this.TAB ||
                   c === this.CR || c === this.LF ||
                   c === '{';                       // <--
        },

        // Skip over leading white space.
        skipWhite: function () {
            while (this.isWhite(this.look)) {
                if (this.look === '{') {            // <--
                    this.skipComment();             // <
                } else {
                    this.getChar();
                }
            }
        }
    });

    /**
     * ### 12.7.3 Nested comments ###
     * There’s one last item to deal with: Nested comments.
     * Some programmers like the idea of nesting comments, since it allows
     * you to comment out code during debugging.
     * Give it a try, for example
     * ```
     * program
     * var num, ans
     * begin
     * { Comment out the code, with a nested comment.
     *     read(num)
     *     { Calculate the absolute value of num. }
     *     if num < 0
     *         ans = -num
     *     else
     *         ans = num
     *     endif
     * }
     * end
     * .
     * ```
     * That does it. As sophisticated a comment-handler as you’ll ever need.
     */
    var nestedComments = theConventionalTreatment.extend({

        // Skip a comment field.
        skipComment: function () {
            while (this.look !== '}') {
                this.getChar();
                if (this.look === '{') {            // <--
                    this.skipComment();             // <
                }
            }
            this.getChar();
        }
    });

    /**
     * 12.8 Multi character delimiters
     * -------------------------------
     * What about the cases such as C or standard Pascal, where two
     * characters are required?
     *
     * The easiest thing to do is to intercept the left delimiter back at
     * the `getChar` stage. We can *tokenize* it right there, replacing it
     * by a single character.
     *
     * Give it a try, for example
     * ```
     * /* This is a program to demonstrate
     *    the C comment.*/
    /* program
     * var num, ans
     * begin
     *     read(num)
     *     /* Calculate the absolute value of num.*/
    /*     if num < 0
     *         ans = -num
     *     else
     *         ans = num
     *     endif
     * end
     * .
     * ```
     */
    var multiCharacterDelimiters = theConventionalTreatment.extend({

        tempChar: ' ',

        // Read new character from input.
        // Renamed from `getChar` (temporarily).
        getCharX: function () {
            this.look = io.read();
        },

        // Read new character. Intercept `/*`.
        getChar: function () {
            if (this.tempChar !== ' ') {
                this.look = this.tempChar;
                this.tempChar = ' ';
            } else {
                this.getCharX();
                if (this.look === '/') {
                    this.tempChar = io.read();
                    if (this.tempChar === '*') {
                        this.look = '{';
                        this.tempChar = ' ';
                    }
                }
            }
        },

        // Skip a comment field. Until `*/`.
        skipComment: function () {
            do {
                do {
                    this.getCharX();
                } while (this.look !== '*');
                this.getCharX();
            } while (this.look !== '/');
            this.getCharX();
        }
    });

    /**
     * 12.9 One sided comments
     * ----------------------
     * The one-sided comments are like those in assembler language or
     * in Ada, that are terminated by the end of the line.
     *
     * Give it a try, for example
     * ```
     * ; This is a program to demonstrate
     * ; the comment of assembly language.
     * program
     * var num, ans
     * begin
     *     read(num)
     *     ; Calculate the absolute value of num.
     *     if num < 0
     *         ans = -num   ; negate the value
     *     else
     *         ans = num
     *     endif
     * end
     * .
     * ```
     */
    var oneSidedComments = aCompromise.extend({

        // Skip a comment field.
        skipComment: function () {
            while (this.look !== this.LF) {         // <--
                this.getChar();
            }
            this.getChar();
        },

        // Recognize white space.
        isWhite: function (c) {
            return c === ' ' || c === this.TAB ||
                   c === this.CR || c === this.LF ||
                   c === ';';                       // <--
        },

        // Skip over leading white space.
        skipWhite: function () {
            while (this.isWhite(this.look)) {
                if (this.look === ';') {            // <-- asm comment
                    this.skipComment();
                } else {
                    this.getChar();
                }
            }
        }
    });

    /**
     * 12.10 Conclusion
     * ----------------
     * At this point we now have the ability to deal with both comments
     * and semicolons, as well as other kinds of syntactic sugar.
     *
     * The conventions we we use in KISS/TINY will be
     *
     * 1. Semicolons are *TERMINATORS*, not separators
     * 2. Semicolons are *OPTIONAL*
     * 3. Comments are delimited by *curly braces*
     * 4. Comments *MAY* be nested
     *
     * which is the version in section 12.7.3.
     */


    return {

        // 12.4.1
        // <program>          ::= PROGRAM';' <top-level decls> BEGIN END '.'
        // <top-level decls>  ::= (<data declaration> ';')*
        // <data declaration> ::= VAR <var-list>
        // <block>            ::= (<statement> ';')*
        // <statement>        ::= <assignment> | <if> | <while> ... | null
        theCVersion: theCVersion,

        // 12.4.2
        // <block> ::= <statement> (';' <statement>)*
        // <statement> ::= <assignment> | <if> | <while> ... | null
        thePascalVersion: thePascalVersion,

        // 12.5
        // <program>          ::= PROGRAM [';'] <top-level decls> BEGIN END '.'
        // <top-level decls>  ::= (<data declaration> [';'])*
        // <data declaration> ::= VAR <var-list>
        // <block>            ::= (<statement> [';'])*
        // <statement>        ::= <assignment> | <if> | <while> ... | null
        aCompromise: aCompromise,

        // 12.7.1
        stripTheCommentsOut: stripTheCommentsOut,

        // 12.7.2
        theConventionalTreatment: theConventionalTreatment,

        // 12.7.3
        nestedComments: nestedComments,

        // 12.8
        multiCharacterDelimiters: multiCharacterDelimiters,

        // 12.9
        oneSidedComments: oneSidedComments
    };
});
