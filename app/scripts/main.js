require.config({
    paths: {
        jquery: '../components/jquery/jquery',
        bootstrap: 'vendor/bootstrap',
        cookie: '../components/jquery.cookie/jquery.cookie',
        io: './io'
    },
    shim: {
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        },
        cookie: {
            deps: ['jquery'],
            exports: 'jquery'
        }
    },
    packages: ['lbac']
});

require([
    'jquery', 'io', 'lbac',
    'bootstrap', 'cookie', 'tiny-console'
], function ($, io, lbac) {
    'use strict';

    $(document).ready(function () {

        var $c = $('#console');

        // Update console prompt and execution method
        function updateConsole(chapterTitle, sectionTitle) {
            var ch, sec;

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

            // Deal with modules with secial names
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

            ch = titleToIdent(chapterTitle);
            sec = titleToIdent(sectionTitle);
            specialCase();

            if (lbac[ch] && lbac[ch][sec]) {
                $c.tinyConsole('execute', lbac[ch][sec]);
                $c.tinyConsole('option', 'prompt', sectionTitle + '>');
                $c.data('tinyConsole').$input.focus();
                return true;
            }
        }

        function initConsole() {
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
        }

        // click event handler on accordion menu
        function attachMenuClickHandler() {
            $('#accordion2 li').click(function (evt) {
                var $el = $(this),
                    sectionTitle = $el.text().trim(),
                    chapterTitle = $el.parent().parent().prev().text().trim(),
                    success;

                evt.preventDefault();

                success = updateConsole(chapterTitle, sectionTitle);
                if (success) {

                    // scroll to the top of console
                    $('html, body').animate({
                        scrollTop: $c.offset().top - 20
                    }, 'slow');

                    // save the menu state with cookie
                    $.cookie('chapterTitle', chapterTitle, { expires: 60 });
                    $.cookie('sectionTitle', sectionTitle, { expires: 60 });
                }
            });
        }

        // restore the page state using cookie
        function restorePageState() {
            var chapterTitle = $.cookie('chapterTitle'),
                sectionTitle = $.cookie('sectionTitle'),
                chapterId;

            function getChapterNumber(title) {
                return title.match(/\d+/g)[0];
            }

            if (chapterTitle && sectionTitle) {
                chapterId = '#ch' + getChapterNumber(chapterTitle);
                $(chapterId).collapse('show');
                $('li', chapterId).each(function (i, el) {
                    if ($(el).text() === sectionTitle) {
                        updateConsole(chapterTitle, sectionTitle);
                        return false;   // break
                    }
                });
            } else {

                // First time at section 2.2
                $('#ch2').collapse('show');
                updateConsole('expression parsing', 'single digits');
            }
        }

        function init() {
            initConsole();
            attachMenuClickHandler();
            restorePageState();
        }

        init();

    });

});