define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    AppDispatcher,
    AppConstants
){

    var WebApiActions = {

        serverEvent: function(eventName, payloadName, payload){
            var action = {};
            action.actionType = AppConstants.ServerToAction[eventName];
            if(payloadName)
                action[payloadName] = payload;
            AppDispatcher.handleServerAction(action);
        },

        joined: function(resp){
            AppDispatcher.handleServerAction({
                actionType: AppConstants.ActionTypes.JOINED,
                resp: resp
            });
        },

        join_error: function(err){
            AppDispatcher.handleServerAction({
                actionType: AppConstants.ActionTypes.JOIN_ERR,
                err: err
            });
        }

    };

    return WebApiActions;
});
