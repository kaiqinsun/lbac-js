/**
 * View lbac source codes
 */

define(['jquery', 'prettify', 'marked'], function ($, prettify, marked) {
    'use strict';

    function htmlEncode(value) {
        return $('<div/>').text(value).html();
    }

    // Extract source code lines of given title
    // quick and dirty solutions
    function extractContent(title, lines) {
        var docBegin,
            docEnd,
            codeBegin,
            codeEnd;

        function getDocBegin(title, lines) {
            var begin;

            // Search for the line containing the title
            $.each(lines, function (i, line) {
                if (line.search(title) !== -1) {
                    begin = i;
                    return false;
                }
            });
            return begin;
        }

        // Look behind for previous doc begin without a code section
        function lookBehind(begin, lines) {
            var i,
                line;

            for (i = begin; i >= 0; i -= 1) {
                line = lines[i];
                if (line) {
                    if (line.indexOf('*') === -1) {
                        break;
                    }
                    if (line.indexOf('/**') > -1) {
                        begin = i;
                    }
                }
            }
            return begin;
        }

        function getDocEnd(docBegin, lines) {
            var len = lines.length,
                i;

            for (i = docBegin; i < len; i += 1) {
                if (lines[i].indexOf('*/') > -1) {
                    return i;
                }
            }
        }

        function getCodeBegin(docEnd, lines) {
            var i = docEnd + 1;

            while (!lines[i].trim()) {
                i += 1;
            }
            return i;
        }

        function getCodeEnd(codeBegin, lines) {
            var len = lines.length,
                level = 0,
                isCounting = false,
                isInComment = false,
                i,
                line;

            for (i = codeBegin; i < len; i += 1) {
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
                    return i + 1;
                }
            }
        }

        docBegin = getDocBegin(title, lines);
        docEnd = getDocEnd(docBegin, lines);
        docBegin = lookBehind(docBegin, lines);
        codeBegin = getCodeBegin(docEnd, lines);
        codeEnd = getCodeEnd(codeBegin, lines);

        return {
            docLines: lines.slice(docBegin, docEnd),
            codeLines: lines.slice(codeBegin, codeEnd)
        };
    }

    function dedent(lines, auto, offset) {
        var minIndent = Number.MAX_VALUE;

        offset = offset || 0;
        if (auto === undefined) {
            auto = true;    // default
        }

        function truncate(line) {
            return line.slice(minIndent + offset);
        }

        if (auto) {

            // Automatically find the minimum of indentation
            $.each(lines, function (i, line) {
                var index = line.search(/\S/);
                if (index > -1 && index < minIndent) {
                    minIndent = index;
                    if (minIndent === 0) {
                        return false; // break
                    }
                }
            });
        } else {
            minIndent = 0;
        }

        return lines.map(truncate);
    }

    // Set default options
    marked.setOptions({
        highlight: function (code) {
            return prettify.prettyPrintOne(htmlEncode(code));
        }
    });


    return {
        codeLines: null,
        $doc: null,
        $code: null,

        init: function (settings) {
            var that = this,
                title = settings.title,
                path = location.pathname.replace('index.html', '');

            this.$code = $('#' + settings.codeElement);
            this.$doc = $('#' + settings.docElement);

            $.ajax({
                url: path + 'ajax/lbac.src.txt',
                success: function (settings) {
                    that.codeLines = settings.split('\n');
                    that.$code.show();
                    that.update(title);
                }
            });
        },

        // Update source codes by chapter/section title
        update: function (title) {
            var content = extractContent(title, this.codeLines),
                doc = dedent(content.docLines, true, 3).join('\n'),
                code = htmlEncode(dedent(content.codeLines).join('\n'));

            this.$doc.html(marked(doc));
            this.$code.html(prettify.prettyPrintOne(code));
        }

    };

});
