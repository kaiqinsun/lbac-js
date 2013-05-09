/*global define*/

define(['lodash', 'data/toc'], function (_, toc) {
    'use strict';

    // Check ch and sec against toc.
    function isValid(ch, sec) {

        // Check ch
        if (ch !== _.parseInt(ch).toString() || !toc[ch]) {
            return false;
        }
        // Check sec
        if (sec && !_.any(toc[ch].sections, { sec: sec })) {
            return false;
        }
        return true;
    }

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
        isValid: isValid,
        getTitle: getTitle
    };
});
