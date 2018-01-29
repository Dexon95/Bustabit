define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    AppDispatcher,
    AppConstants
){

    var GameSettingsActions = {

        toggleTheme: function(){
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.TOGGLE_THEME
            });
        }

    };

    return GameSettingsActions;
});