define([
    'dispatcher/AppDispatcher',
    'constants/AppConstants',
    'lib/events',
    'lodash'
], function(
    AppDispatcher,
    AppConstants,
    Events,
    _
){
    var CHANGE_EVENT = 'change';

    var _selectedControl = 'manual'; //Tabs: manual, strategy

    //Singleton ControlsStore Object
    var ControlsSelectorStore = _.extend({}, Events, {

        emitChange: function() {
            this.trigger(CHANGE_EVENT);
        },

        addChangeListener: function(callback) {
            this.on(CHANGE_EVENT, callback);
        },

        removeChangeListener: function(callback) {
            this.off(CHANGE_EVENT, callback);
        },

        _selectControl: function(controlName) {
            _selectedControl = controlName;
        },

        _toggleControl: function() {
            _selectedControl = _selectedControl === 'manual'? 'strategy' : 'manual'
        },

        getState: function() {
            return {
                selectedControl: _selectedControl
            }
        }

    });

    AppDispatcher.register(function(payload) {
        var action = payload.action;

        switch(action.actionType) {

            case AppConstants.ActionTypes.SELECT_CONTROL:
                ControlsSelectorStore._selectControl(action.controlName);
                ControlsSelectorStore.emitChange();
                break;

            case AppConstants.ActionTypes.TOGGLE_CONTROL:
                ControlsSelectorStore._toggleControl();
                ControlsSelectorStore.emitChange();
                break;
        }

        return true; // No errors. Needed by promise in Dispatcher.
    });

    return ControlsSelectorStore;
});