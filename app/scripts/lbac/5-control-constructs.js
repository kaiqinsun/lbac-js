/*global define*/

/**
 * Chapter 5 Control Constructs
 * ============================
 */

define(['./1.2-cradle', 'io'], function (cradle, io) {
    'use strict';

    /**
     * 5.1 Introduction
     * ----------------
     * We’ll take off on a new and exciting tangent:
     * that of parsing and translating control constructs such as
     * IF statements.
     */

    /**
     * 5.2 The plan
     * -------------
     * We’ll be starting over again with a bare cradle.
     * We’ll also be retaining the concept of single-character tokens.
     * This means that the "code" will look a little funny,
     * with `i` for `IF`, `w` for `WHILE`, etc.
     */

    /**
     * ### 5.2.1 One statement ###
     * We will use an anonymous statement `other` to take the place of
     * the non- control statements and serve as a place-holder for them.
     *
     * **In BNF notation**
     * ```
     * <program> ::= <statement>
     * <statement> ::= <other>
     * ```
     * Code example: `a`
     */
    var oneStatement = cradle.extend({

        // Recognize and translate an "Other".
        // an anonymous statement serve as a place-holder.
        other: function () {
            this.emitLn('<block ' + this.getName() + '>');
        },

        // Main program.
        main: function () {
            this.init();
            this.other();   // <--
        }
    });

    /**
     * ### 5.2.2 More than one statement ###
     * The first thing we need is the ability to deal with more than
     * one statement.
     *
     * **In BNF notation**
     * ```
     * <program> ::= <block> END
     * <block> ::= [<statement>]*
     * ```
     * Code example: `abce`
     */
    var moreThanOneStatement = oneStatement.extend({

        // Recognize and translate a statement block.
        block: function () {
            while (this.look !== 'e') {
                this.other();
            }
        },

        // Parse and translate a program.
        doProgram: function () {
            this.block();
            if (this.look !== 'e') {
                this.expected('End');
            }
            this.emitLn('END');
        },

        // Main program.
        main: function () {
            this.init();
            this.doProgram();   // <--
        }
    });

    /**
     * 5.3 Some groundwork
     * --------------------
     * We’re going to need some more procedures to help us deal with
     * branches.
     *
     * Prepare two routines
     *
     * - `newLabel` to generate label `Lnn`,
     *    where `nn` is a label number starting from zero.
     * - `postLabel` to output the labels at the proper place.
     */
    var someGroundwork = moreThanOneStatement.extend({

        lCount: 0,  // label counter

        // Generate a unique label.
        newLabel: function () {
            var label = 'L' + this.lCount;
            this.lCount += 1;
            return label;
        },

        // Post a label to output.
        postLabel: function (label) {
            io.writeLn(label + ':');
        },

        // Initialize.
        init: function () {
            this.lCount = 0;    // <--
            this.getChar();
        }
    });

    /**
     * 5.4 The IF statement
     * ---------------------
     * All of the constructs we’ll be dealing with here involve transfer
     * of control, which at the assembler-language level means conditional
     * and/or unconditional branches.
     *
     * **In BNF**
     * ```
     * <if> ::= IF <condition> <block> ENDIF
     * ```
     * Output should be:
     * ```
     *      <condition>
     *      BEQ L1      # branch if false to L1
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
     * Code example: `aibece` and nested IF's `aibicedefe`.
     *
     * The later stands for
     * ```
     * <block A>                a
     * IF <condition>           i
     *     <block B>            b
     *     IF <condition>       i
     *         <block C>        c
     *     ENDIF                e
     *     <block D>            d
     * ENDIF                    e
     * <block F>                f
     * END                      e
     * ```
     * It’s starting to look real, eh?
     */
    var theIfStatement = someGroundwork.extend({

        // Parse and translate a boolean condition.
        // This version is a dummy.
        condition: function () {
            this.emitLn('<condition>');
        },

        // Recognize and translate an IF constructor.
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

        // Recognize and translate a statement block.
        block: function () {
            while (this.look !== 'e') {
                switch (this.look) {
                case 'i':           // <--
                    this.doIf();    // <--
                    break;
                default:
                    this.other();
                }
            }
        }
    });

    /**
     * ### 5.4.2 Add the ELSE clause ###
     * To add the ELSE clause to IF, the tricky part arises simply
     * because there is an optional part, which doesn’t occur in
     * the other constructs.
     *
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
     * This leads us to the following **syntax-directed translation**
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
     * Did it work? Now, just to be sure we haven’t broken the ELSE-less
     * case, try `aibece`.
     * Now try some nested IF’s. Try anything you like, including some
     * badly formed statements.
     */
    var addTheElseClause = theIfStatement.extend({

        // Recognize and translate an IF constructor.
        doIf: function () {
            var label1, label2;

            this.match('i');
            this.condition();
            label1 = label2 = this.newLabel();  // <--
            this.emitLn('BEQ ' + label1);
            this.block();

            if (this.look === 'l') {            // <-- optional ELSE clause
                this.match('l');
                label2 = this.newLabel();
                this.emitLn('BRA ' + label2);   // <-- unconditional branch
                this.postLabel(label1);
                this.block();
            }

            this.match('e');
            this.postLabel(label2);             // <--
        },

        // Recognize and translate a statement block.
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
     * Note that this time, the `<condition>` code is *INSIDE* the upper label,
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
     * don’t be discouraged: you write *bugs* in other languages, too,
     * don’t you?
     */
    var theWhileStatement = addTheElseClause.extend({

        // Parse and translate a WHILE statement.
        doWhile: function () {
            var label1, label2;

            this.match('w');
            label1 = this.newLabel();
            label2 = this.newLabel();
            this.postLabel(label1);
            this.condition();
            this.emitLn('BEQ ' + label2);
            this.block();
            this.match('e');
            this.emitLn('BRA ' + label1);
            this.postLabel(label2);
        },

        // Recognize and translate a statement block.
        block: function () {
            while (this.look !== 'e' && this.look !== 'l') {
                switch (this.look) {
                case 'i':
                    this.doIf();
                    break;
                case 'w':           // <--
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
     * Code example `apbece`, which stands for
     * ```
     * <block A>                a
     * LOOP                     p
     *     <block B>            b
     * ENDLOOP                  e
     * <block C>                c
     * END                      e
     * ```
     */
    var theLoopStatement = theWhileStatement.extend({

        // Parse and translate a LOOP statement.
        doLoop: function () {
            var label;

            this.match('p');
            label = this.newLabel();
            this.postLabel(label);
            this.block();
            this.match('e');
            this.emitLn('BRA ' + label);
        },

        // Recognize and translate a statement block.
        block: function () {
            while (this.look !== 'e' && this.look !== 'l') {
                switch (this.look) {
                case 'i':
                    this.doIf();
                    break;
                case 'w':
                    this.doWhile();
                    break;
                case 'p':           // <--
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
     * Code example `arbuce`
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
    var theRepeatUntilStatement = theLoopStatement.extend({

        // Parse and translate a REPEAT statement.
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

        // Recognize and translate a statement block.
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
                case 'r':                   // <--
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
     * The FOR loop is a very handy one to have around, but it’s a bear
     * to translate, because it’s hard to implement in assembler language.
     *
     * **BNF of the `FOR` statement**
     * ```
     * <for> ::= FOR <ident> = <expr1> TO <expr2> <block> ENDFOR
     * ```
     * It gets simpler if you adopt the point of view that the construct
     * is equivalent to:
     * ```
     *  <ident> = <expr1>
     *  temp = <expr2>
     *  WHILE <ident> <= temp
     *      <block>
     *  ENDWHILE
     * ```
     * The translated code came out like this:
     * ```
     *      <ident>               get name of loop counter
     *      <expr1>               get initial value
     *      LEA <ident>(PC), A0   address the loop counter
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
     * Code example `afi=bece`
     * which stands for
     * ```
     * <block A>                    a
     * FOR I = <expr1> TO <expr2>   f i =
     *     <block B>                b
     * ENDFOR                       e
     * <block C>                    c
     * END                          e
     * ```
     * Well, it DOES generate a lot of code, doesn’t it?
     * But at least it’s the RIGHT code.
     */
    var theForLoop = theRepeatUntilStatement.extend({

        // Parse and translate an expression.
        // This version is a dummy.
        expression: function () {
            this.emitLn('<expression>');
        },

        // Parse and translate a FOR statement.
        doFor: function () {
            var label1, label2, name;

            this.match('f');
            label1 = this.newLabel();
            label2 = this.newLabel();
            name = this.getName();
            this.match('=');
            this.expression();
            this.emitLn('SUBQ #1, D0');
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
            this.expression();
            this.emitLn('MOVE D0, -(SP)');

            this.postLabel(label1);
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE (A0), D0');
            this.emitLn('ADDQ #1, D0');
            this.emitLn('MOVE D0, (A0)');
            this.emitLn('CMP (SP), D0');
            this.emitLn('BGT ' + label2);
            this.block();
            this.match('e');
            this.emitLn('BRA ' + label1);
            this.postLabel(label2);
            this.emitLn('ADDQ #2, SP');
        },

        // Recognize and translate a statement block.
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
                case 'f':           // <--
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
     * This is a simpler version of the FOR loop.
     * If all we need is a counting loop to make us go through something
     * a specified number of times, but don’t need access to the counter
     * itself.
     *
     * **BNF of the `DO` statement**
     * ```
     * <do> ::= DO <expr> <block> ENDDO
     * ```
     * translated code:
     * ```
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
     * Code example `adbece`
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
    var theDoStatement = theForLoop.extend({

        // Parse and translate a DO statement.
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

        // Recognize and translate a statement block.
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
                case 'd':           // <--
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
     * On the face of it a BREAK seems really tricky.
     * The secret is to note that every BREAK statement has to occur
     * within a block ... there’s no place else for it to be.
     * So all we have to do is to pass into Block the exit address of
     * the innermost loop.
     * Then it can pass the address to the routine that translates
     * the break instruction.
     *
     * **In BNF**
     * ```
     * <break> ::= BREAK
     * ```
     * Code example `apcibegehe`
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
    var theBreakStatement = theDoStatement.extend({

        // Recognize and translate an IF constructor.
        doIf: function (label) {                // <--
            var label1, label2;

            this.match('i');
            this.condition();
            label1 = label2 = this.newLabel();
            this.emitLn('BEQ ' + label1);
            this.block(label);                  // <--

            if (this.look === 'l') {
                this.match('l');
                label2 = this.newLabel();
                this.emitLn('BRA ' + label2);
                this.postLabel(label1);
                this.block(label);              // <--
            }

            this.match('e');
            this.postLabel(label2);
        },

        // Parse and translate a WHILE statement.
        doWhile: function () {
            var label1, label2;

            this.match('w');
            label1 = this.newLabel();
            label2 = this.newLabel();
            this.postLabel(label1);
            this.condition();
            this.emitLn('BEQ ' + label2);
            this.block(label2);                 // <--
            this.match('e');
            this.emitLn('BRA ' + label1);
            this.postLabel(label2);
        },

        // Parse and translate a LOOP statement.
        doLoop: function () {
            var label1,
                label2;                         // <--

            this.match('p');
            label1 = this.newLabel();
            label2 = this.newLabel();           // <--
            this.postLabel(label1);
            this.block(label2);                 // <--
            this.match('e');
            this.emitLn('BRA ' + label1);
            this.postLabel(label2);             // <--
        },

        // Parse and translate a REPEAT statement.
        doRepeat: function () {
            var label1,
                label2;                         // <--

            this.match('r');
            label1 = this.newLabel();
            label2 = this.newLabel();           // <--
            this.postLabel(label1);
            this.block(label2);                 // <--
            this.match('u');
            this.condition();
            this.emitLn('BEQ ' + label1);
            this.postLabel(label2);             // <--
        },

        // Parse and translate a FOR statement.
        doFor: function () {
            var label1, label2, name;

            this.match('f');
            label1 = this.newLabel();
            label2 = this.newLabel();
            name = this.getName();
            this.match('=');
            this.expression();
            this.emitLn('SUBQ #1, D0');
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
            this.expression();
            this.emitLn('MOVE D0, -(SP)');

            this.postLabel(label1);
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE (A0), D0');
            this.emitLn('ADDQ #1, D0');
            this.emitLn('MOVE D0,(A0)');
            this.emitLn('CMP (SP), D0');
            this.emitLn('BGT ' + label2);
            this.block(label2);                 // <--
            this.match('e');
            this.emitLn('BRA ' + label1);
            this.postLabel(label2);
            this.emitLn('ADDQ #2, SP');
        },

        // Parse and translate a DO statement.
        doDo: function () {
            var label1,
                label2;                         // <--

            this.match('d');
            label1 = this.newLabel();
            label2 = this.newLabel();           // <--
            this.expression();
            this.emitLn('SUBQ #1, D0');
            this.postLabel(label1);
            this.emitLn('MOVE D0, -(SP)');
            this.block(label2);                 // <--
            this.emitLn('MOVE (SP)+, D0');
            this.emitLn('DBRA D0, ' + label1);
            this.emitLn('SUBQ #2, SP');         // <--
            this.postLabel(label2);             // <--
            this.emitLn('ADDQ #2, SP');         // <--
        },

        // Recognize and translate a break.
        doBreak: function (label) {
            if (!label) {
                this.abort('No loop to break from');
            }

            this.match('b');
            this.emitLn('BRA ' + label);
        },

        // Recognize and translate a statement block.
        block: function (label) {               // <--
            while (this.look !== 'e' && this.look !== 'l' &&
                    this.look !== 'u') {
                switch (this.look) {
                case 'i':
                    this.doIf(label);           // <--
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
                case 'b':                       // <--
                    this.doBreak(label);        // <--
                    break;
                default:
                    this.other();
                }
            }
        }
    });


    /**
     * 5.11 Conclusion
     * ----------------
     * Final results of this chapter in BNF
     *
     * **Program**
     * ```
     * <program>          ::= <block> END
     * <block>            ::= [<statement>]*
     * <statement>        ::= <if> | <while> | <loop> | <repeat> |
     *                        <for> | <do> | <break> |
     *                        <other>
     * ```
     * **Control statements**
     * ```
     * <if statement>     ::= IF <condition> <block> [ELSE <block>] ENDIF
     * <while statement>  ::= WHILE <condition> <block> ENDWHILE
     * <loop statement>   ::= LOOP <block> ENDLOOP
     * <repeat statement> ::= REPEAT <block> UNTIL <conditon>
     * <for statement>    ::= FOR <ident> = <expr1> TO <expr2> <block> ENDFOR
     * <do statement>     ::= DO <expression> <block> ENDDO
     * <break statement>  ::= BREAK
     * ```
     * Next we’ll address *Boolean expressions*, so we can get rid of
     * the dummy version of `<condition>` that we’ve used here.
     */

    return {

        // 5.2.1
        // <program> ::= <statement>
        oneStatement: oneStatement,

        // 5.2.2
        // <program> ::= <block> END
        // <block> ::= [<statement>]*
        moreThanOneStatement: moreThanOneStatement,

        // 5.3
        someGroundwork: someGroundwork,

        // 5.4
        // <if> ::= IF <condition> <block> ENDIF
        theIfStatement: theIfStatement,

        // 5.4.2
        // <if> ::= IF <condition> <block> [ELSE <block>] ENDIF
        addTheElseClause: addTheElseClause,

        // 5.5
        // <while> ::= WHILE <condition> <block> ENDWHILE
        theWhileStatement: theWhileStatement,

        // 5.6
        // <loop> ::= LOOP <block> ENDLOOP
        theLoopStatement: theLoopStatement,

        // 5.7
        // <repeat> ::= REPEAT <block> UNTIL <conditon>
        theRepeatUntilStatement: theRepeatUntilStatement,

        // 5.8
        // <for> ::= FOR <ident> = <expr1> TO <expr2> <block> ENDFOR
        theForLoop: theForLoop,

        // 5.9
        // <do> ::= DO <expression> <block> ENDDO
        theDoStatement: theDoStatement,

        // 5.10
        theBreakStatement: theBreakStatement
    };
});
