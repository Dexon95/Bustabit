define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    AppDispatcher,
    AppConstants
){

    var StrategyEditorActions = {


        /** Strategy Editor Actions **/

        runStrategy: function() {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.RUN_STRATEGY
            });
        },

        stopScript: function() {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.STOP_SCRIPT
            });
        },

        updateScript: function(script) {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.UPDATE_SCRIPT,
                script: script
            });
        },

        selectStrategy: function(strategy) {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.SELECT_STRATEGY,
                strategy: strategy
            });
        },


        /** Widget Actions **/

        setWidgetState: function(property, state) {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.SET_WIDGET_STATE,
                property: property,
                state: state
            });
        }

    };

    return StrategyEditorActions;
});