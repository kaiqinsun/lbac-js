define(['./2-expression-parsing', './3-more-expressions', './4-interpreters', './5-control-constructs', './6-boolean-expressions', './7-lexical-scanning', './7.13-kiss', './9.a-top-view', './10-introducing-tiny', './11-lexical-scan-revisited', './11.6-tiny-1.1', './12-miscellany'], function (expressionParsing, moreExpressions, interpreters, controlConstructs, booleanExpressions, lexicalScanning, kiss, aTopView, introducingTiny, lexicalScanRevisited, tiny_11, miscellany) {
    'use strict';

    return {
        expressionParsing: expressionParsing,       // 2
        moreExpressions: moreExpressions,           // 3
        interpreters: interpreters,                 // 4
        controlConstructs: controlConstructs,       // 5
        booleanExpressions: booleanExpressions,     // 6
        lexicalScanning: lexicalScanning,           // 7
        kiss: kiss,                                 // 7.13
        aTopView: aTopView,                         // 9
        introducingTiny: introducingTiny,           // 10
        lexicalScanRevisited: lexicalScanRevisited, // 11
        tiny_11: tiny_11,                           // 11.6
        miscellany: miscellany,                     // 12
    };

});