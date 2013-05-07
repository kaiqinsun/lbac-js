/* global define */

define(['underscore', 'data/toc'], function (_, toc) {
    'use strict';

    // Get the chapter, or section title if sec provided.
    function getTitle(ch, sec) {

        function getChapterTitle(ch) {
            var chapter = toc[ch];
            return chapter.ch ? ('Chapter ' + chapter.ch + ' ' + chapter.title) : chapter.title;
        }

        function getSectionTitle(ch, sec) {
            var sections = toc[ch].sections;
            var section = _.find(sections, function (section) {
                return section.sec === sec;
            });
            return sec + ' ' + section.title;
        }

        if (sec) {
            return getSectionTitle(ch, sec);
        } else {
            return getChapterTitle(ch);
        }
    }

    return {
        getTitle: getTitle
    };
});
