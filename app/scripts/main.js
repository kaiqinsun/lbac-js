require.config({
    paths: {
        jquery: '../components/jquery/jquery',
        bootstrap: 'vendor/bootstrap',
        io: './io'
    },
    shim: {
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        }
    },
    packages: ['lbac']
});

require([
    'jquery', 'io', 'lbac',
    'bootstrap', 'tiny-console'
], function ($, io, lbac) {

    'use strict';

    $(document).ready(function () {

        var $c = $('#console');

        $c.tinyConsole({
            //width: '80%',
            height: 350,
            //prompt: 'hi there>',
            highlight: 'output' // 'both'
            //tabSize: 4
        });

        // setup io routines for the lbac package
        io.set({
            read: $c.tinyConsole('function', 'read'),
            readLn: $c.tinyConsole('function', 'readLn'),
            write: $c.tinyConsole('function', 'write'),
            writeLn: $c.tinyConsole('function', 'writeLn'),
            halt: $c.tinyConsole('function', 'halt')
        });

        // click event handler on accordion menu
        $('#accordion2 li').click(function (evt) {
            var $el = $(this),
                sectionTitle = $el.text().trim(),
                chapterTitle = $el.parent().parent().prev().text().trim(),
                ch,
                sec;
                
            evt.preventDefault();

            // Convert a chapter/section title to an identifier
            function titleToIdent(title) {
                var words;

                title = title.replace(/Chapter\s*\d*\s*/, '');
                title = title.replace(/\d+\.\d+\.?\d?\s*/, '');
                title = title.replace(/-/g, ' ');
                title = title.replace(/[,\/"]/g, '');
                words = title.split(' ');
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
                $('html, body').animate({
                    scrollTop: $c.offset().top
                },'slow');
                $c.tinyConsole('execute', lbac[ch][sec]);
                $c.tinyConsole('option', 'prompt', sectionTitle + '>');
                console.log('Method: "lbac.' + ch + '.' + sec + '".');
            } else {
                console.log('No such method: "lbac.' + ch + '.' + sec + '".');
            }
            $c.data('tinyConsole').$input.focus();
        });

    });

});