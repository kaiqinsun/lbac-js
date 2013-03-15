require.config({
    paths: {
        jquery: '../components/jquery/jquery',
        bootstrap: 'vendor/bootstrap',
        cookie: '../components/jquery.cookie/jquery.cookie',
        prettify: '../components/google-code-prettify/src/prettify'
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
            $c = $('#' + consoleId);

        // Click event handler on accordion menu
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
                $c.slideDown(); // show console
                success = lbacConsole.update(chapterTitle, sectionTitle);

                if (success) {

                    // scroll to the top of console
                    $('html, body').animate({
                        scrollTop: $c.offset().top - 20
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
                $c.hide();
                return chapterTitle;
            }

            // Default at 'Preparation'
            $('#ch0').collapse('show');
            $c.hide();
            return 'Preparation';
        }

        function init() {
            var title;

            lbacConsole.init(consoleId);
            attachMenuClickHandler();
            title = restorePageState();

            lbacCodeViewer.init({
                element: 'source-codes',
                title: title
            });
        }

        init();

    });

});