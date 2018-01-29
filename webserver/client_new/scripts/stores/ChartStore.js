define([
    'lodash',
    'lib/events',
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    _,
    Events,
    AppDispatcher,
    AppConstants
) {
    var CHANGE_EVENT = 'change';

    var _chartDisplayed = 'canvas'; //text || canvas

    //Singleton ControlsStore Object
    var ChartStore = _.extend({}, Events, {

        emitChange: function() {
            this.trigger(CHANGE_EVENT);
        },

        addChangeListener: function(callback) {
            this.on(CHANGE_EVENT, callback);
        },

        removeChangeListener: function(callback) {
            this.off(CHANGE_EVENT, callback);
        },

        _selectChart: function(chartName) {
            _chartDisplayed = chartName;
        },

        getState: function() {
            return {
                chartDisplayed: _chartDisplayed
            }
        }

    });

    AppDispatcher.register(function(payload) {
        var action = payload.action;

        switch(action.actionType) {

            case AppConstants.ActionTypes.SELECT_CHART:
                ChartStore._selectChart(action.chartName);
                ChartStore.emitChange();
                break;
        }

        return true; // No errors. Needed by promise in Dispatcher.
    });

    return ChartStore;
});