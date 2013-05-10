/*global define*/

define(['lodash', 'data/toc'], function (_, toc) {
    'use strict';

    // Get the title of chapter, or section if sec provided.
    function getTitle(ch, sec) {
        var chapter = toc[ch],
            section;

        if (sec) {
            section = _.find(chapter.sections, { sec: sec });
            return sec + ' ' + section.title;
        } else {
            return (chapter.ch ? 'Chapter ' + chapter.ch + ' ' : '') +
                    chapter.title;
        }
    }

    return {
        getTitle: getTitle
    };
});
