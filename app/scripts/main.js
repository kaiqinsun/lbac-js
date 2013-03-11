require.config({
    paths: {
        jquery: '../components/jquery/jquery',
        bootstrap: 'vendor/bootstrap',
        cookie: '../components/jquery.cookie/jquery.cookie',
        prettify: '../components/google-code-prettify/src/prettify',
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
    'jquery', 'io', 'lbac', 'prettify',
    'bootstrap', 'cookie', 'tiny-console'
], function ($, io, lbac, prettify) {
    'use strict';

    $(document).ready(function () {

        var $c = $('#console'),         // cache
            $s = $('#source-codes'),    // cache
            SourceCodeLines;            // all lbac source codes concated

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

        // Update source codes by chapter/section title
        function updateSourceCodes(title, sourceLines) {
            var contentLines,
                contents;

            function htmlEncode(value) {
                return $('<div/>').text(value).html();
            }

            // Extract source code lines of given title
            // quick and dirty solutions
            function extractLines(title, lines) {
                var begin,
                    end;

                function getEndLine(begin) {
                    var len = lines.length,
                        level = 0,
                        isCounting = false,
                        isInComment = false,
                        i,
                        line;

                    for (i = begin; i < len; i += 1) {
                        line = lines[i];

                        if (line.indexOf('/*') > -1) {
                            isInComment = true;
                        }
                        if (line.indexOf('*/') > -1) {
                            isInComment = false;
                        }

                        if (!isInComment && line.indexOf('{') > -1) {
                            level += 1;
                            isCounting = true;
                        }
                        if (!isInComment && line.indexOf('}') > -1) {
                            level -= 1;
                        }
                        if (isCounting && level === 0) {
                            return i;
                        }
                    }
                }

                $.each(lines, function (i, line) {
                    if (line.search(title) !== -1) {
                        begin = i - 1;
                        return false;
                    }
                });

                end = getEndLine(begin);

                return lines.slice(begin, end + 1);
            }

            function autoDedent(lines) {
                var minIndent = Number.MAX_VALUE;

                function truncate(line) {
                    return line.slice(minIndent);
                }

                $.each(lines, function (i, line) {
                    var index = line.search(/\S/);
                    if (index > -1 && index < minIndent) {
                        minIndent = index;
                        if (minIndent === 0) {
                            return false; // break
                        }
                    }
                });

                return lines.map(truncate);
            }

            function isChapter() {
                return title.indexOf('Chapter') > -1;
            }

            contentLines = extractLines(title, sourceLines);
            if (!isChapter()) {
                contentLines = autoDedent(contentLines);
            }
            contents = htmlEncode(contentLines.join('\n'));
            $s.html(prettify.prettyPrintOne(contents));
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

        // Click event handler on accordion menu
        function attachMenuClickHandler() {

            // Chapter toggle button
            $('#accordion2 .accordion-toggle').click(function () {
                var chapterTitle = $(this).text().trim();
                $c.slideUp();   // hide console
                updateSourceCodes(chapterTitle, SourceCodeLines);

                // save the menu state with cookie
                $.cookie('chapterTitle', chapterTitle, { expires: 60 });
                $.cookie('sectionTitle', '', { expires: 60 });
            });

            // Section nav
            $('#accordion2 li').click(function (evt) {
                var $el = $(this),
                    sectionTitle = $el.text().trim(),
                    chapterTitle = $el.parent().parent().prev().text().trim(),
                    success;

                evt.preventDefault();

                $c.slideDown(); // show console
                success = updateConsole(chapterTitle, sectionTitle);
                if (success) {

                    // scroll to the top of console
                    $('html, body').animate({
                        scrollTop: $c.offset().top - 20
                    }, 'slow');

                    updateSourceCodes(sectionTitle, SourceCodeLines);

                    // save the menu state with cookie
                    $.cookie('chapterTitle', chapterTitle, { expires: 60 });
                    $.cookie('sectionTitle', sectionTitle, { expires: 60 });
                }
            });
        }

        // restore the page state using cookie
        function restorePageState() {
            var chapterTitle = $.cookie('chapterTitle'),
                sectionTitle = $.cookie('sectionTitle');

            function getChapterId(title) {
                return '#ch' + title.match(/\d+/g)[0];
            }

            if (chapterTitle) {
                $(getChapterId(chapterTitle)).collapse('show');
                if (sectionTitle) {
                    updateConsole(chapterTitle, sectionTitle);
                    return sectionTitle;
                } else {
                    $c.hide();
                    return chapterTitle;
                }

            }

            // First time at section 2.2
            $('#ch1').collapse('show');
            $c.hide();
            return chapterTitle;
        }

        function init() {
            var title;

            initConsole();
            attachMenuClickHandler();
            title = restorePageState();
            $.ajax({
                url: '../ajax/lbac.src.txt',
                success: function (data) {
                    SourceCodeLines = data.split('\n');
                    $s.show();
                    updateSourceCodes(title, SourceCodeLines);
                }
            });
        }

        init();

    });

});