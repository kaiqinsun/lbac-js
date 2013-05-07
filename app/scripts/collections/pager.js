/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'models/pagerItem',
    'data/toc'
], function ($, _, Backbone, PagerItem, toc) {
    'use strict';

    // Calculate the value of the sec, which will be used for comparison.
    function valueOf(sec) {
        sec = sec || '0.0.0';
        var nums = sec.split('.');
        nums[2] = nums[2] || '0';

        return _.reduce(nums, function (memo, num) {
            return memo * 100 + parseInt(num, 10);
        }, 0);
    }

    // Get pager item data for the previous section/chapter.
    function getPrevious(ch, sec) {
        var sections = toc[ch].sections,
            section,
            PreviousSec,
            title,
            i;

        // Find the previous sec and title.
        for (i = sections.length - 1; i >= 0; i -= 1) {
            section = sections[i];
            if (valueOf(section.sec) < valueOf(sec) && !section.disabled) {
                PreviousSec = section.sec;
                title = '&sect;' + PreviousSec + ' ' + section.title;
                break;
            }
        }

        // If previous sec not found, it's full chapter,
        // otherwise look for previous chapter or it's begin.
        if (!PreviousSec) {
            if (sec) {
                title = (ch ? 'Chapter ' + toc[ch].ch + ' ' : '') + toc[ch].title;
            } else {
                if (ch > 0) {
                    return getPrevious(ch - 1, '99.9');
                } else {
                    return null;
                }
            }
        }

        return {
            className: 'previous',
            href: '#ch' + ch + (PreviousSec ? '/' + PreviousSec : ''),
            title: title,
            text: '&laquo; Previous',
        };
    }

    // Get pager item data for the next section/chapter.
    function getNext(ch, sec) {
        var END_CH = 12,
            nextSec,
            title;

        // Find the next sec and title.
        $.each(toc[ch].sections, function (i, section) {
            if (valueOf(section.sec) > valueOf(sec) && !section.disabled) {
                nextSec = section.sec;
                title = '&sect;' + nextSec + ' ' + section.title;
                return false;
            }
        });

        // If not found, next chapter or end.
        if (!nextSec) {
            if (ch < END_CH) {
                ch += 1;
                title = 'Chapter ' + toc[ch].ch + ' ' + toc[ch].title;
            } else {
                return null;
            }
        }

        return {
            className: 'next',
            href: '#ch' + ch + (nextSec ? '/' + nextSec : ''),
            title: title,
            text: 'Next &raquo;',
            placement: 'bottom'
        };
    }

    // Get data for pageItem based on ch (and sec).
    function getData(ch, sec) {
        var chapter = toc[ch],
            data = [],
            item;

       // Previous section
        item = getPrevious(ch, sec);
        if (item) {
            data.push(item);
        }

        // This chapter
        data.push({
            className: sec ? '' : 'disabled',
            href: '#ch' + ch,
            title: (ch ? 'Chapter ' + ch + ' ' : '') + chapter.title,
            text: ch ? 'Ch' + ch : chapter.title
        });

        // Each section
        _.each(chapter.sections, function (section) {
            if (section.disabled) {
                return;
            }

            data.push({
                className: (section.sec === sec) ? 'disabled' : '',
                href: '#ch' + ch + '/' + section.sec,
                title: '&sect;' + section.sec + ' ' + section.title,
                text: section.sec
            });
        });

        // Next section
        item = getNext(ch, sec);
        if (item) {
            data.push(item);
        }

        return data;
    }


    // Pager collection
    var Pager = Backbone.Collection.extend({
        model: PagerItem,

        update: function (ch, sec) {
            this.reset(getData(ch, sec));
        }
    });

    return Pager;
});
