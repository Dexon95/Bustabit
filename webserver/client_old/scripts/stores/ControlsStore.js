define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants',
    'lib/events',
    'lib/lodash'
], function(
    AppDispatcher,
    AppConstants,
    Events,
    _
){
    var CHANGE_EVENT = 'change';

    var _betSize = '1';
    var _cashOut = '2.00';

    //Singleton ControlsStore Object
    var ControlsStore = _.extend({}, Events, {

        emitChange: function() {
            this.trigger(CHANGE_EVENT);
        },

        addChangeListener: function(callback) {
            this.on(CHANGE_EVENT, callback);
        },

        removeChangeListener: function(callback) {
            this.off(CHANGE_EVENT, callback);
        },

        _setBetSize: function(betSize) {
            _betSize = betSize;
        },

        _setAutoCashOut: function(autoCashOut) {
            _cashOut = autoCashOut;
        },

        getBetSize: function() {
            return _betSize;
        },

        getCashOut: function() {
            return _cashOut;
        }

    });

    AppDispatcher.register(function(payload) {
        var action = payload.action;

        switch(action.actionType) {
            case AppConstants.ActionTypes.SET_BET_SIZE:
                ControlsStore._setBetSize(action.betSize);
                ControlsStore.emitChange();
                break;
            case AppConstants.ActionTypes.SET_AUTO_CASH_OUT:
                ControlsStore._setAutoCashOut(action.autoCashOut);
                ControlsStore.emitChange();
                break;
        }

        return true; // No errors. Needed by promise in Dispatcher.
    });

    return ControlsStore;
});