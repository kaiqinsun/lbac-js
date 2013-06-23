/**
 * Chapter 8 A Little Philosophy
 * ==============================
 *
 * 8.1 Introduction
 * -----------------
 * About where we’re going with this series and some general thoughts
 * concerning the usefulness of what we’ve been doing.
 *
 * 8.2 The road home
 * -----------------
 * We have covered the parsing and translation of
 *
 * - arithmetic expressions
 * - Boolean expressions
 * - combinations connected by relational operators
 * - control constructs.
 *
 * We’ve leaned heavily on the use of **top-down, recursive descent**
 * parsing, **BNF** definitions of the syntax, and direct generation of
 * assembly-language code.
 *
 * To round out the series, we still have a few items to cover.
 * These include:
 *
 * - Procedure calls, with and without parameters
 * - Local and global variables
 * - Basic types, such as character and integer types
 * - Arrays
 * - Strings
 * - User-defined types and structures
 * - Tree-structured parsers and intermediate languages
 * - Optimization
 *
 * Two languages you will see in installments to come:
 *
 * - **TINY** A minimal, but usable language on the order of
 *   *Tiny BASIC* or *Tiny C*. It won’t be very practical,
 *   but it will have enough power to let you write and run real programs
 *   that do something worthwhile.
 *
 * - **KISS** intended to be a systems programming language.
 *   It won’t have strong typing or fancy data structures,
 *   but it will support most of the things to do with
 *   a higher order language (HOL).
 *
 * 8.3 Why is it so simple?
 * ------------------------
 * > Using the techniques we’ve used here, it is possible to build a
 * > production quality, working compiler without adding a lot of
 * > complexity to what we’ve already done.
 *
 * The areas that may have led to complexity in the past:
 *
 * - Limited RAM forcing multiple passes
 * - Batch processing
 * - Large programs
 * - Emphasis on efficiency
 * - Limited instruction sets
 * - Desire for generality
 *
 * 8.4 Conclusion
 * ---------------
 * So far, we’ve only looked at pieces of compilers,
 * and while we have many of the makings of a complete language,
 * we haven’t talked about how to put it all together.
 * That will be the subject of our next two installments.
 * Then we’ll press on into the new subjects listed at section 8.2.
 */

// { No code in this chapter }
