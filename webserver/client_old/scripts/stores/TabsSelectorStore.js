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

    var _selectedTab = 'gamesLog'; //Tabs: chat, gamesLog(default), strategyEditor

    //Singleton ControlsStore Object
    var TabsSelectorStore = _.extend({}, Events, {

        emitChange: function() {
            this.trigger(CHANGE_EVENT);
        },

        addChangeListener: function(callback) {
            this.on(CHANGE_EVENT, callback);
        },

        removeChangeListener: function(callback) {
            this.off(CHANGE_EVENT, callback);
        },

        _selectTab: function(tab) {
            _selectedTab = tab;
        },

        getState: function() {
            return {
                selectedTab: _selectedTab
            }
        }

    });

    AppDispatcher.register(function(payload) {
        var action = payload.action;

        switch(action.actionType) {

            case AppConstants.ActionTypes.SELECT_TAB:
                TabsSelectorStore._selectTab(action.tab);
                TabsSelectorStore.emitChange();
                break;

        }

        return true; // No errors. Needed by promise in Dispatcher.
    });

    return TabsSelectorStore;
});