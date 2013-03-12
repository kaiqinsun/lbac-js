/**
 * Chapter 6 Boolean Expressions
 */

define([
    './1.2-cradle', './3-more-expressions', './5-control-constructs',
    'jquery', 'io'
], function (cradle, moreExpressions, controlConstructs, $, io) {
    'use strict';

    var boundMain = cradle.boundMain,
        theParser,                      // 6.6.1
        booleanLiteral,                 // 6.6.2
        generalExpressions,             // 6.6.3
        andOperation,                   // 6.6.4
        notOperation,                   // 6.6.5
        expandTheFactor,                // 6.6.6
        fullBlownRelation,              // 6.6.7
        mergingWithExpressions,         // 6.6.8
        changeToLatestExpressionSyntax, // 6.6.9
        mergingWithControlConstructs,   // 6.7
        addingAssignments;              // 6.8

    // 6.1 Introduction

    // 6.2 The plan

    // 6.3 The grammar

    /** BNF syntax equations for arithmetic expressions
     *  we have been implementing:
     *  <expression> ::= <unary op> <term> [<addop> <term>]*
     *  <term>       ::= <factor> [<mulop> factor]*
     *  <factor>     :== <integer> | <variable> | (<expression>)
     **/

    /** It's better to write the grammar this way:
     *  <expression>    ::= <term> [<addop> <term>]*
     *  <term>          ::= <signed factor> [<mulop> factor]*
     *  <signed factor> ::= [<addop>] <factor>
     *  <factor>        :== <integer> | <variable> | (<expression>)
     **/

    /** Analogous grammar for boolean algebra
     *  <b-expression> ::= <b-term> [<orop> <b-term>]*
     *  <b-term>       ::= <not-factor> [AND <not-factor>]*
     *  <not-factor>   ::= [NOT] <b-factor>
     *  <b-factor>     ::= <b-literal> | <b-variable> | (<b-expression>)
     **/

    // 6.4 Relops

    /** BNF for relational expressions
     *  <relation> ::= <expression> <relop> <expression>
     *  relops are any of =, <> (or !=), <, >, <=, and >=
     **/

    /** Expand the definition of a boolean factor to read:
     *  <b-factor> ::= <b-literal>
     *               | <b-variable>
     *               | (<b-expression>) |
     *               | <relation>
     * The relops and the relation they define serve
     * to wed the two kinds of algebra.
     **/

    // 6.5 Fixing the grammar

    /** BNF
     *  <b-expression>  ::= <b-term> [<orop> <b-term>]*
     *  <b-term>        ::= <not-factor> [AND <not-factor>]*
     *  <not-factor>    ::= [NOT] <b-factor>
     *  <b-factor>      ::= <b-literal> | <b-variable> | <relation>
     *
     *  <relation>      ::= <expression> [<relop> <expression>]
     *
     *  <expression>    ::= <term> [<addop> <term>]*
     *  <term>          ::= <signed factor> [<mulop> factor]*
     *  <signed factor> ::= [<addop>] <factor>
     *  <factor>        ::= <integer> | <variable> | (<b-expression>)
     **/

    /**
     * 6.6 The parser
     */

    // 6.6.1 The parser
    theParser = cradle.extend({

        // Recognize a boolean literal
        isBoolean: function (c) {
            c = c.toUpperCase();
            return c === 'T' || c === 'F';
        },

        // Get a boolean literal
        getBoolean: function () {
            var result;
            if (!this.isBoolean(this.look)) {
                this.expected('Boolean Literal');
            }
            result = this.look.toUpperCase() === 'T';
            this.getChar();
            return result;
        },

        // Main function
        main: function () {
            this.init();
            io.writeLn(this.getBoolean());
        }

    });

    /**
     * 6.6.2 Boolean literal
     * In BNF
     * <b-expression>  ::= <b-literal>
     */
    booleanLiteral = theParser.extend({

        // Parse and translate a boolean expression
        boolExpression: function () {
            if (!this.isBoolean(this.look)) {
                this.expected('Boolean Literal');
            }
            if (this.getBoolean()) {
                this.emitLn('MOVE #-1, D0');
            } else {
                this.emitLn('CLR D0');
            }
        },

        // Main function
        main: function () {
            this.init();
            this.boolExpression();
        }

    });

    /**
     * 6.6.3 General expressions
     * In BNF:
     * <b-expression> ::= <b-term> [<orop> <b-term>]*
     * <b-term> ::= <b-literal>
     */
    generalExpressions = booleanLiteral.extend({

        // Recognize a boolean orop
        isOrop: function (c) {
            return c === '|' || c === '~';
        },

        // Parse and translate a boolean term
        // rename from previous boolExpression()
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

        // Recognize and translate a boolean OR
        boolOr: function () {
            this.match('|');
            this.boolTerm();
            this.emitLn('OR (SP)+, D0');
        },

        // Recognize and translate an exclusive or (XOR)
        boolXor: function () {
            this.match('~');
            this.boolTerm();
            this.emitLn('EOR (SP)+, D0');
        },

        // Parse and translate a boolean expression
        boolExpression: function () {
            this.boolTerm();
            while (this.isOrop(this.look)) {
                this.emitLn('MOVE D0, -(SP)');
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
     * 6.6.4 AND operation
     * In BNF:
     * <b-term> ::= <not-factor> [AND <not-factor>]*
     * <not-factor> :== <b-literal>
     **/
    andOperation = generalExpressions.extend({

        // Parse and translate a boolean factor with NOT
        // rename from previous boolTerm()
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

        // Parse and translate a boolean term
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
     * 6.6.5 NOT operation
     * In BNF:
     * <not-factor> ::= [NOT] <b-factor>
     * <b-factor> ::= <b-literal>
     */
    notOperation = andOperation.extend({

        // Parse and translate a boolean factor
        // Rename for previous notFactor()
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

        // Parse and translate a boolean factor with NOT
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
     * 6.6.6 Expand the factor
     * In BNF:
     * <b-factor> ::= <b-literal> | <relation>
     */
    expandTheFactor = notOperation.extend({

        // Parse and translate a relation
        // This version is a dummy
        relation: function () {
            this.emitLn('<relation' + this.getName() + '>');
        },

        // Parse and translate a boolean factor
        boolFactor: function () {
            if (this.isBoolean(this.look)) {
                if (this.getBoolean()) {
                    this.emitLn('MOVE #-1, D0');
                } else {
                    this.emitLn('CLR D0');
                }
            } else {
                this.relation();
            }
        }

    });

    /**
     * 6.6.7 Full-blown relation
     * <relation> ::= <expression> [<relop> <expression>]
     */
    fullBlownRelation = expandTheFactor.extend({

        // Recognize a relop
        isRelop: function (c) {
            return c === '=' || c === '#' || c === '<' || c === '>';
        },

        // Recognize and translate a relational "equals"
        equals: function () {
            this.match('=');
            this.expression();
            this.emitLn('CMP (SP)+, D0');
            this.emitLn('SEQ D0');
        },

        // Recognize and translate a relational "not equals"
        notEquals: function () {
            this.match('#');
            this.expression();
            this.emitLn('CMP (SP)+, D0');
            this.emitLn('SNE D0');
        },

        // Recognize and translate a relational "less than"
        less: function () {
            this.match('<');
            this.expression();
            this.emitLn('CMP (SP)+, D0');
            this.emitLn('SGE D0');
        },

        // Recognize and translate a relational "greater than"
        greater: function () {
            this.match('>');
            this.expression();
            this.emitLn('CMP (SP)+, D0');
            this.emitLn('SLE D0');
        },

        // Parse and translate a relation
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

        // Parse and translate an expression
        // This version is a dummy
        expression: function () {
            this.emitLn('<Expression' + this.getName() + '>');
        }

    });

    /**
     * 6.6.8 Merging with expressions
     * After merging, the syntax in BNF:
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
    //{
    mergingWithExpressions = $.extend(
        true,   // deep copy
        {},     // empty target

        // 3.5
        moreExpressions.assignmentStatementsObject,

        // 6.6.7
        fullBlownRelation,

        // 3.5
        {
            expression : moreExpressions.assignmentStatementsObject.expression
        }

    );
    //}

    /**
     * 6.6.9 Change to latest expression syntax
     * <expression>   ::= <term> [<addop> <term>]*
     * <term>         ::= <signed factor> [<mulop> <factor>]*
     * <factor>       ::= <number> | (<b-expression>) | <identifier>
     */
    changeToLatestExpressionSyntax = mergingWithExpressions.extend({

        // parse and translate an expression
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

        // Parse and translate a math term
        term: function () {
            this.signedFactor();    // <--
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

        // Parse and translate the first math factor
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

        // Parse and translate a math factor
        factor: function () {
            if (this.look === '(') {
                this.match('(');
                this.boolExpression();  // <--
                this.match(')');
            } else if (this.isAlpha(this.look)) {
                this.identifier();
            } else {
                this.emitLn('MOVE #' + this.getNum() + ' ,D0');
            }
        }

    });

    /**
     * 6.7 Merging with control constructs
     * <program> ::= <block> END
     * <block> ::= [<statement>]*
     * <statement> ::= <control-statement> | <b-expression>
     */
    //{
    mergingWithControlConstructs = $.extend(
        true,   // deep copy
        {},     // empty target

        // 6.6.9
        changeToLatestExpressionSyntax,

        // 5.10
        controlConstructs.theBreakStatementObject,

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
     * <statement> ::= <control-statement> | <assignment>
     * <assignment> ::= <identifier> = <b-expression>
     */
    addingAssignments = mergingWithControlConstructs.extend({

        // Skip a CRLF
        fin: function () {
            if (this.look === this.CR) {
                this.getChar();
            }
            if (this.look === this.LF) {
                this.getChar();
            }
        },

        // Recognize and translate a statement block
        block: function (label) {
            while (this.look !== 'e' && this.look !== 'l' &&
                    this.look !== 'u') {
                this.fin();     // <--
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
                case 'b':   // <--
                    this.doBreak(label);
                    break;
                default:
                    this.assignment();
                }
                this.fin();     // <--
            }
        },

        // Parse and translate an assignment statement
        assignment: function () {
            var name = this.getName();
            this.match('=');
            this.boolExpression();  // <--
            this.emitLn('LEA ' + name + '(PC), A0');
            this.emitLn('MOVE D0, (A0)');
        }

    });

    // return main functions for executions
    return {

        // 6.6
        theParser: boundMain(theParser),

        // <b-expression>  ::= <b-literal>
        booleanLiteral: boundMain(booleanLiteral),

        // <b-expression> ::= <b-term> [<orop> <b-term>]*
        // <b-term> ::= <b-literal>
        generalExpressions: boundMain(generalExpressions),

        // <b-term> ::= <not-factor> [AND <not-factor>]*
        // <not-factor> :== <b-literal>
        andOperation: boundMain(andOperation),

        // <not-factor> ::= [NOT] <b-factor>
        // <b-factor> ::= <b-literal>
        notOperation: boundMain(notOperation),

        // <b-factor> ::= <b-literal> | <relation>
        expandTheFactor: boundMain(expandTheFactor),

        // <relation> ::= <expression> [<relop> <expression>]
        fullBlownRelation: boundMain(fullBlownRelation),

        /**
         * 6.6.8 Merging with expressions
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
        mergingWithExpressions: boundMain(mergingWithExpressions),

        /**
         * 6.6.9 Change to latest expression syntax
         * <expression>   ::= <term> [<addop> <term>]*
         * <term>         ::= <signed factor> [<mulop> <factor>]*
         * <factor>       ::= <number> | (<b-expression>) | <identifier>
         */
        changeToLatestExpressionSyntax:
                boundMain(changeToLatestExpressionSyntax),

        // 6.7
        // <program> ::= <block> END
        // <block> ::= [<statement>]*
        // <statement> ::= <control-statement> | <b-expression>
        mergingWithControlConstructs: boundMain(mergingWithControlConstructs),

        // 6.8
        // <statement> ::= <control-statement> | <assignment>
        // <assignment> ::= <identifier> = <b-expression>
        addingAssignments: boundMain(addingAssignments)

    };

    /**
     * Final results of this chapter in BNF:
     *
     * ----- program -----
     * <program> ::= <block> END
     * <block> ::= [<statement>]*
     * <statement> ::= <if> | <while> | <loop> | <repeat> |<for> |
     *                 <do> | <break> | <assignment>
     *
     * ----- control statements -----
     * <if statement> ::= IF <condition> <block> [ELSE <block>] ENDIF
     * <while statement> ::= WHILE <condition> <block> ENDWHILE
     * <loop statement> ::= LOOP <block> ENDLOOP
     * <repeat statement> ::= REPEAT <block> UNTIL <conditon>
     * <for statement> ::= FOR <ident> = <expr1> TO <expr2> <block> ENDFOR
     * <do statement> ::= DO <expression> <block> ENDDO
     * <break statement> ::= BREAK
     *
     * ----- assignment statement -----
     * <assignment statement> ::= <identifier> = <b-expression>
     *
     * ----- boolean expressions -----
     * <b-expression> ::= <b-term> [<orop> <b-term>]*
     * <b-term>       ::= <not-factor> [AND <not-factor>]*
     * <not-factor>   ::= [NOT] <b-factor>
     * <b-factor>     ::= <b-literal> | <relation>
     * <relation>     ::= <expression> [<relop> <expression>]
     *
     * ----- arithmetic expressions -----
     * <expression>   ::= <term> [<addop> <term>]*
     * <term>         ::= <signed factor> [<mulop> <factor>]*
     * <factor>       ::= <number> | (<b-expression>) | <identifier>
     * <identifier>   ::= <variable> | <function>
     */

});