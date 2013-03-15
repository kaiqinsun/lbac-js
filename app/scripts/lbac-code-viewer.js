/**
 * View lbac source codes
 */

define(['jquery', 'prettify'], function ($, prettify) {
    'use strict';

    function htmlEncode(value) {
        return $('<div/>').text(value).html();
    }

    function isChapter(title) {
        return title.indexOf('Chapter') > -1;
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


    return {
        codeLines: null,
        $el: null,

        init: function (data) {
            var that = this,
                title = data.title,
                path = location.pathname.replace('index.html', '');

            this.$el = $('#' + data.element);

            $.ajax({
                url: path + 'ajax/lbac.src.txt',
                success: function (data) {
                    that.codeLines = data.split('\n');
                    that.$el.show();
                    that.update(title);
                }
            });
        },

        // Update source codes by chapter/section title
        update: function (title) {
            var contentLines = extractLines(title, this.codeLines),
                contents;

            if (!isChapter(title)) {
                contentLines = autoDedent(contentLines);
            }
            contents = htmlEncode(contentLines.join('\n'));
            this.$el.html(prettify.prettyPrintOne(contents));
        }
    };

});
