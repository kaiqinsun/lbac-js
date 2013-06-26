/*global define*/

define(['lodash'], function (_) {
    'use strict';

    // Table of Content
    // Note that for each item in sections, default
    // console = true, editor = false.
    var toc = [
        {
            ch: 0,
            title: 'Prologue',
            sections: [
                {
                    sec: '',
                    title: 'The base object',
                    disabled: true
                }
            ]
        },
        {
            ch: 1,
            title: 'Introduction',
            sections: [
                {
                    sec: '1.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '1.2',
                    title: 'The cradle',
                    disabled: true
                }
            ]
        },
        {
            ch: 2,
            title: 'Expression Parsing',
            sections: [
                {
                    sec: '2.1',
                    title: 'Getting started',
                    disabled: true
                },
                {
                    sec: '2.2',
                    title: 'Single digits'
                },
                {
                    sec: '2.3',
                    title: 'Binary expressions'
                },
                {
                    sec: '2.4',
                    title: 'General expressions'
                },
                {
                    sec: '2.5',
                    title: 'Using the stack'
                },
                {
                    sec: '2.6',
                    title: 'Multiplication and division'
                },
                {
                    sec: '2.7',
                    title: 'Parentheses'
                },
                {
                    sec: '2.8',
                    title: 'Unary minus'
                },
                {
                    sec: '2.9',
                    title: 'A word about optimization',
                    disabled: true
                }
            ]
        },
        {
            ch: 3,
            title: 'More Expressions',
            sections: [
                {
                    sec: '3.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '3.2',
                    title: 'Variables'
                },
                {
                    sec: '3.3',
                    title: 'Functions'
                },
                {
                    sec: '3.4',
                    title: 'More on error handling'
                },
                {
                    sec: '3.5',
                    title: 'Assignment statements'
                },
                {
                    sec: '3.6',
                    title: 'Multi-character tokens'
                },
                {
                    sec: '3.7',
                    title: 'White space'
                }
            ]
        },
        {
            ch: 4,
            title: 'Interpreters',
            sections: [
                {
                    sec: '4.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '4.2',
                    title: 'The interpreters',
                    disabled: true
                },
                {
                    sec: '4.2.1',
                    title: 'Single digits'
                },
                {
                    sec: '4.2.2',
                    title: 'Addition and subtraction'
                },
                {
                    sec: '4.2.3',
                    title: 'Multiplication and division'
                },
                {
                    sec: '4.2.4',
                    title: 'Multi-digits number'
                },
                {
                    sec: '4.2.5',
                    title: 'Factor'
                },
                {
                    sec: '4.3',
                    title: 'A little philosophy',
                    disabled: true
                },
                {
                    sec: '4.3.1',
                    title: 'Variables'
                },
                {
                    sec: '4.3.2',
                    title: 'Assignment statements'
                },
                {
                    sec: '4.3.3',
                    title: 'Multiple statements',
                    editor: true
                },
                {
                    sec: '4.3.4',
                    title: 'I/O routines',
                    editor: true
                }
            ]
        },
        {
            ch: 5,
            title: 'Control Constructs',
            sections: [
                {
                    sec: '5.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '5.2',
                    title: 'The plan',
                    disabled: true
                },
                {
                    sec: '5.2.1',
                    title: 'One statement'
                },
                {
                    sec: '5.2.2',
                    title: 'More than one statement'
                },
                {
                    sec: '5.3',
                    title: 'Some groundwork',
                    console: false
                },
                {
                    sec: '5.4',
                    title: 'The IF statement'
                },
                {
                    sec: '5.4.2',
                    title: 'Add the ELSE clause'
                },
                {
                    sec: '5.5',
                    title: 'The WHILE statement'
                },
                {
                    sec: '5.6',
                    title: 'The LOOP statement'
                },
                {
                    sec: '5.7',
                    title: 'The Repeat-Until statement'
                },
                {
                    sec: '5.8',
                    title: 'The FOR loop'
                },
                {
                    sec: '5.9',
                    title: 'The DO statement'
                },
                {
                    sec: '5.10',
                    title: 'The BREAK statement'
                },
                {
                    sec: '5.11',
                    title: 'Conclusion'
                }
            ]
        },
        {
            ch: 6,
            title: 'Boolean Expressions',
            sections: [
                {
                    sec: '6.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '6.2',
                    title: 'The plan',
                    disabled: true
                },
                {
                    sec: '6.3',
                    title: 'The grammar',
                    disabled: true
                },
                {
                    sec: '6.4',
                    title: 'Relops',
                    disabled: true
                },
                {
                    sec: '6.5',
                    title: 'Fixing the grammar',
                    disabled: true
                },
                {
                    sec: '6.6',
                    title: 'The parser',
                    disabled: true
                },
                {
                    sec: '6.6.1',
                    title: 'Boolean literal 1'
                },
                {
                    sec: '6.6.2',
                    title: 'Boolean literal 2'
                },
                {
                    sec: '6.6.3',
                    title: 'OR operation'
                },
                {
                    sec: '6.6.4',
                    title: 'AND operation'
                },
                {
                    sec: '6.6.5',
                    title: 'NOT operation'
                },
                {
                    sec: '6.6.6',
                    title: 'Expand the factor'
                },
                {
                    sec: '6.6.7',
                    title: 'Full-blown relation'
                },
                {
                    sec: '6.6.8',
                    title: 'Merging with expressions'
                },
                {
                    sec: '6.6.9',
                    title: 'Change to latest expression syntax'
                },
                {
                    sec: '6.7',
                    title: 'Merging with control constructs'
                },
                {
                    sec: '6.8',
                    title: 'Adding assignments',
                    editor: true
                },
                {
                    sec: '6.9',
                    title: 'Conclusion'
                }
            ]
        },
        {
            ch: 7,
            title: 'Lexical Scanning',
            sections: [
                {
                    sec: '7.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '7.2',
                    title: 'Lexical scanning',
                    disabled: true
                },
                {
                    sec: '7.3',
                    title: 'State machines and alternatives',
                    disabled: true
                },
                {
                    sec: '7.4',
                    title: 'Some experiments in scanning'
                },
                {
                    sec: '7.5',
                    title: 'White space'
                },
                {
                    sec: '7.6',
                    title: 'State machines',
                    disabled: true
                },
                {
                    sec: '7.7',
                    title: 'Newlines',
                    editor: true
                },
                {
                    sec: '7.8',
                    title: 'Operators',
                    editor: true
                },
                {
                    sec: '7.9',
                    title: 'Lists, commas and command lines',
                    editor: true
                },
                {
                    sec: '7.10',
                    title: 'Getting fancy'
                },
                {
                    sec: '7.10.2',
                    title: 'Returning codes',
                    editor: true
                },
                {
                    sec: '7.10.3',
                    title: 'Cleanup with global',
                    editor: true
                },
                {
                    sec: '7.11',
                    title: 'Returning a character',
                    editor: true
                },
                {
                    sec: '7.12',
                    title: 'Distributed vs centralized scanners',
                    console: false
                },
                {
                    sec: '7.13',
                    title: 'Merging scanner and parser',
                    disabled: true
                },
                {
                    sec: '7.13.1',
                    title: 'Judicious copying',
                    editor: true
                },
                {
                    sec: '7.13.2',
                    title: 'Merging scanner and parser',
                    editor: true
                },
                {
                    sec: '7.14',
                    title: 'Conclusion',
                    disabled: true
                },
            ]
        },
        {
            ch: 8,
            title: 'A Little Philosophy',
            sections: [
                {
                    sec: '8.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '8.2',
                    title: 'The road home',
                    disabled: true
                },
                {
                    sec: '8.3',
                    title: 'Why is it so simple',
                    disabled: true
                },
                {
                    sec: '8.4',
                    title: 'Conclusion',
                    disabled: true
                }
            ]
        },
        {
            ch: 9,
            title: 'A Top View',
            sections: [
                {
                    sec: '9.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '9.2',
                    title: 'The top level',
                    disabled: true
                },
                {
                    sec: '9.3',
                    title: 'The structure of Pascal'
                },
                {
                    sec: '9.4',
                    title: 'Fleshing it out'
                },
                {
                    sec: '9.5',
                    title: 'Declarations'
                },
                {
                    sec: '9.6',
                    title: 'The structure of C'
                }
            ]
        },
        {
            ch: 10,
            title: 'Introducing "Tiny"',
            sections: [
                {
                    sec: '10.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '10.2',
                    title: 'Getting started',
                    disabled: true
                },
                {
                    sec: '10.2.1',
                    title: 'First step'
                },
                {
                    sec: '10.2.2',
                    title: 'The main program'
                },
                {
                    sec: '10.3',
                    title: 'Declarations'
                },
                {
                    sec: '10.4',
                    title: 'Declarations and symbols'
                },
                {
                    sec: '10.4.2',
                    title: 'Variable list'
                },
                {
                    sec: '10.5',
                    title: 'Initializers'
                },
                {
                    sec: '10.5.2',
                    title: 'Multi-digit integer'
                },
                {
                    sec: '10.6',
                    title: 'The symbol table'
                },
                {
                    sec: '10.7',
                    title: 'Executable statements'
                },
                {
                    sec: '10.7.2',
                    title: 'Code generation routines',
                    console: false
                },
                {
                    sec: '10.7.3',
                    title: 'Assignment statement'
                },
                {
                    sec: '10.8',
                    title: 'Booleans',
                    disabled: true
                },
                {
                    sec: '10.8.1',
                    title: 'More code generation routines',
                    console: false
                },
                {
                    sec: '10.8.2',
                    title: 'Boolean expressions'
                },
                {
                    sec: '10.9',
                    title: 'Control structures'
                },
                {
                    sec: '10.10',
                    title: 'Lexical scanning',
                    editor: true
                },
                {
                    sec: '10.11',
                    title: 'Multi-character variable names',
                    disabled: true
                },
                {
                    sec: '10.12',
                    title: 'More relops',
                    editor: true
                },
                {
                    sec: '10.13',
                    title: 'Input / Output',
                    editor: true
                },
                {
                    sec: '10.14',
                    title: 'Conclusion',
                    console: false
                }
            ]
        },
        {
            ch: 11,
            title: 'Lexical Scan Revisited',
            sections: [
                {
                    sec: '11.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '11.2',
                    title: 'Background',
                    disabled: true
                },
                {
                    sec: '11.3',
                    title: 'The problem',
                    disabled: true
                },
                {
                    sec: '11.4',
                    title: 'The solution',
                    editor: true
                },
                {
                    sec: '11.4.2',
                    title: 'Single-character operators',
                    console: false
                },
                {
                    sec: '11.5',
                    title: 'Fixing up the compiler',
                    disabled: true
                },
                {
                    sec: '11.6',
                    title: 'Conclusion',
                    editor: true
                }
            ]
        },
        {
            ch: 12,
            title: 'Miscellany',
            sections: [
                {
                    sec: '12.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '12.2',
                    title: 'Semicolons',
                    disabled: true
                },
                {
                    sec: '12.3',
                    title: 'Syntatic sugar',
                    disabled: true
                },
                {
                    sec: '12.4',
                    title: 'Dealing with semicolons',
                    disabled: true
                },
                {
                    sec: '12.4.1',
                    title: 'The C version',
                    editor: true
                },
                {
                    sec: '12.4.2',
                    title: 'The Pascal version',
                    editor: true
                },
                {
                    sec: '12.5',
                    title: 'A compromise',
                    editor: true
                },
                {
                    sec: '12.6',
                    title: 'Comments',
                    disabled: true
                },
                {
                    sec: '12.7',
                    title: 'Single character delimiters',
                    disabled: true
                },
                {
                    sec: '12.7.1',
                    title: 'Strip the comments out',
                    editor: true
                },
                {
                    sec: '12.7.2',
                    title: 'The conventional treatment',
                    editor: true
                },
                {
                    sec: '12.7.3',
                    title: 'Nested comments',
                    editor: true
                },
                {
                    sec: '12.8',
                    title: 'Multi character delimiters',
                    editor: true
                },
                {
                    sec: '12.9',
                    title: 'One sided comments',
                    editor: true
                },
                {
                    sec: '12.10',
                    title: 'Conclusion',
                    console: false
                },
            ]
        },
        {
            ch: 13,
            title: 'Procedures',
            sections: [
                {
                    sec: '13.1',
                    title: 'Introduction',
                    disabled: true
                },
                {
                    sec: '13.2',
                    title: 'One last digression',
                    disabled: true
                },
                {
                    sec: '13.3',
                    title: 'The basics',
                    disabled: true
                },
                {
                    sec: '13.4',
                    title: 'A basis for experimentation'
                },
                {
                    sec: '13.5',
                    title: 'Declarating a procedure'
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
            ]
        },
        {
            ch: 14,
            title: 'Types',
            sections: [
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
            ]
        },
        {
            ch: 15,
            title: 'Back to The Future',
            sections: [
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
            ]
        },
        {
            ch: 16,
            title: 'Unit Construction',
            sections: [
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
                {
                    sec: '',
                    title: ''
                },
            ]
        },
    ];

    return _.each(toc, function (chapter) {
        _.each(chapter.sections, function (section) {
            section.ch = chapter.ch;
            section.disabled = section.disabled || false;
        });
    });
});
