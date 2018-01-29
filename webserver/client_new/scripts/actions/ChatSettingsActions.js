define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    AppDispatcher,
    AppConstants
){

    var ChatSettingsActions = {

        setBotsDisplayMode: function(displayMode) {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.SET_BOTS_DISPLAY_MODE,
                displayMode: displayMode
            });
        }

    };

    return ChatSettingsActions;
});