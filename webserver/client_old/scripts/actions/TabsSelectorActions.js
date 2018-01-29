define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    AppDispatcher,
    AppConstants
){

    var TabsSelectorActions = {

        selectTab: function(tab){
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.SELECT_TAB,
                tab: tab
            });
        }

    };

    return TabsSelectorActions;
});