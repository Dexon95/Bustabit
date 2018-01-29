define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    AppDispatcher,
    AppConstants
){

    var ChartActions = {

        selectChart: function(chartName){
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.SELECT_CHART,
                chartName: chartName
            });
        }

    };

    return ChartActions;
});