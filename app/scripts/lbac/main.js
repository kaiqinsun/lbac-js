/* global define */

define([
    './2-expression-parsing',
    './3-more-expressions',
    './4-interpreters',
    './5-control-constructs',
    './6-boolean-expressions',
    './7-lexical-scanning',
    './7.13-kiss',
    './9.a-top-view',
    './10-introducing-tiny',
    './11-lexical-scan-revisited',
    './11.6-tiny-1.1',
    './12-miscellany'
], function (
    expressionParsing,      // 2
    moreExpressions,        // 3
    interpreters,           // 4
    controlConstructs,      // 5
    booleanExpressions,     // 6
    lexicalScanning,        // 7
    kiss,                   // 7.13
    aTopView,               // 9
    introducingTiny,        // 10
    lexicalScanRevisited,   // 11
    tiny_11,                // 11.6
    miscellany              // 12
) {
    'use strict';

    return {
        expressionParsing: expressionParsing,
        moreExpressions: moreExpressions,
        interpreters: interpreters,
        controlConstructs: controlConstructs,
        booleanExpressions: booleanExpressions,
        lexicalScanning: lexicalScanning,
        kiss: kiss,
        aTopView: aTopView,
        introducingTiny: introducingTiny,
        lexicalScanRevisited: lexicalScanRevisited,
        tiny_11: tiny_11,
        miscellany: miscellany
    };

});
