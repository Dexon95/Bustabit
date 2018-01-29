define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    AppDispatcher,
    AppConstants
){

    var ChatActions = {

        say: function(msg){
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.SAY_CHAT,
                msg: msg
            });
        },

        //updateInputText: function(text) {
        //    AppDispatcher.handleViewAction({
        //        actionType: AppConstants.ActionTypes.SET_CHAT_INPUT_TEXT,
        //        text: text
        //    });
        //},

        setHeight: function(newHeight) {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.SET_CHAT_HEIGHT,
                newHeight: newHeight
            });
        },

        ignoreUser: function(username) {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.IGNORE_USER,
                username: username
            });
        },

        approveUser: function(username) {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.APPROVE_USER,
                username: username
            });
        },

        showClientMessage: function(message) {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.CLIENT_MESSAGE,
                message: message
            });
        },

        listMutedUsers: function(ignoredClientList) {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.LIST_MUTED_USERS,
                ignoredClientList: ignoredClientList
            });
        },

        selectChannel: function(channelName) {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.JOIN_CHANNEL,
                channelName: channelName
            });
        }

    };

    return ChatActions;
});