define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    AppDispatcher,
    AppConstants
){

    var HotkeysActions = {

        toggleHotkeysState: function() {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.TOGGLE_HOYTKEYS_STATE
            });
        },

        doubleBet: function() {
            AppDispatcher.handleViewAction({
               actionType: AppConstants.ActionTypes.DOUBLE_BET
            });
        },

        halfBet: function() {
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.HALF_BET
            });
        },

        cashOut: function(){
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.CASH_OUT
            });
        },

        placeBet: function(bet, cashOut){
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.PLACE_BET,
                bet: bet,
                cashOut: cashOut
            });
        },

        cancelBet: function(){
            AppDispatcher.handleViewAction({
                actionType: AppConstants.ActionTypes.CANCEL_BET
            });
        }

    };

    return HotkeysActions;
});