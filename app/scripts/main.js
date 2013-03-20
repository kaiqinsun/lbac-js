require.config({
    paths: {
        jquery: '../components/jquery/jquery',
        bootstrap: 'vendor/bootstrap',
        cookie: '../components/jquery.cookie/jquery.cookie',
        prettify: '../components/google-code-prettify/src/prettify',
        marked: '../components/marked/lib/marked'
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
    'jquery', 'lbac-console', 'lbac-code-viewer',
    'bootstrap', 'cookie'
], function ($, lbacConsole, lbacCodeViewer) {
    'use strict';

    $(document).ready(function () {

        var consoleId = 'console',
            docId = 'doc',
            codeId = 'code',
            editorId = 'editor',
            runButtonId = 'run-button',
            $ca = $('#console-area'),
            $d = $('#' + docId);

        // Click event handler on accordion menu
        function attachMenuClickHandler() {

            // Chapter toggle button
            $('#accordion2 .accordion-toggle').click(function () {
                var chapterTitle = $(this).text().trim();
                $ca.slideUp();   // hide console
                lbacCodeViewer.update(chapterTitle);

                // save the menu state with cookie
                $.cookie('chapterTitle', chapterTitle, { expires: 60 });
                $.cookie('sectionTitle', '', { expires: 60 });
            });

            // Section nav list
            $('#accordion2 li').click(function (evt) {
                var $el = $(this),
                    sectionTitle = $el.text().trim(),
                    chapterTitle = $el.parent().parent().prev().text().trim(),
                    success;

                evt.preventDefault();
                $ca.slideDown(); // show console
                success = lbacConsole.update(chapterTitle, sectionTitle);

                if (success) {

                    // scroll to the top of console
                    $('html, body').animate({
                        scrollTop: $d.offset().top - 20
                    }, 'slow');

                    lbacCodeViewer.update(sectionTitle);

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
                var matched = title.match(/\d+/g),
                    n = matched ? matched[0] : 0;

                return '#ch' + n;
            }

            if (chapterTitle) {
                $(getChapterId(chapterTitle)).collapse('show');

                if (sectionTitle) {
                    lbacConsole.update(chapterTitle, sectionTitle);
                    return sectionTitle;
                }

                // Hide console if no section selected
                $ca.hide();
                return chapterTitle;
            }

            // Default
            $('#ch0').collapse('show');
            $ca.hide();
            return 'Prologue';
        }

        function attachEditorButton() {
            var $btn = $('#show-editor-button'),
                $e = $('#editor-area');

            $btn.fadeIn('slow');
            $btn.click(function () {
                var $this = $(this);
                if ($this.html() === 'Show Editor') {
                    $e.slideDown();
                    $this.html('Hide Editor');
                } else {
                    $e.slideUp();
                    $this.html('Show Editor');
                }
            });
        }

        function init() {
            var title;

            lbacConsole.init(consoleId, editorId, runButtonId);
            title = restorePageState();

            lbacCodeViewer.init({
                docElement: docId,
                codeElement: codeId,
                title: title
            });
            setTimeout(function () {
                $ca.slideDown();
            }, 1000);
            attachMenuClickHandler();
            attachEditorButton();
        }

        init();

    });

});