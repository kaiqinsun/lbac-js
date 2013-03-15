/**
 * Console init and update routines
 */

define([
    'lbac', 'io', 'jquery',
    'tiny-console'
], function (lbac, io, $) {
    'use strict';

    var $c;

    // Convert a chapter/section title to a camelcase identifier
    function titleToIdent(title) {
        var words;

        // Filter out unnecessory characters
        title = title.replace(/Chapter\s*\d*\s*/, '');
        title = title.replace(/\d+\.\d+\.?\d?\s*/, '');
        title = title.replace(/-/g, ' ');
        title = title.replace(/[,\/"]/g, '');
        words = title.split(' ');

        // convert title words to a camelcase identifier
        $.each(words, function (i, word) {
            if (i === 0) {
                words[0] = word.toLowerCase();
            } else {
                words[i] = word.substr(0, 1).toUpperCase() +
                        word.substr(1).toLowerCase();
            }
        });
        return words.join('');
    }



    return {

        // Initialize tiny console
        init: function initConsole(consoleId) {
            $c = $('#' + consoleId);

            $c.tinyConsole({
                // width: '80%',
                height: 350,
                // prompt: 'hi there>',
                highlight: 'output' // input, output or both
                // tabSize: 4   // browser default: 8
            });

            // setup io routines for the lbac package
            io.set({
                read: $c.tinyConsole('function', 'read'),
                readLn: $c.tinyConsole('function', 'readLn'),
                write: $c.tinyConsole('function', 'write'),
                writeLn: $c.tinyConsole('function', 'writeLn'),
                halt: $c.tinyConsole('function', 'halt')
            });
        },

        // Update console prompt and execution method
        update: function (chapterTitle, sectionTitle) {
            var ch = titleToIdent(chapterTitle),
                sec = titleToIdent(sectionTitle);

            // Deal with lbac modules with secial names
            function specialCase() {

                // 7.13 Merging scanner and parser
                if (sec === 'judiciousCopying' ||
                        sec === 'mergingScannerAndParser') {
                    ch = 'kiss';
                }

                // 11.6 Conclusion: Tiny v1.1
                if (ch === 'lexicalScanRevisited' && sec === 'conclusion') {
                    ch = 'tiny_11';
                    sec = 'run';
                }
            }

            specialCase();

            if (lbac[ch] && lbac[ch][sec]) {
                $c.tinyConsole('execute', lbac[ch][sec]);
                $c.tinyConsole('option', 'prompt', sectionTitle + '>');
                $c.data('tinyConsole').$input.focus();
                return true;
            }
        }

    };
});
