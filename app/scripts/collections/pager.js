/*global define*/

define([
    'lodash',
    'backbone',
    'models/pagerItem',
    'data/toc'
], function (_, Backbone, PagerItem, toc) {
    'use strict';

    // Get pager item data for the previous section/chapter.
    function getPrevious(ch, sec) {
        var sections = _.reject(toc[ch].sections, 'disabled'),
            index = _.findIndex(sections, { sec: sec}) - 1,
            section = sec === 'last' ? _.last(sections) : sections[index],
            PreviousSec,
            title;

        if (section) {
            PreviousSec = section.sec;
            title = '&sect;' + PreviousSec + ' ' + section.title;
        } else {

            // If previous section not found, it's full chapter,
            // otherwise look for previous chapter or it's begin.
            if (sec) {
                title = (ch ? 'Chapter ' + toc[ch].ch + ' ' : '') + toc[ch].title;
            } else {
                if (ch > 0) {
                    return getPrevious(ch - 1, 'last');
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
        var END_CH = 16,
            sections = _.reject(toc[ch].sections, 'disabled'),
            index = _.findIndex(sections, { sec: sec }) + 1,
            section = sections[index],
            nextSec,
            title;

        if (section) {
            nextSec = section.sec;
            title = '&sect;' + nextSec + ' ' + section.title;
        } else {

            // If next section not found, next chapter or end.
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

    // Get an array of page items based on ch (and sec).
    function getPagerData(ch, sec) {
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
            this.reset(getPagerData(ch, sec));
        }
    });

    return Pager;
});
