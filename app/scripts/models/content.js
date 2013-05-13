/*global define*/

define([
    'lodash',
    'backbone',
    'prettify',
    'marked',
    'common',
    'text!src'
], function (_, Backbone, prettify, marked, common, src) {
    'use strict';

    var codeLines = src.split('\n');

    // Get the begin line index of the doc in the code lines.
    var getDocBegin = _.memoize(function (title) {
        return _.findIndex(codeLines, function (line) {
            return _.contains(line, title);
        });
    });

    // Look behind for previous doc begin without a code section.
    var lookBehind = _.memoize(function (begin) {
        var i,
            line;

        for (i = begin; i >= 0; i -= 1) {
            line = codeLines[i];
            if (line) {
                if (!_.contains(line, '*')) {
                    break;
                }
                if (_.contains(line, '/**')) {
                    begin = i;
                }
            }
        }
        return begin;
    });

    // Get the end line index of the doc in the code lines.
    var getDocEnd = _.memoize(function (docBegin) {
        var lines = _.rest(codeLines, docBegin);

        return docBegin + _.findIndex(lines, function (line) {
            return _.contains(line, '*/');
        });
    });

    // Get the begin line index of the code in the code lines.
    var getCodeBegin = _.memoize(function (docEnd) {
        var begin = docEnd + 1;

        while (!codeLines[begin].trim()) {
            begin += 1;
        }
        return begin;
    });

    // Get the end line index of the code in the code lines.
    var getCodeEnd = _.memoize(function (codeBegin) {
        var len = codeLines.length,
            level = 0,
            isCounting = false,
            isInComment = false,
            i,
            line;

        for (i = codeBegin; i < len; i += 1) {
            line = codeLines[i];

            if (_.contains(line, '/*')) {
                isInComment = true;
            }
            if (_.contains(line, '*/')) {
                isInComment = false;
            }

            if (!isInComment && _.contains(line, '{')) {
                level += 1;
                isCounting = true;
            }
            if (!isInComment && _.contains(line, '}')) {
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

        // Update the doc and code based on ch and sec.
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
