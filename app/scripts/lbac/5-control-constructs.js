/*global define*/
/*jshint camelcase: false*/

/**
 * Chapter 5 Control Constructs
 * ============================
 */

define(['./1.2-cradle', 'io'], function (cradle, io) {
    'use strict';

    var oneStatement,               // 5.2.1
        moreThanOneStatement,       // 5.2.2
        someGroundwork,             // 5.3
        theIfStatement,             // 5.4
        addTheElseClause,           // 5.4.2
        theWhileStatement,          // 5.5
        theLoopStatement,           // 5.6
        theRepeatUntilStatement,    // 5.7
        theForLoop,                 // 5.8
        theDoStatement,             // 5.9
        theBreakStatement;          // 5.10

    /**
     * 5.1 Introduction
     * ----------------
     */

    /**
     * 5.2 The plan
     * -------------
     */

    /**
     * ### 5.2.1 One statement ###
     * **In BNF notation**
     * ```
     * <program> ::= <statement>
     * <statement> ::= <other>
     * ```
     * code example: `a`
     */
    oneStatement = cradle.extend({

        // Recognize and translate an "Other"
        // an anonymous statement serve as a place-holder
        other: function () {
            this.emitLn('<block ' + this.getName() + '>');
        },

        // Main function
        main: function () {
            this.init();
            this.other();
        }
    });

    /**
     * ### 5.2.2 More than one statement ###
     * **In BNF notation**
     * ```
     * <program> ::= <block> END
     * <block> ::= [<statement>]*
     * ```
     * code example: `abc`
     */
    moreThanOneStatement = oneStatement.extend({

        // Recognize and translate a statement block
        block: function () {
            while (this.look !== 'e') {
                this.other();
            }
        },

        // Parse and translate a program
        doProgram: function () {
            this.block();
            if (this.look !== 'e') {
                this.expected('End');
            }
            this.emitLn('END');
        },

        // Main function
        main: function () {
            this.init();
            this.doProgram();
        }
    });

    /**
     * 5.3 Some groundwork
     * --------------------
     * Prepare two routines
     *
     * - `newLable` to generate label **Lnn**,
     *    where nn is a label number starting from zero.
     * - `postLabel` to output the labels at the proper place.
     */
    someGroundwork = moreThanOneStatement.extend({

        lCount: 0,  // label number

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

        // Initialize
        init: function () {
            this.lCount = 0;
            this.getChar();
        }
    });

    /**
     * 5.4 The IF statement
     * ---------------------
     * **In BNF**
     * ```
     * <if> ::= IF <condition> <block> ENDIF
     * ```
     * Output should be:
     * ```
     *      <condition>
     *      BEQ L1      # branch if false
     *      <block>
     * L1:
     * ```
     * **Syntax-directed translation**
     * ```
     * SYNTAX           ACTIONS
     * -------------------------------------------
     * IF
     * <condition>    { condition();
     *                  L = newLabel();
     *                  emit(Branch False to L); }
     * <block>
     * ENDIF          { postLabel(L) }
     * -------------------------------------------
     * ```
     * On the **68000** the condition flags are set
     * whenever any data is moved or calculated.
     * If the data is a 0000 (corresponding to a false condition),
     * the zero flag will be set.
     * The code for **branch on zero** is `BEQ`.
     * So for our purposes here,
     * ```
     * BEQ <=> Branch if false
     * BNE <=> Branch if true
     * ```
     * It’s the nature of the beast that most of the branches we see
     * will be `BEQ`’s... we’ll be branching *AROUND* the code
     * that’s supposed to be executed when the condition is true.
     *
     * For the **implementation**, as usual,
     * we will be using our single-character approach,
     * with the character `i` for `IF`, and `e` for `ENDIF`
     * (as well as `END` ... that dual nature causes no confusion).
     *
     * code example: `aibcedhe`,
     *
     * which stands for
     * ```
     * <block A>                a
     * IF <condition>           i
     *     <block B>            b
     *     <block C>            c
     * ENDIF                    e
     * <block D>                d
     * <block H>                h
     * END                      e
     * ```
     */
    theIfStatement = someGroundwork.extend({

        // Parse and translate a boolean condition
        // This version is a dummy
        condition: function () {
            this.emitLn('<condition>');
        },

        // Recognize and translate an IF constructor
        doIf: function () {
            var label;
            this.match('i');
            label = this.newLabel();
            this.condition();
            this.emitLn('BEQ ' + label);
            this.block();
            this.match('e');
            this.postLabel(label);
        },

        // Recognize and translate a statement block
        block: function () {
            while (this.look !== 'e') {
                switch (this.look) {
                case 'i':
                    this.doIf();
                    break;
                default:
                    this.other();
                }
            }
        }
    });

    /**
     * ### 5.4.2 Add the ELSE clause ###
     * **BNF of the `IF` statement**
     * ```
     * <if> ::= IF <condition> <block> [ELSE <block>] ENDIF
     * ```
     * **Output** should be
     * ```
     *      <condition>
     *      BEQ L1      # branch if false
     *      <block>
     *      BRA L2      # unconditional branch
     * L1:
     *      <block>
     * L2:
     * ```
     * **Syntax-directed translation**
     * ```
     *   SYNTAX           ACTIONS
     *   -------------------------------------------
     *   IF
     *   <condition>    { condition();
     *                    L1 = newLabel();
     *                    L2 = newLabel();
     *                    emit(BEQ L1); }
     *   <block>
     *   ELSE           { emit(BRA L2);
     *                    postLabel(L1); }
     *   <block>
     *   ENDIF          { postLabel(L2); }
     *   -------------------------------------------
     * ```
     * Try something like `aiblcede`
     *
     * which stands for
     * ```
     * <block A>            a
     * IF <condition>       i
     *     <block B>        b
     * ELSE                 l
     *     <block C>        c
     * ENDIF                e
     * <block D>            d
     * END                  e
     * ```
     */
    addTheElseClause = theIfStatement.extend({

        // Recognize and translate an IF constructor
        doIf: function () {
            var label_1, label_2;
            this.match('i');
            this.condition();
            label_1 = this.newLabel();
            label_2 = label_1;
            this.emitLn('BEQ ' + label_1);
            this.block();

            if (this.look === 'l') {
                this.match('l');
                label_2 = this.newLabel();
                this.emitLn('BRA ' + label_2);
                this.postLabel(label_1);
                this.block();
            }

            this.match('e');
            this.postLabel(label_2);
        },

        // Recognize and translate a statement block
        block: function () {
            while (this.look !== 'e' && this.look !== 'l') {  // <--
                switch (this.look) {
                case 'i':
                    this.doIf();
                    break;
                default:
                    this.other();
                }
            }
        }
    });

    /**
     * 5.5 The WHILE statement
     * ------------------------
     * **BNF of the `WHILE` statement**
     * ```
     * <while> ::= WHILE <condition> <block> ENDWHILE
     * ```
     * Output should be:
     * ```
     * L1:  <condition>
     *      BEQ L2
     *      <block>
     *      BRA L1
     * L2:
     * ```
     * **Syntax-directed translation**
     * ```
     * SYNTAX           ACTIONS
     * -------------------------------------------
     * WHILE          { L1 = newLabel;
     *                  postLabel(L1) }
     * <condition>    { emit(BEQ L2) }
     * <block>
     * ENDWHILE       { emit(BRA L1);
     *                  PostLabel(L2) }
     * ```
     * OK, try the **new program**, such as `awbece` which stands for
     * ```
     * <block A>                a
     * WHILE <condition>        w
     *     <block B>            b
     * ENDWHILE                 e
     * <block C>                c
     * END                      e
     * ```
     * Note that this time, the <condition> code is *INSIDE* the upper label,
     * which is just where we wanted it.
     *
     * Try some **nested loops**, for example `awbwcedefe` which stands for
     * ```
     * <block A>                a
     * WHILE <condition>        w
     *     <block B>            b
     *     WHILE <condition>    w
     *         <block C>        c
     *     ENDWHILE             e
     *     <block D>            d
     * ENDWHILE                 e
     * <block F>                f
     * END                      e
     * ```
     * Try some **loops within `IF`’s**, for example`aibwcedlfege`
     * which stands for
     * ```
     * <block A>                a
     * IF <condition>           i
     *     <block B>            b
     *     WHILE <condition>    w
     *         <block C>        c
     *     ENDWHILE             e
     *     <block D>            d
     * ELSE                     l
     *     <block F>            f
     * ENDIF                    e
     * <block G>                g
     * END                      e
     * ```
     * and some **`IF`’s within loops**, for example `awbicedefe`
     * which stands for
     * ```
     * <block A>                a
     * WHILE <condition>        w
     *     <block B>            b
     *     IF <condition>       i
     *         <block C>        c
     *     ENDIF                e
     *     <block D>            d
     * ENDWHILE                 e
     * <block F>                f
     * END                      e
     * ```
     * If you get a bit confused as to what you should type,
     * don’t be discouraged: you write bugs in other languages, too, don’t you?
     */
    theWhileStatement = addTheElseClause.extend({

        // Parse and translate a WHILE statement
        doWhile: function () {
            var label_1, label_2;
            this.match('w');
            label_1 = this.newLabel();
            label_2 = this.newLabel();
            this.postLabel(label_1);
            this.condition();
            this.emitLn('BEQ ' + label_2);
            this.block();
            this.match('e');
            this.emitLn('BRA ' + label_1);
            this.postLabel(label_2);
        },

        // Recognize and translate a statement block
        block: function () {
            while (this.look !== 'e' && this.look !== 'l') {
                switch (this.look) {
                case 'i':
                    this.doIf();
                    break;
                case 'w':   // <--
                    this.doWhile();
                    break;
                default:
                    this.other();
                }
            }
        }
    });

    /**
     * 5.6 The LOOP statement
     * -----------------------
     * **BNF** of the `LOOP` statement
     * ```
     * <loop> ::= LOOP <block> ENDLOOP
     * ```
     * **Output** should be:
     * ```
     * L1:
     *      <block>
     *      BRA L1
     * ```
     * **Syntax-directed translation**
     * ```
     * SYNTAX           ACTIONS
     * -------------------------------------------
     * LOOP           { L = newLabel();
     *                  postLabel(L) }
     * <block>
     * ENDLOOP        { emit(BRA L) }
     * ```
     * Code example `apbece`
     *
     * which stands for
     * ```
     * <block A>                a
     * LOOP                     p
     *     <block B>            b
     * ENDLOOP                  e
     * <block C>                c
     * END                      e
     * ```
     */
    theLoopStatement = theWhileStatement.extend({

        // Parse and translate a LOOP statement
        doLoop: function () {
            var label;
            this.match('p');
            label = this.newLabel();
            this.postLabel(label);
            this.block();
            this.match('e');
            this.emitLn('BRA ' + label);
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
                case 'p':   // <--
                    this.doLoop();
                    break;
                default:
                    this.other();
                }
            }
        }
    });

    /**
     * 5.7 The Repeat-Until statement
     * -------------------------------
     * **BNF of the `REPEAT` statement**
     * ```
     * <repeat> ::= REPEAT <block> UNTIL <conditon>
     * ```
     * **Output** should be:
     * ```
     * L1:
     *      <block>
     *      <condition>
     *      BEQ L1
     * ```
     * **Syntax-directed translation**
     * ```
     * SYNTAX              ACTIONS
     * -------------------------------------------
     * REPEAT         { L = newLabel();
     *                  postLabel(L) }
     * <block>
     * UNTIL
     * <condition>    { emit(BEQ L) }
     * ```
     * code example `arbuce`
     * which stands for
     * ```
     * <block A>                a
     * REPEAT                   r
     *     <block B>            b
     * UNTIL                    u
     * <block C>                c
     * END                      e
     * ```
     */
    theRepeatUntilStatement = theLoopStatement.extend({

        // Parse and translate a REPEAT statement
        doRepeat: function () {
            var label;
            this.match('r');
            label = this.newLabel();
            this.postLabel(label);
            this.block();
            this.match('u');
            this.condition();
            this.emitLn('BEQ ' + label);
        },

        // Recognize and translate a statement block
        block: function () {
            while (this.look !== 'e' && this.look !== 'l' &&
                    this.look !== 'u') {    // <--
                switch (this.look) {
                case 'i':
                    this.doIf();
                    break;
                case 'w':
                    this.doWhile();
                    break;
                case 'p':
                    this.doLoop();
                    break;
                case 'r':   // <--
                    this.doRepeat();
                    break;
                default:
                    this.other();
                }
            }
        }
    });

    /**
     * 5.8 The FOR loop
     * -----------------
     * **BNF of the `FOR` statement**
     * ```
     * <for> ::= FOR <ident> = <expr1> TO <expr2> <block> ENDFOR
     * ```
     * The construct is equivalence to:
     * ```
     *  <ident> = <expr1>
     *  temp = <expr2>
     *  WHILE <ident> <= temp
     *  <block>
     *  ENDWHILE
     * ```
     * The translated code came out like this:
     * ```
     *      <ident>               get name of loop counter
     *      <expr1>               get initial value
     *      LEA <ident>(PC),A0    address the loop counter
     *      SUBQ #1, D0           predecrement it
     *      MOVE D0, (A0)         save it
     *      <expr2>               get upper limit
     *      MOVE D0, -(SP)        save it on stack
     * L1:
     *      LEA <ident>(PC), A0   address loop counter
     *      MOVE (A0), D0         fetch it to D0
     *      ADDQ #1, D0           bump the counter
     *      MOVE D0, (A0)         save new value
     *      CMP (SP), D0          check for range
     *      BLE L2                skip out if D0 > (SP)
     *      <block>
     *      BRA L1                loop for next pass
     * L2:
     *      ADDQ #2, SP           clean up the stack
     * ```
     * code example `afi=bece`
     * which stands for
     * ```
     * <block A>                    a
     * FOR I = <expr1> TO <expr2>   fi=
     *     <block B>                b
     * ENDFOR                       e
     * <block C>                    c
     * END                          e
     * ```
     */
    theForLoop = theRepeatUntilStatement.extend({

        // Parse and translate an expression
        // This version is a dummy
        expression: function () {
            this.emitLn('<expression>');
        },

        // Parse and translate a FOR statement
        doFor: function () {
            var label_1,
                label_2,
                name;

            this.match('f');
            label_1 = this.newLabel();
            label_2 = this.newLabel();
            name = this.getName();
            this.match('=');
            this.expression();
            this.emitLn('SUBQ #1, D0');
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
            this.expression();
            this.emitLn('MOVE D0, -(SP)');

            this.postLabel(label_1);
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE (A0), D0');
            this.emitLn('ADDQ #1, D0');
            this.emitLn('MOVE D0, (A0)');
            this.emitLn('CMP (SP), D0');
            this.emitLn('BGT ' + label_2);
            this.block();
            this.match('e');
            this.emitLn('BRA ' + label_1);
            this.postLabel(label_2);
            this.emitLn('ADDQ #2, SP');
        },

        // Recognize and translate a statement block
        block: function () {
            while (this.look !== 'e' && this.look !== 'l' &&
                    this.look !== 'u') {
                switch (this.look) {
                case 'i':
                    this.doIf();
                    break;
                case 'w':
                    this.doWhile();
                    break;
                case 'p':
                    this.doLoop();
                    break;
                case 'r':
                    this.doRepeat();
                    break;
                case 'f':   // <--
                    this.doFor();
                    break;
                default:
                    this.other();
                }
            }
        }
    });

    /**
     * 5.9 The DO statement
     * ----------------------
     * **BNF of the `DO` statement**
     * ```
     * <do> ::= DO <expr> <block> ENDDO
     *
     * translated code:
     *
     *      <expression>
     *      SUBQ #1, D0
     * L1:
     *      MOVE D0, -(SP)      # push D0
     *      <block>
     *      MOVE (SP)+, D0      # pop D0
     *      DBRA D0, L1
     * ```
     * **Syntax-directed translation**
     * ```
     * SYNTAX           ACTIONS
     * -------------------------------------------
     * DO             { emit(SUBQ #1,D0);
     *                  L = newLabel();
     *                  postLabel(L)
     *                  emit(MOVE D0,-(SP)) }
     * <block>
     * ENDDO          { emit(MOVE (SP)+,D0);
     *                  emit(DBRA D0,L) }
     * ```
     * code example `adbece`
     * which stands for
     * ```
     * <block A>                a
     * DO                       d
     *     <block B>            b
     * ENDDO                    e
     * <block C>                c
     * END                      e
     * ```
     */
    theDoStatement = theForLoop.extend({

        // Parse and translate a DO statement
        doDo: function () {
            var label;
            this.match('d');
            label = this.newLabel();
            this.expression();
            this.emitLn('SUBQ #1, D0');
            this.postLabel(label);
            this.emitLn('MOVE D0, -(SP)');
            this.block();
            this.match('e');
            this.emitLn('MOVE (SP)+, D0');
            this.emitLn('DBRA D0, ' + label);
        },

        // Recognize and translate a statement block
        block: function () {
            while (this.look !== 'e' && this.look !== 'l' &&
                    this.look !== 'u') {
                switch (this.look) {
                case 'i':
                    this.doIf();
                    break;
                case 'w':
                    this.doWhile();
                    break;
                case 'p':
                    this.doLoop();
                    break;
                case 'r':
                    this.doRepeat();
                    break;
                case 'f':
                    this.doFor();
                    break;
                case 'd':   // <--
                    this.doDo();
                    break;
                default:
                    this.other();
                }
            }
        }
    });

    /**
     * 5.10 The BREAK statement
     * -------------------------
     * **In BNF**
     * ```
     * <break> ::= BREAK
     * ```
     * code example `apcibegehe`
     * which stands for
     * ```
     * <block A>                a
     * LOOP                     p
     *     <block C>            c
     *     IF <condition>       i
     *         BREAK            b
     *     ENDIF                e
     *     <block G>            g
     * ENDLOOP                  e
     * <block H>                h
     * END                      e
     * ```
     */
    theBreakStatement = theDoStatement.extend({

        // Recognize and translate an IF constructor
        doIf: function (label) {    // <--
            var label_1, label_2;
            this.match('i');
            this.condition();
            label_1 = this.newLabel();
            label_2 = label_1;
            this.emitLn('BEQ ' + label_1);
            this.block(label);  // <--

            if (this.look === 'l') {
                this.match('l');
                label_2 = this.newLabel();
                this.emitLn('BRA ' + label_2);
                this.postLabel(label_1);
                this.block();
            }

            this.match('e');
            this.postLabel(label_2);
        },

        // Parse and translate a WHILE statement
        doWhile: function () {
            var label_1, label_2;
            this.match('w');
            label_1 = this.newLabel();
            label_2 = this.newLabel();
            this.postLabel(label_1);
            this.condition();
            this.emitLn('BEQ ' + label_2);
            this.block(label_2);    // <--
            this.match('e');
            this.emitLn('BRA ' + label_1);
            this.postLabel(label_2);
        },

        // Parse and translate a LOOP statement
        doLoop: function () {
            var label_1, label_2;   // <--
            this.match('p');
            label_1 = this.newLabel();
            label_2 = this.newLabel();  // <--
            this.postLabel(label_1);
            this.block(label_2);    // <--
            this.match('e');
            this.emitLn('BRA ' + label_1);
            this.postLabel(label_2);    // <--
        },

        // Parse and translate a REPEAT statement
        doRepeat: function () {
            var label_1, label_2;   // <--
            this.match('r');
            label_1 = this.newLabel();
            label_2 = this.newLabel();  // <--
            this.postLabel(label_1);
            this.block(label_2);    // <--
            this.match('u');
            this.condition();
            this.emitLn('BEQ ' + label_1);
            this.postLabel(label_2);    // <--
        },

        // Parse and translate a FOR statement
        doFor: function () {
            var label_1,
                label_2,
                name;

            this.match('f');
            label_1 = this.newLabel();
            label_2 = this.newLabel();
            name = this.getName();
            this.match('=');
            this.expression();
            this.emitLn('SUBQ #1, D0');
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
            this.expression();
            this.emitLn('MOVE D0, -(SP)');

            this.postLabel(label_1);
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE (A0), D0');
            this.emitLn('ADDQ #1, D0');
            this.emitLn('MOVE D0,(A0)');
            this.emitLn('CMP (SP), D0');
            this.emitLn('BGT ' + label_2);
            this.block(label_2);   // <--
            this.match('e');
            this.emitLn('BRA ' + label_1);
            this.postLabel(label_2);
            this.emitLn('ADDQ #2, SP');
        },

        // Parse and translate a DO statement
        doDo: function () {
            var label_1, label_2;   // <--
            this.match('d');
            label_1 = this.newLabel();
            label_2 = this.newLabel();
            this.expression();
            this.emitLn('SUBQ #1, D0');
            this.postLabel(label_1);
            this.emitLn('MOVE D0, -(SP)');
            this.block(label_2);    // <--
            this.emitLn('MOVE (SP)+, D0');
            this.emitLn('DBRA D0, ' + label_1);
            this.emitLn('SUBQ #2, SP');  // <--
            this.postLabel(label_2);    // <--
            this.emitLn('ADDQ #2, SP'); // <--
        },

        // Recognize and translate a break
        doBreak: function (label) {
            this.match('b');
            if (label) {
                this.emitLn('BRA ' + label);
            } else {
                this.abort('No loop to break from');
            }
        },

        // Recognize and translate a statement block
        block: function (label) {   // <--
            while (this.look !== 'e' && this.look !== 'l' &&
                    this.look !== 'u') {
                switch (this.look) {
                case 'i':
                    this.doIf(label);   // <--
                    break;
                case 'w':
                    this.doWhile();
                    break;
                case 'p':
                    this.doLoop();
                    break;
                case 'r':
                    this.doRepeat();
                    break;
                case 'f':
                    this.doFor();
                    break;
                case 'd':
                    this.doDo();
                    break;
                case 'b':   // <--
                    this.doBreak(label);
                    break;
                default:
                    this.other();
                }
            }
        }
    });


    return {

        // <program> ::= <statement>
        oneStatement: oneStatement,

        // <program> ::= <block> END
        // <block> ::= [<statement>]*
        moreThanOneStatement: moreThanOneStatement,

        someGroundwork: someGroundwork,

        // <if> ::= IF <condition> <block> ENDIF
        theIfStatement: theIfStatement,

        // <if> ::= IF <condition> <block> [ELSE <block>] ENDIF
        addTheElseClause: addTheElseClause,

        // <while> ::= WHILE <condition> <block> ENDWHILE
        theWhileStatement: theWhileStatement,

        // <loop> ::= LOOP <block> ENDLOOP
        theLoopStatement: theLoopStatement,

        // <repeat> ::= REPEAT <block> UNTIL <conditon>
        theRepeatUntilStatement: theRepeatUntilStatement,

        // <for> ::= FOR <ident> = <expr1> TO <expr2> <block> ENDFOR
        theForLoop: theForLoop,

        // <do> ::= DO <expression> <block> ENDDO
        theDoStatement: theDoStatement,

        theBreakStatement: theBreakStatement
    };

    /**
     * Final results of this chapter in BNF
     * ------------------------------------
     * ### program ###
     * ```
     * <program> ::= <block> END
     * <block> ::= [<statement>]*
     * <statement> ::= <if> | <while> | <loop> | <repeat> |
     *                 <for> | <do> | <break> |
     *                 <other>
     * ```
     * ### control statements ###
     * ```
     * <if statement> ::= IF <condition> <block> [ELSE <block>] ENDIF
     * <while statement> ::= WHILE <condition> <block> ENDWHILE
     * <loop statement> ::= LOOP <block> ENDLOOP
     * <repeat statement> ::= REPEAT <block> UNTIL <conditon>
     * <for statement> ::= FOR <ident> = <expr1> TO <expr2> <block> ENDFOR
     * <do statement> ::= DO <expression> <block> ENDDO
     * <break statement> ::= BREAK
     * ```
     */
});
