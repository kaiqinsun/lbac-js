/*global define*/

define([
    'jquery',
    'backbone',
    'routes/router',
    'views/app',
    'bootstrap'
], function ($, Backbone, AppRouter, AppView) {
    'use strict';

    $(function () {
        var appRouter = new AppRouter(),
            appView = new AppView();

        function navigate(fragment) {
            appRouter.navigate(fragment, { trigger: true });
        }

        appView.render();
        appView.listenTo(appRouter, 'update', appView.update);

        appView.menuView.on('click:chapter', navigate);
        appView.contentView.topPagerView.on('click:item', navigate);
        appView.contentView.bottomPagerView.on('click:item', navigate);

        Backbone.history.start();
    });
});
