define([
    'lodash',
    'lib/events',
    'constants/AppConstants',
    'dispatcher/AppDispatcher',
    'game-logic/clib'
], function(
    _,
    Events,
    AppConstants,
    AppDispatcher,
    Clib
) {
    var CHANGE_EVENT = 'change';

    var _height = 253;

    /** How to display the bots on the chat **/
    var _botsDisplayMode = Clib.localOrDef('botsDisplayMode', 'normal'); //normal || greyed || none

    var ChatStore = _.extend({}, Events, {

        emitChange: function() {
            this.trigger(CHANGE_EVENT);
        },

        addChangeListener: function(fn) {
            this.on(CHANGE_EVENT, fn);
        },

        removeChangeListener: function(fn) {
            this.off(CHANGE_EVENT, fn);
        },

        _setHeight: function(newHeight) {
            _height = newHeight;
        },

        _setBotsDisplayMode: function(displayMode) {
            _botsDisplayMode = displayMode;
            localStorage['botsDisplayMode'] = displayMode;
        },

        getState: function() {
            return {
                height: _height,
                botsDisplayMode: _botsDisplayMode
            }
        }
    });

    AppDispatcher.register(function(payload) {
        var action = payload.action;

        switch(action.actionType) {
            case AppConstants.ActionTypes.SET_CHAT_HEIGHT:
                ChatStore._setHeight(action.newHeight);
                ChatStore.emitChange();
                return;

            case AppConstants.ActionTypes.SET_BOTS_DISPLAY_MODE:
                ChatStore._setBotsDisplayMode(action.displayMode);
                ChatStore.emitChange();
                break;
        }

        return true; // No errors. Needed by promise in Dispatcher.
    });

    return ChatStore;
});