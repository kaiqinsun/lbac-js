/** Tiny console, a jQuery plugin
 * Author: Malcom Wu
 * version: 0.3 (2012-11-20)
 * change log: Empty contenteditable tag only works properly in firefox in
 * the previous version. The workaround in this version is to prevent from
 * an empty content. It works in all current major browers.
 * (Tested in windows)
 *
 * version: 0.4 (2012-11-29)
 * change log: add highlighter
 *
 * version: 0.4.1 (2013-1-23)
 * change log: coding style refactoring
 */

(function ($) {
    'use strict';

    var LF = '\n';

    // function htmlEncode(value) {
        // return $('<div/>').text(value).html();
    // }
    
    function htmlEncode(text) {
        var replacements = [
            //[/&/g, "&amp;"], [/"/g, "&quot;"],
            [/</g, "&lt;"], [/>/g, "&gt;"]
        ];
        $.each(replacements, function (i, replace) {
            text = text.replace(replace[0], replace[1]);
        });
        return text;
    }

    function setCaretAt($el, pos) {
        var range = document.createRange(),
            sel = window.getSelection(),
            row = 0,
            node;

        $el.contents().each(function () {
            var length = $(this).text().length;

            if (this.nodeName.toUpperCase() === 'BR') {
                length = 1; // '\n'
            }
            if (length >= pos) {
                return false; // break
            }
            pos -= length;
            row += 1;
        });

        node = $el[0].childNodes[row];
        if (node.nodeType !== 3) {
            node = node.firstChild;
        }
        range.setStart(node, pos);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function caretPosition($el) {
        var range = window.getSelection().getRangeAt(0),
            node = range.startContainer,
            position = range.startOffset;

        $el.contents().each(function () {
            if (this === node || this.firstChild === node) {
                return false; // break
            }
            position += $(this).text().length;
        });

        return position;
    }

    function setCaretToEnd($el) {
        setCaretAt($el, $el.text().length);
    }

    function SyntaxHighlighter() {
        var rules = [];

        function formatWithClass(className) {
            return '<span class="' + className + '">$&</span>';
        }

        function matchRules(text) {
            var result = {};

            result.index = Number.MAX_VALUE;

            $.each(rules, function (i, rule) {
                var index = text.search(rule.pattern);
                if (index >= 0 && index < result.index) {
                    result.index = index;
                    result.match = text.match(rule.pattern)[0];
                    result.length = result.match.length;
                    result.format = rule.format;
                }
                if (index === 0) {
                    return false; // break
                }
            });

            if (result.index === Number.MAX_VALUE) {
                result.index = -1;
            }

            return result;
        }

        this.addRule = function (rule) {
            rules.push({
                pattern: rule.pattern,
                format: formatWithClass(rule['class'])
            });
        };

        this.addRules = function (patterns, className) {
            var format = formatWithClass(className);

            $.each(patterns, function (i, pattern) {
                rules.push({
                    pattern: pattern,
                    format: format
                });
            });
        };

        this.highlightElement = function ($el) {
            var rest = htmlEncode($el.text()),
                result = matchRules(rest),
                newHtml = '',
                front;

            while (result.index >= 0) {
                front = rest.substr(0, result.index + result.length);
                rest = rest.substr(result.index + result.length);
                newHtml += front.replace(result.match, result.format);
                result = matchRules(rest);
            }

            newHtml += rest;
            $el.html(newHtml);
        };
    }

    function M68kHighlighter($element) {
        var keywordPatterns = [
                /\bEND\b/, /\bMOVE\b/, /\bADD\w?\b/, /\bSUB\w?\b/, /\bNEG\b/,
                /\bEXG\b/,
                /\bMUL\w?\b/, /\bDIV\w?\b/, /\bBSR\b/, /\bLEA\b/, /\bCMP\b/,
                /\bCLR\b/, /\b.?OR\b/, /\bAND\b/,
                /\bSEQ\b/, /\bSNE\b/, /\bSGE\b/, /\bSLE\b/, /\bTST\b/,
            ],
            branchPatterns = [/\bBEQ\b/, /\b\w?BRA\b/, /\bBGT\b/],
            keywordClass = 'm68k-keyword',
            branchClass = 'm68k-branch',
            labelRule = {
                pattern: /\bL\d+:?/,
                'class': 'm68k-label'
            },
            errorRule = {
                pattern: /Error:(.*?)\n/,
                'class': 'm68k-error'
            };

        this.addRules(keywordPatterns, keywordClass);
        this.addRules(branchPatterns, branchClass);
        this.addRule(labelRule);
        this.addRule(errorRule);

        this.highlight = function () {
            this.highlightElement($element);
        };
    }

    M68kHighlighter.prototype = new SyntaxHighlighter();

    function InputHighlighter($element) {
        this.addRule({
            pattern: /[bl]/,
            'class': 'compiler-middle'
        });
        this.addRule({
            pattern: /[dfiwpr]/,
            'class': 'compiler-start'
        });
        this.addRule({
            pattern: /[eu]/,
            'class': 'compiler-end'
        });

        this.highlight = function () {
            var pos = caretPosition($element);
            this.highlightElement($element);
            setCaretAt($element, pos);
        };
    }

    InputHighlighter.prototype = new SyntaxHighlighter();

    function updateConsole(data) {
        if ('outputHighlighter' in data) {
            data.outputHighlighter.highlight();
        }
        // clone the active console entry and insert before itself
        var $entryClone = data.$entry.clone(),
            $inputClone = $('.entry-input', $entryClone),
            $outputClone = $('.entry-output', $entryClone),
            html = $inputClone.html();

        $inputClone.attr('contenteditable', 'false').html(html + '<br>');
        if ($outputClone.html() === '') {
            $outputClone.remove();
        }
        $entryClone.insertBefore(data.$entry);

        // refresh input and output
        data.$output.html('');
        data.$input.html(' ');

        // scroll to the bottom of the console
        data.target.scrollTop(data.target.prop('scrollHeight'));
        setCaretToEnd(data.$input);
        data.$input.focus();
    }

    function consoleKeydown(e) {
        var data = $(this).data('tinyConsole'),
            inputLength = data.$input.text().length;

        if (e.keyCode === 13) {

            // Enter
            e.preventDefault();
            data.stream.update(data.$input.text() + LF);
            data.history.update();
            try {
                data.execute();
            } catch (err) {
                // console.log(err);
            }
            updateConsole(data);
        } else if (e.keyCode === 9) {

            // Tab
            try {
                document.execCommand('insertHtml', false, '\t');
                e.preventDefault();
            } catch (ex) {}
        } else if ((e.keyCode === 37 || e.keyCode === 8) &&
                caretPosition(data.$input) === 1) {

            // (Left arrow or backspace) and caret at 1
            e.preventDefault();
        } else if (e.keyCode === 39) {

            // Right arrow and caret at end
            if (caretPosition(data.$input) === inputLength) {
                e.preventDefault();
            } else if (caretPosition(data.$input) === inputLength - 1) {
                e.preventDefault();
                setCaretToEnd(data.$input);
            }
        } else if (e.keyCode === 38) {

            // Up arrow
            e.preventDefault();
            data.history.scrollUp();
        } else if (e.keyCode === 40) {

            // Down arrow
            e.preventDefault();
            data.history.scrollDown();
        }
        data.$input[0].normalize();
    }

    function adjustCaret($el) {
        if (caretPosition($el) <= 1) {
            setCaretAt($el, 1);
        }
    }

    function consoleClick(e) {
        var data = $(this).data('tinyConsole');
        data.$input.focus();
        adjustCaret(data.$input);
    }

    var methods = { // Note: 'this' refers to jQuery object

        init: function (options) {

            // Create some defaults, extending them with
            // any options that were provided
            var settings = $.extend({
                prompt: '>>>'
            }, options);
            
            function addEditor($console) {
                var $runButton = $('<button/>').text('Run'),
                    $editor = $('<textarea/>');

                $console.after($editor, $runButton);
                    
                $runButton.click(function () {
                    var data =  $console.data('tinyConsole');
                    data.$input.text(' \n' + $editor.val())
                    data.stream.update(' '+ $editor.val());
                    data.history.update();
                    try {
                        data.execute();
                    } catch (err) {
                        // console.log(err);
                    }
                    updateConsole(data);

                });
            }

            return this.each(function () {
                var $this = $(this),
                    data = $this.data('tinyConsole');

                // If the plugin hasn't been initialized yet
                if (!data) {
                
                    if ('width' in settings) {
                        $this.width(settings.width);
                    }
                    if ('height' in settings) {
                        $this.height(settings.height);
                    }
                    $this.addClass('tiny-console');
                    var $entry = $('<div />').addClass('console-entry'),
                        $prompt = $('<pre />').addClass('entry-prompt')
                                .text(settings.prompt),
                        $input = $('<pre />').addClass('entry-input')
                                .attr('contenteditable', 'true').html(' '),
                        $output = $('<pre />').addClass('entry-output');

                    $this.append($entry.append($prompt).append($input)
                            .append($output));
                    if ('tabSize' in settings) {
                        var s = settings.tabSize.toString();
                        $('pre', $entry).css({
                            '-moz-tab-size': s,
                            '-o-tab-size': s,
                            'tab-size': s
                        });
                    }
                    var highlightInput = false,
                        highlightOutput = false;
                    if ('highlight' in settings) {
                        switch (settings.highlight) {
                        case 'input':
                            highlightInput = true;
                            break;
                        case 'output':
                            highlightOutput = true;
                            break;
                        case 'both':
                            highlightInput = highlightOutput = true;
                            break;
                        }
                    }

                    $input.focus();
                    setCaretAt($input, 1);
                    $input.bind('focus.tinyConsole', function (e) {
                        adjustCaret($(e.target));
                    });
                    $this.bind('keydown.tinyConsole', consoleKeydown);
                    $this.bind('click.tinyConsole', consoleClick);

                    var consoleData = {
                        target: $this,
                        $entry: $entry,
                        $prompt: $prompt,
                        $input: $input,
                        $output: $output,
                        
                        stream: {
                            content: '',
                            offset: 1,

                            update: function (text) {
                                this.content = text;
                                this.offset = 1;
                            },

                            read: function () {
                                var offset = this.offset;
                                if (offset === this.content.length) {
                                    $.error('End of input stream');
                                }
                                this.offset += 1;
                                return this.content.charAt(offset);
                            },
                            
                            readLn: function () {
                                this.offset = 1;
                                return this.content.substring(1,
                                        this.content.length - 1);
                            }
                        },
                        
                        history: {
                            content: [],
                            position: -1,

                            last: function () {
                                return this.content[this.content.length - 1];
                            },

                            update: function () {
                                var stream = consoleData.stream,
                                    streamWithoutLF = stream.content.substr(0,
                                        stream.content.length - LF.length);

                                if (streamWithoutLF !== ' ' &&
                                        streamWithoutLF !== this.last()) {
                                    this.content.push(streamWithoutLF);
                                }
                                this.position = this.content.length;
                            },

                            scrollUp: function () {
                                if (this.position <= 0) {
                                    return;
                                }
                                this.position -= 1;
                                $input.text(this.content[this.position]);
                                setCaretToEnd($input);
                            },

                            scrollDown: function () {
                                if (this.position === this.content.length - 1) {
                                    return;
                                }
                                this.position += 1;
                                $input.text(this.content[this.position]);
                                setCaretToEnd($input);
                            }
                        }
                    };

                    if (highlightOutput) {
                        consoleData.outputHighlighter =
                                new M68kHighlighter($output);
                    }
                    if (highlightInput) {
                        consoleData.inputHighlighter =
                                new InputHighlighter($input);
                        $this.bind('keyup.tinyConsole', function () {
                            consoleData.inputHighlighter.highlight();
                        });
                    }

                    $this.data('tinyConsole', consoleData);

                    // exprimental
                    addEditor($this);
                
                }
            });
        },

        destroy: function () {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('tinyConsole');
                // Namespacing FTW
                $(window).unbind('.tinyConsole');
                $this.removeData('tinyConsole');
            });
        },

        option: function (key, value) {
            var data = this.data('tinyConsole');
            if (key === 'prompt') {
                data.$prompt.text(value);
            }
            // TODO
        },
        
        read: function () {
            var data = this.data('tinyConsole'),
                result;
            try {
                result = data.stream.read();
            } catch(err) {
                methods.writeLn.call(this, 'Error: End of Input Stream.');
            }
            return result;
        },
        
        readLn: function () {
            var data = this.data('tinyConsole');
            return data.stream.readLn();
        },

        write: function () {
            var str = Array.prototype.slice.call(arguments).join('');
            return this.each(function () {
                var data = $(this).data('tinyConsole');
                data.$output.append(htmlEncode(str));
            });
        },

        writeLn: function () {
            var args = Array.prototype.slice.call(arguments);
            args.push(LF);
            methods.write.apply(this, args);
        },

        halt: function () {
            throw 'Halt.';
        },

        'function': function (name) {
            return $.proxy(methods[name], this);
        },

        execute: function (fn) {
            return this.each(function () {
                var data = $(this).data('tinyConsole');
                data.execute = fn;
            });
        }

    };

    $.fn.tinyConsole = function (method) {

        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this,
                    Array.prototype.slice.call(arguments, 1));
        }
        if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        }
        $.error('Method ' + method + ' does not exist on jQuery.tinyConsole');
    };

}(jQuery));
