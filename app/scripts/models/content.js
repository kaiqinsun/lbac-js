/* global define */

define([
    'underscore',
    'backbone',
    'prettify',
    'marked',
    'common',
    'text!src'
], function (_, Backbone, prettify, marked, common, src) {
    'use strict';

    var codeLines = src.split('\n');

    // Get the begin line index of the doc in the code lines
    var getDocBegin = _.memoize(function (title) {
        var begin;

        // Search for the line containing the title
        _.each(codeLines, function (line, i) {
            if (line.search(title) !== -1) {
                begin = i;
                return false;
            }
        });
        return begin;
    });

    // Look behind for previous doc begin without a code section
    var lookBehind = _.memoize(function (begin) {
        var i,
            line;

        for (i = begin; i >= 0; i -= 1) {
            line = codeLines[i];
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
    });

    // Get the end line index of the doc in the code lines
    var getDocEnd = _.memoize(function (docBegin) {
        var len = codeLines.length,
            i;

        for (i = docBegin; i < len; i += 1) {
            if (codeLines[i].indexOf('*/') > -1) {
                return i;
            }
        }
    });

    // Get the begin line index of the code in the code lines
    var getCodeBegin = _.memoize(function (docEnd) {
        var i = docEnd + 1;

        while (!codeLines[i].trim()) {
            i += 1;
        }
        return i;
    });

    // Get the end line index of the code in the code lines
    var getCodeEnd = _.memoize(function (codeBegin) {
        var len = codeLines.length,
            level = 0,
            isCounting = false,
            isInComment = false,
            i,
            line;

        for (i = codeBegin; i < len; i += 1) {
            line = codeLines[i];

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
    });

    // Extract content of given title
    function extractContent(title) {
        var docBegin = getDocBegin(title),
            docEnd = getDocEnd(docBegin),
            codeBegin,
            codeEnd;

        docBegin = lookBehind(docBegin);
        codeBegin = getCodeBegin(docEnd);
        codeEnd = getCodeEnd(codeBegin);

        return {
            docLines: codeLines.slice(docBegin, docEnd),
            codeLines: codeLines.slice(codeBegin, codeEnd)
        };
    }

    // Get the min leading white spaces in lines
    function getMinLeadingWhite(lines) {
        function getLeadingWhite(line) {
            var index = line.search(/\S/);
            return index > -1 ? index : Number.MAX_VALUE;
        }
        return getLeadingWhite(_.min(lines, getLeadingWhite));
    }

    // Dedent the code lines
    function dedent(lines, offset, auto) {
        var minLeadingWhite;    // min leading white spaces
        offset = offset || 0;   // offset of white spaces to dedent
        auto = auto === undefined ? true : auto; // default: true

        minLeadingWhite = auto ? getMinLeadingWhite(lines) : 0;

        return lines.map(function dedentOne(line) {
            return line.slice(minLeadingWhite + offset);
        });
    }

    // Set default options for marked, a markdown parser
    marked.setOptions({
        highlight: function (code) {
            return prettify.prettyPrintOne(_.escape(code));
        }
    });


    var ContentModel = Backbone.Model.extend({
        defaults: {
            doc: '',
            code: '',
            hasConsole: false,
            hasEditor: false
        },

        // Update the doc and code
        update: function (ch, sec) {
            var title = common.getTitle(ch, sec),
                content = extractContent(title),
                doc = dedent(content.docLines, 3).join('\n'),
                code = _.escape(dedent(content.codeLines).join('\n'));

            this.set('doc', marked(doc));
            this.set('code', prettify.prettyPrintOne(code));
        }
    });

    return ContentModel;
});
