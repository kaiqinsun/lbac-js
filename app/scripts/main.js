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
            $c = $('#' + consoleId),
            $d = $('#' + docId),
            consoleIsHidden = false;

        // Click event handlers of accordion menu
        function attachMenuClickHandler() {

            // Chapter toggle button
            $('#accordion2 .accordion-toggle').click(function () {
                var chapterTitle = $(this).text().trim();
                $c.slideUp();   // hide console
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
                if (!consoleIsHidden) {
                    $c.slideDown(); // show console
                }
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

        // click event handlers of control dropdown menu
        function attachControlMenuHandler() {
            var $editorControl = $('#editor-control'),
                $consoleControl = $('#console-control'),
                $consoleControlButton = $('#console-control-button'),
                $ea = $('#editor-area'),
                iconName = 'icon-bell';

            function manageClass($target, $control) {
                $('i', $control).removeClass(iconName);
                $('i', $target).addClass(iconName);
            }

            $('a', $editorControl).click(function (e) {
                var $this = $(this),
                    text = $this.text();

                e.preventDefault();
                if (text === 'Show') {
                    $ea.slideDown();
                } else if (text === 'Hide') {
                    $ea.slideUp();
                } else {

                    // auto
                    // to be implemented
                }
                manageClass($this, $editorControl);
            });

            $('a', $consoleControl).click(function (e) {
                var $this = $(this),
                    text = $this.text();

                e.preventDefault();
                if (text === 'Hide') {
                    $c.slideUp();
                    consoleIsHidden = true;
                } else {

                    // auto
                    $c.slideDown();
                    consoleIsHidden = false;
                }
                manageClass($this, $consoleControl);
            });

            // toggle console
            $consoleControlButton.click(function () {
                if (consoleIsHidden) {
                    $c.slideDown();
                    consoleIsHidden = false;
                    console.log($('i', $consoleControl).eq(0));
                    console.log($('i', $consoleControl).eq(1));
                    $('i', $consoleControl).eq(0).addClass(iconName);
                    $('i', $consoleControl).eq(1).removeClass(iconName);
                } else {
                    $c.slideUp();
                    consoleIsHidden = true;
                    $('i', $consoleControl).eq(1).addClass(iconName);
                    $('i', $consoleControl).eq(0).removeClass(iconName);
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
                $c.hide();
                return chapterTitle;
            }

            // Default
            $('#ch0').collapse('show');
            $c.hide();
            return 'Prologue';
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
                $('.btn-toolbar').show();
                $c.slideDown();
            }, 1500);
            attachMenuClickHandler();
            attachControlMenuHandler();
        }

        init();

    });

});