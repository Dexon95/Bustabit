define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    AppDispatcher,
    AppConstants
){

    var ControlsSelectorActions = {

        selectControl: function(controlName){
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.SELECT_CONTROL,
                controlName: controlName
            });
        },

        toggleControl: function(){
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.TOGGLE_CONTROL
            });
        }

    };

    return ControlsSelectorActions;
});