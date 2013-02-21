var read, readLn, write, writeLn, halt;

$(document).ready(function () {
    'use strict';

    var $c = $('#console');

    $c.tinyConsole({
        //width: '80%',
        height: 350,
        //prompt: 'hi there>',
        highlight: 'output' // 'both'
        //tabSize: 4
    });

    read = $c.tinyConsole('function', 'read');
    readLn = $c.tinyConsole('function', 'readLn');
    write = $c.tinyConsole('function', 'write');
    writeLn = $c.tinyConsole('function', 'writeLn');
    halt = $c.tinyConsole('function', 'halt');
    // $c.tinyConsole('execute', LBAC.miscellany.dealingWithSemicolons);

    $c.resizable({
        handles: 's'
    });

    $('#accordion').accordion({
        icons: {
            header: "ui-icon-circle-arrow-e",
            activeHeader: "ui-icon-circle-arrow-s"
        },
        heightStyle: 'content',
        active: 1
    });

    // click event handler on accordion menu
    $('#accordion li').click(function (event) {
        var $el = $(this),
            sectionTitle = $el.text().trim(),
            chapterTitle = $el.parent().prev().text(),
            ch,
            sec;

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
        
        if (LBAC[ch] && LBAC[ch][sec]) {
            $c.tinyConsole('execute', LBAC[ch][sec]);
            $c.tinyConsole('option', 'prompt', sectionTitle + '>');
            console.log('Method: "LBAC.' + ch + '.' + sec + '".');
        } else {
            console.log('No such method: "LBAC.' + ch + '.' + sec + '".');
        }
        $c.data('tinyConsole').$input.focus();
    });
});
