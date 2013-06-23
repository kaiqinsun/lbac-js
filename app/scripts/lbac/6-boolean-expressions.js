/*global define*/

/**
 * Chapter 6 Boolean Expressions
 * =============================
 */

define([
    './1.2-cradle',
    './3-more-expressions',
    './5-control-constructs',
    'jquery',
    'io'
], function (cradle, moreExpressions, controlConstructs, $, io) {
    'use strict';

    /**
     * 6.1 Introduction
     * -----------------
     * In the previous chapter we did not address the issue of the branch
     * **condition**. One of the things we’ll do in this session is to plug
     * that hole by expanding condition into a true parser/translator.
     */

    /**
     * 6.2 The plan
     * -------------
     * The approach we did in previous chapters is called coding without
     * specs, and it’s usually frowned upon. We could get away with it
     * before because the rules of arithmetic are pretty well established...
     * The same is true for branches and loops.
     *
     * But the ways in which programming languages implement logic vary
     * quite a bit from language to language. So before we begin serious
     * coding, we’d better first make up our minds what it is we want.
     *
     * The way to do that is at the level of the BNF syntax rules
     * (the GRAMMAR).
     */

    /**
     * 6.3 The grammar
     * ----------------
     * **BNF syntax equations** for arithmetic expressions
     * we have been implementing
     * ```
     * <expression>    ::= <unary op> <term> [<addop> <term>]*
     * <term>          ::= <factor> [<mulop> factor]*
     * <factor>        ::= <integer> | <variable> | (<expression>)
     * ```
     * The nice thing about this grammar is that it enforces the operator
     * precedence hierarchy that we normally expect for algebra.
     *
     * It's better to write the *grammar* this way
     * ```
     * <expression>    ::= <term> [<addop> <term>]*
     * <term>          ::= <signed factor> [<mulop> factor]*
     * <signed factor> ::= [<addop>] <factor>
     * <factor>        ::= <integer> | <variable> | (<expression>)
     * ```
     * We can define an analogous grammar for boolean algebra
     * ```
     * <b-expression>  ::= <b-term> [<orop> <b-term>]*
     * <b-term>        ::= <not-factor> [AND <not-factor>]*
     * <not-factor>    ::= [NOT] <b-factor>
     * <b-factor>      ::= <b-literal> | <b-variable> | (<b-expression>)
     * ```
     * Notice the analogy
     *
     * - addop `+`, `-` <=> orop `OR`, `XOR`
     * - mulop `*` <=> `AND`
     * - unary minus `-` <=> `NOT`.
     *
     * Also notice that expression like `a * -b` or `a - -b` is not allowed.
     * However, in boolean algebra `a AND NOT b` makes perfect sense.
     */

    /**
     * 6.4 Relops
     * -----------
     * We now have syntax rules for both arithmetic and Boolean algebra.
     * The sticky part comes in when we have to combine the two.
     *
     * **BNF for relational expressions**
     * ```
     * <relation>  ::=  <expression> <relop> <expression>
     * ```
     * where relops are any of `=`, `<>` (or `!=`), `<`, `>`, `<=`, and `>=`.
     *
     * The relation is really just another kind of factor,
     * so we can expand the definition of a boolean factor to read
     * ```
     * <b-factor>  ::=   <b-literal>
     *                 | <b-variable>
     *                 | (<b-expression>)
     *                 | <relation>
     * ```
     * THAT’s the connection! The relops and the relation they define
     * serve to wed the two kinds of algebra.
     * If you write out the precedence levels for all the operators,
     * you arrive at the following list:
     * ```
     * Level   Syntax Element         Operator
     * -------------------------------------------------
     *   0        factor          literal, variable
     *   1     signed factor         unary minus
     *   2         term                 *, /
     *   3      expression              +, -
     *   4        b-factor      literal, variable, relop
     *   5       not-factor              NOT
     *   6         b-term                AND
     *   7      b-expression           OR, XOR
     * ```
     * This grammar seems reasonable. Unfortunately, it won’t work!
     * To see the problem, consider the code fragment:
     * `IF ((((((A + B + C) < 0 ) AND ....`
     * It has no way of knowing which kind of expression it’s dealing with.
     * Compiler writers have had to make compromises so that a single parser
     * can handle the grammar without backtracking.
     */

    /**
     * 6.5 Fixing the grammar
     * ----------------------
     * The problem comes up because our definitions of both arithmetic and
     * Boolean factors permit the use of parenthesized expressions.
     *
     * **In BNF**
     * ```
     * <b-expression>  ::= <b-term> [<orop> <b-term>]*
     * <b-term>        ::= <not-factor> [AND <not-factor>]*
     * <not-factor>    ::= [NOT] <b-factor>
     * <b-factor>      ::= <b-literal> | <b-variable> | <relation>
     *
     * <relation>      ::= <expression> [<relop> <expression>]
     *
     * <expression>    ::= <term> [<addop> <term>]*
     * <term>          ::= <signed factor> [<mulop> factor]*
     * <signed factor> ::= [<addop>] <factor>
     * <factor>        ::= <integer> | <variable> | (<b-expression>)
     * ```
     * The option of parenthesized b-expressions as a possible b-factor
     * is removed, and the relation as a legal form of b-factor is added.
     * There is one subtle but crucial difference, which is what makes
     * the whole thing work. Notice that in `<relation>` the relop and
     * the second expression are OPTIONAL.
     *
     * A strange consequence of this grammar (and one shared by C) is
     * that EVERY expression is potentially a Boolean expression.
     */

    /**
     * 6.6 The parser
     * ---------------
     * Now that we’ve gotten through the decision-making process, we can
     * press on with development of a parser.
     *
     * ### 6.6.1 Boolean literal 1 ###
     * We begin, as we did in the arithmetic case, by dealing only with
     * Boolean literals rather than variables.
     * We begin with a fresh copy of the cradle, and begin adding
     * procedures one by one.
     *
     * Try with `t`, `f` or anything else.
     */
    var booleanLiteral1 = cradle.extend({

        // Recognize a boolean literal.
        isBoolean: function (c) {
            c = c.toUpperCase();
            return c === 'T' || c === 'F';
        },

        // Get a boolean literal.
        getBoolean: function () {
            if (!this.isBoolean(this.look)) {
                this.expected('Boolean Literal');
            }

            var result = this.look.toUpperCase() === 'T';
            this.getChar();
            return result;
        },

        // Main program.
        main: function () {
            this.init();
            io.writeLn(this.getBoolean());  // <-- for testing purposes
        }
    });

    /**
     * ### 6.6.2 Boolean literal 2 ###
     * The usual way to encode Boolean variables is to let `0` stand for
     * `FALSE`, and some other value for `TRUE` (e.g. `1` for C).
     * Here `FFFF` hex (or `-1`) is chosen for TRUE, because a *bitwise NOT*
     * also becomes a *Boolean NOT*.
     *
     * **In BNF**
     * ```
     * <b-expression>  ::= <b-literal>
     * ```
     * Try again with `t`, `f` or anything else.
     */
    var booleanLiteral2 = booleanLiteral1.extend({

        // Parse and translate a boolean expression.
        boolExpression: function () {
            if (!this.isBoolean(this.look)) {
                this.expected('Boolean Literal');
            }

            if (this.getBoolean()) {
                this.emitLn('MOVE #-1, D0');    // -1 stands for TRUE
            } else {
                this.emitLn('CLR D0');          // 0 stands for FALSE
            }
        },

        // Main program.
        main: function () {
            this.init();
            this.boolExpression();              // <--
        }
    });

    /**
     * ### 6.6.3 OR operation ###
     * We already have the **BNF** rule:
     * ```
     * <b-expression> ::= <b-term> [<orop> <b-term>]*
     * <b-term> ::= <b-literal>
     * ```
     * Here the **orop*s `OR` and `XOR` are encoded with `|` and `~`.
     *
     * Try some combinations such as `t|f` and `f~t`, etc.
     * The output code is starting to look pretty good.
     */
    var orOperation = booleanLiteral2.extend({

        // Recognize a boolean orop.
        isOrop: function (c) {
            return c === '|' || c === '~';
        },

        // Parse and translate a boolean term.
        // Rename from previous boolExpression().
        boolTerm: function () {
            if (!this.isBoolean(this.look)) {
                this.expected('Boolean Literal');
            }

            if (this.getBoolean()) {
                this.emitLn('MOVE #-1, D0');
            } else {
                this.emitLn('CLR D0');
            }
        },

        // Recognize and translate a boolean OR.
        boolOr: function () {
            this.match('|');
            this.boolTerm();
            this.emitLn('OR (SP)+, D0');
        },

        // Recognize and translate an exclusive or (XOR).
        boolXor: function () {
            this.match('~');
            this.boolTerm();
            this.emitLn('EOR (SP)+, D0');
        },

        // Parse and translate a boolean expression.
        boolExpression: function () {
            this.boolTerm();
            while (this.isOrop(this.look)) {
                this.emitLn('MOVE D0, -(SP)');  // push D0
                switch (this.look) {
                case '|':
                    this.boolOr();
                    break;
                case '~':
                    this.boolXor();
                    break;
                }
            }
        }
    });

    /**
     * ### 6.6.4 AND operation ###
     * You’ve probably already guessed what the next step is:
     * The Boolean version of Term.
     *
     * **In BNF**
     * ```
     * <b-term> ::= <not-factor> [AND <not-factor>]*
     * <not-factor> :== <b-literal>
     * ```
     * Here the `AND` operator is encoded with `&`.
     *
     * Try some combinations such as `t&f` or `t|f&t`, etc.,
     * and notice the precedence of AND and OR.
     */
    var andOperation = orOperation.extend({

        // Parse and translate a boolean factor with NOT.
        // Rename from previous boolTerm().
        notFactor: function () {
            if (!this.isBoolean(this.look)) {
                this.expected('Boolean Literal');
            }

            if (this.getBoolean()) {
                this.emitLn('MOVE #-1, D0');
            } else {
                this.emitLn('CLR D0');
            }
        },

        // Parse and translate a boolean term.
        boolTerm: function () {
            this.notFactor();
            while (this.look === '&') {
                this.emitLn('MOVE D0, -(SP)');
                this.match('&');
                this.notFactor();
                this.emitLn('AND (SP)+, D0');
            }
        }
    });

    /**
     * ### 6.6.5 NOT operation ###
     * The next step is to allow for the NOT.
     *
     * **In BNF**
     * ```
     * <not-factor> ::= [NOT] <b-factor>
     * <b-factor> ::= <b-literal>
     * ```
     * The `NOT` operator is encoded with `!`.
     * 
     * Try some combinations as well, such as `!t`, `t&!f`, etc.
     */
    var notOperation = andOperation.extend({

        // Parse and translate a boolean factor.
        // Rename for previous notFactor().
        boolFactor: function () {
            if (!this.isBoolean(this.look)) {
                this.expected('Boolean Literal');
            }

            if (this.getBoolean()) {
                this.emitLn('MOVE #-1, D0');
            } else {
                this.emitLn('CLR D0');
            }
        },

        // Parse and translate a boolean factor with NOT.
        notFactor: function () {
            if (this.look === '!') {
                this.match('!');
                this.boolFactor();
                this.emitLn('EOR #-1, D0');
            } else {
                this.boolFactor();
            }
        }
    });

    /**
     * ### 6.6.6 Expand the factor ###
     * It takes just a one line addition to `boolFactor` to take care
     * of relations.
     *
     * **In BNF**
     * ```
     * <b-factor> ::= <b-literal> | <relation>
     * ```
     * The compiler itself can’t tell the difference between a Boolean
     * variable or expression and an arithmetic one...
     * all of those will be handled by Relation, either way.
     *
     * Now we can handle for example `a&f`, `!a|b&t`, etc.
     */
    var expandTheFactor = notOperation.extend({

        // Parse and translate a relation.
        // This version is a dummy.
        relation: function () {
            this.emitLn('<relation ' + this.getName() + '>');
        },

        // Parse and translate a boolean factor.
        boolFactor: function () {
            if (this.isBoolean(this.look)) {        // <--
                if (this.getBoolean()) {
                    this.emitLn('MOVE #-1, D0');
                } else {
                    this.emitLn('CLR D0');
                }
            } else {                                // <--
                this.relation();                    // <--
            }
        }
    });

    /**
     * ###6.6.7 Full-blown relation ###
     * let’s move on to the full-blown version of `<relation>`.
     * ```
     * <relation> ::= <expression> [<relop> <expression>]
     * ```
     * Because of the single-character limitation, we're sticking to the
     * four operators equals `=`, not equals `#`, less than `<` and
     * greater than `>`.
     *
     * Try some code such as `a>b`, `a#b`, and `a>b&b>c`, etc.
     */
    var fullBlownRelation = expandTheFactor.extend({

        // Recognize a relop.
        isRelop: function (c) {
            return c === '=' || c === '#' || c === '<' || c === '>';
        },

        // Recognize and translate a relational "equals".
        equals: function () {
            this.match('=');
            this.expression();
            this.emitLn('CMP (SP)+, D0');
            this.emitLn('SEQ D0');
        },

        // Recognize and translate a relational "not equals".
        notEquals: function () {
            this.match('#');
            this.expression();
            this.emitLn('CMP (SP)+, D0');
            this.emitLn('SNE D0');
        },

        // Recognize and translate a relational "less than".
        less: function () {
            this.match('<');
            this.expression();
            this.emitLn('CMP (SP)+, D0');
            this.emitLn('SGE D0');
        },

        // Recognize and translate a relational "greater than".
        greater: function () {
            this.match('>');
            this.expression();
            this.emitLn('CMP (SP)+, D0');
            this.emitLn('SLE D0');
        },

        // Parse and translate a relation.
        relation: function () {
            this.expression();
            if (this.isRelop(this.look)) {
                this.emitLn('MOVE D0, -(SP)');
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
                this.emitLn('TST D0');
            }
        },

        // Parse and translate an expression.
        // This version is a dummy.
        expression: function () {
            this.emitLn('<Expression ' + this.getName() + '>');
        }
    });

    /**
     * ### 6.6.8 Merging with expressions ###
     * We have already generated code for Expression and its buddies in
     * previous sessions.
     *
     * **After merging, the syntax in BNF**
     * ```
     * ----- boolean expressions -----
     * <b-expression> ::= <b-term> [<orop> <b-term>]*
     * <b-term>       ::= <not-factor> [AND <not-factor>]*
     * <not-factor>   ::= [NOT] <b-factor>
     * <b-factor>     ::= <b-literal> | <relation>
     * <relation>     ::= <expression> [<relop> <expression>]
     * ----- arithmetic expressions -----
     * <expression>   ::= [<unary op>] <term> [<addop> <term>]*
     * <term>         ::= <factor> |<mulop> <factor>|*
     * <factor>       ::= <number> | (<expression>) | <identifier>
     * <identifier>   ::= <variable> | <function>
     * ```
     * Now we have a parser that can handle both arithmetic AND Boolean
     * algebra, and things that combine the two through the use of relops.
     *
     * Try some combinations such as `1<2`, `a>1+2`, `a>b+1&a#1`, etc.
     * Howerver, does `(t|f)` produce an error?
     */
    //{
    var mergingWithExpressions = $.extend(
        true,   // deep copy
        {},     // empty target

        // 3.5
        moreExpressions.assignmentStatements,

        // 6.6.7
        fullBlownRelation,

        // 3.5
        {
            expression : moreExpressions.assignmentStatements.expression
        }
    );
    //}

    /**
     * ### 6.6.9 Change to latest expression syntax ###
     * The procedures are changed a little to make them correspond to
     * the latest version of the syntax.
     * ```
     * <expression>   ::= <term> [<addop> <term>]*
     * <term>         ::= <signed factor> [<mulop> <factor>]*
     * <factor>       ::= <number> | (<b-expression>) | <identifier>
     * ```
     */
    var changeToLatestExpressionSyntax = mergingWithExpressions.extend({

        // parse and translate an expression.
        expression: function () {
            this.term();
            while (this.look === '+' || this.look === '-') {
                this.emitLn('MOVE D0, -(SP)');
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

        // Parse and translate a math term.
        term: function () {
            this.signedFactor();                // <--
            while (this.look === '*' || this.look === '/') {
                this.emitLn('MOVE D0, -(SP)');
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

        // Parse and translate the first math factor.
        signedFactor: function () {
            if (this.look === '+') {
                this.getChar();
            }

            if (this.look === '-') {
                this.getChar();
                if (this.isDigit(this.look)) {
                    this.emitLn('MOVE #-' + this.getNum() + ', D0');
                } else {
                    this.factor();
                    this.emitLn('NEG D0');
                }
            } else {
                this.factor();
            }
        },

        // Parse and translate a math factor.
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.boolExpression();              // <--
                this.match(')');
            } else if (this.isAlpha(this.look)) {
                this.identifier();
            } else {
                this.emitLn('MOVE #' + this.getNum() + ', D0');
            }
        }
    });

    /**
     * 6.7 Merging with control constructs
     * ------------------------------------
     * Remember those little dummy procedures called `condition` and
     * `expression` in the control constructs? Now we know what goes
     * in their places.
     * ```
     * <program> ::= <block> END
     * <block> ::= [<statement>]*
     * <statement> ::= <control-statement> | <b-expression>
     * ```
     * Try `ia=bxlyeze` which stands for
     * ```
     * IF a=b
     *     X
     * ELSE
     *     Y
     * ENDIF
     * Z
     * END
     * ```
     * What do you think? Did it work? Try some others.
     */
    //{
    var mergingWithControlConstructs = $.extend(
        true,   // deep copy
        {},     // empty target

        // 6.6.9
        changeToLatestExpressionSyntax,

        // 5.10
        controlConstructs.theBreakStatement,

        // 6.6.9
        {
            condition: changeToLatestExpressionSyntax.boolExpression,
            expression: changeToLatestExpressionSyntax.expression,
            other: changeToLatestExpressionSyntax.boolExpression
        }
    );
    //}

    /**
     * 6.8 Adding assignments
     * -----------------------
     * The one-line "programs" that we’re having to write here
     * will really cramp our style. So we extend the parser to accept
     * multiple-line *programs*.
     * The only restriction here is that we can’t
     * separate an `IF` or `WHILE` token from its predicate.
     * ```
     * <statement> ::= <control-statement> | <assignment>
     * <assignment> ::= <identifier> = <b-expression>
     * ```
     * Note that `assignment` now calls `boolExpression`, so that we
     * can assign Boolean variables.
     *
     * You should now be able to write reasonably realistic-looking
     * programs, subject only to our limitation on single-character tokens.
     * Try some code using the editor, for example
     * ```
     * c=1
     * s=0
     * wc<9
     * s=s+c
     * c=c+1
     * e
     * e
     * ```
     * which stands for
     * ```
     * COUNTER = 1
     * SUM = 0
     * WHILE COUNTER < 9
     *     SUM = SUM + COUNTER
     *     COUNTER = COUNTER + 1
     * ENDWHILE
     * END
     * ```
     * Try some others and remember that we have reserved **keywords**
     * `b`, `d`, `e`, `f`, `i`, `l`, `p`, `r`, `u`, `w`
     * which stand for BREAK, DO, END[XX], FOR, IF, ELSE,
     * LOOP, REPEAT, UNTIL, and WHILE, respectively.
     */
    var addingAssignments = mergingWithControlConstructs.extend({

        // Skip a CRLF.
        fin: function () {
            if (this.look === this.CR) {
                this.getChar();
            }
            if (this.look === this.LF) {
                this.getChar();
            }
        },

        // Recognize and translate a statement block.
        block: function (label) {
            while (this.look !== 'e' && this.look !== 'l' &&
                    this.look !== 'u') {
                this.fin();             // <--
                switch (this.look) {
                case 'i':
                    this.doIf(label);
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
                case 'b':
                    this.doBreak(label);
                    break;
                default:
                    this.assignment();  // <--
                }
                this.fin();             // <--
            }
        },

        // Parse and translate an assignment statement.
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.boolExpression();      // <--
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
        }
    });

    /**
     * 6.9 Conclusion
     * ---------------
     * Final results of this chapter in BNF
     *
     * **Program**
     * ```
     * <program>        ::= <block> END
     * <block>          ::= [<statement>]*
     * <statement>      ::= <if> | <while> | <loop> | <repeat> |<for> |
     *                      <do> | <break> | <assignment>
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
     * **Assignment statement**
     * ```
     * <assignment statement> ::= <identifier> = <b-expression>
     * ```
     * **Boolean expressions**
     * ```
     * <b-expression> ::= <b-term> [<orop> <b-term>]*
     * <b-term>       ::= <not-factor> [AND <not-factor>]*
     * <not-factor>   ::= [NOT] <b-factor>
     * <b-factor>     ::= <b-literal> | <relation>
     * <relation>     ::= <expression> [<relop> <expression>]
     * ```
     * **Arithmetic expressions**
     * ```
     * <expression>   ::= <term> [<addop> <term>]*
     * <term>         ::= <signed factor> [<mulop> <factor>]*
     * <factor>       ::= <number> | (<b-expression>) | <identifier>
     * <identifier>   ::= <variable> | <function>
     * ```
     */

    return {

        // 6.6.1
        booleanLiteral1: booleanLiteral1,

        // 6.6.2
        // <b-expression> ::= <b-literal>
        booleanLiteral2: booleanLiteral2,

        // 6.6.3
        // <b-expression> ::= <b-term> [<orop> <b-term>]*
        // <b-term>       ::= <b-literal>
        orOperation: orOperation,

        // 6.6.4
        // <b-term>       ::= <not-factor> [AND <not-factor>]*
        // <not-factor>   ::= <b-literal>
        andOperation: andOperation,

        // 6.6.5
        // <not-factor>   ::= [NOT] <b-factor>
        // <b-factor>     ::= <b-literal>
        notOperation: notOperation,

        // 6.6.6
        // <b-factor>     ::= <b-literal> | <relation>
        expandTheFactor: expandTheFactor,

        //6.6.7
        // <relation>     ::= <expression> [<relop> <expression>]
        fullBlownRelation: fullBlownRelation,

        /**
         * 6.6.8
         * No new codes after merging, the syntax in BNF:
         * ----- boolean expressions -----
         * <b-expression> ::= <b-term> [<orop> <b-term>]*
         * <b-term>       ::= <not-factor> [AND <not-factor>]*
         * <not-factor>   ::= [NOT] <b-factor>
         * <b-factor>     ::= <b-literal> | <relation>
         * <relation>     ::= <expression> [<relop> <expression>]
         * ----- arithmetic expressions -----
         * <expression>   ::= [<unary op>] <term> [<addop> <term>]*
         * <term>         ::= <factor> |<mulop> <factor>|*
         * <factor>       ::= <number> | (<expression>) | <identifier>
         * <identifier>   ::= <variable> | <function>
         */
        mergingWithExpressions: mergingWithExpressions,

        // 6.6.9
        // <expression>   ::= <term> [<addop> <term>]*
        // <term>         ::= <signed factor> [<mulop> <factor>]*
        // <factor>       ::= <number> | (<b-expression>) | <identifier>
        changeToLatestExpressionSyntax: changeToLatestExpressionSyntax,

        // 6.7
        // <program>      ::= <block> END
        // <block>        ::= [<statement>]*
        // <statement>    ::= <control-statement> | <b-expression>
        mergingWithControlConstructs: mergingWithControlConstructs,

        // 6.8
        // <statement>    ::= <control-statement> | <assignment>
        // <assignment>   ::= <identifier> = <b-expression>
        addingAssignments: addingAssignments
    };
});
