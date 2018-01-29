/**
 * This Store has the state of the Strategy Editor and the widgets
 * The widgets are strategy methods for the game,
 * this acts as a store for every one of them
 */
define([
    'strategies/strategies',
    'game-logic/script-controller',
    'lib/events',
    'lib/lodash',
    'dispatcher/AppDispatcher',
    'constants/AppConstants'
], function(
    Strategies,
    ScriptController,
    Events,
    _,
    AppDispatcher,
    AppConstants
){

    var CHANGE_EVENT = 'change';
    var CHANGE_WIDGET_EVENT = 'widget_change';

    //Reference to the engine controller if running
    var _engineController = null;

    //Strategy: Could have a widget or just the script { widget: function, logic: function, validation: function }
    var _strategy = Strategies.autoBet; //Default Strategy AutoBet
    var _selectedStrategy = 'autoBet';

    //Is the script running
    var _active = false;

    //Widgets States, set the initial state for each widget
    var _widgetStates = {};
    for(var strategy in Strategies) {
        if(Strategies[strategy].isWidget)
            _widgetStates[strategy] = Strategies[strategy]['initialState'];
    }

    var StrategyEditorStore = _.extend({}, Events, {

        emitChange: function() {
            this.trigger(CHANGE_EVENT);
        },

        emitWidgetChange: function() {
            this.trigger(CHANGE_WIDGET_EVENT);
        },

        addChangeListener: function(callback) {
            this.on(CHANGE_EVENT, callback);
        },

        removeChangeListener: function(callback) {
            this.off(CHANGE_EVENT, callback);
        },

        addWidgetChangeListener: function(callback) {
            this.on(CHANGE_WIDGET_EVENT, callback);
        },

        removeWidgetChangeListener: function(callback) {
            this.off(CHANGE_WIDGET_EVENT, callback);
        },


        /** Strategy Editor Store's private methods **/

        _runStrategy: function() {
            console.assert(!_engineController);

            var logicFn;
            //If the strategy is a widget the logic is on strategy.logic
            //we send the settings to logic and it returns a function with the logic of the script
            if (_strategy.isWidget)
                logicFn = _strategy.logic(_widgetStates[_selectedStrategy]);
            //else is a string and we convert that string in to a function
            else
                logicFn = new Function('engine', _strategy);

            //Create an engine controller each time the user clicks run
            _engineController = new ScriptController(logicFn, this._stopScript.bind(this));
            _active = true;
        },

        //Called by the Strategy Editor View, should stop the script
        _stopScript: function() {
            _engineController.stopScript();
            _engineController = null;
            _active = false;
            this.emitChange();
            this.emitWidgetChange();
        },

        //Updates de script of our current strategy every time it changes
        _updateScript: function(script) {
            console.assert(!_strategy.isWidget);
            _strategy = script;
        },

        _selectStrategy: function(strategyName) {
            console.assert(Strategies.hasOwnProperty(strategyName));
            _selectedStrategy = strategyName;
            _strategy = Strategies[strategyName];
        },

        _dataInvalid: function() {
            //If the data on the widget if exist is invalid
            return ((_strategy.isWidget)? _widgetStates[_selectedStrategy].invalidData: false);
        },


        /** Strategy Editor Getters **/

        getState: function() {
            return {
                active: _active,
                strategy: _strategy,
                selectedStrategy: _selectedStrategy,
                invalidData: this._dataInvalid()
            }
        },


        /** Private methods for the widgets **/

        //The different states of the widgets are stored in _widgetStates
        //This is a generic function to let the widget set its own states
        _setWidgetState: function(property, state) {
            console.assert(_strategy.isWidget);
            _widgetStates[_selectedStrategy][property] = state;
            this._validateInput();
        },

        //We validate the input here because this is the controller(state) of the widget
        _validateInput: function () {
            if(_strategy.isWidget)
                _widgetStates[_selectedStrategy].invalidData = _strategy.validate(_widgetStates[_selectedStrategy]);
            else
                _widgetStates[_selectedStrategy].invalidData = false;
        },


        /** Widget Getters **/

        //This could be called after changing the strategy if we use the same event
        getWidgetState: function() {
            console.assert(_strategy.isWidget);
            return _widgetStates[_selectedStrategy];
        },

        getEditorState: function() {
            return _active;
        }

    });

    AppDispatcher.register(function(payload) {
        var action = payload.action;

        switch(action.actionType) {


            /** Strategy Editor Actions **/

            case AppConstants.ActionTypes.RUN_STRATEGY:
                StrategyEditorStore._runStrategy();
                StrategyEditorStore.emitChange();
                StrategyEditorStore.emitWidgetChange();
                break;

            case AppConstants.ActionTypes.STOP_SCRIPT:
                StrategyEditorStore._stopScript();
                StrategyEditorStore.emitChange();
                StrategyEditorStore.emitWidgetChange();
                break;

            case AppConstants.ActionTypes.UPDATE_SCRIPT:
                StrategyEditorStore._updateScript(action.script);
                StrategyEditorStore.emitChange();
                break;

            case AppConstants.ActionTypes.SELECT_STRATEGY:
                StrategyEditorStore._selectStrategy(action.strategy);
                StrategyEditorStore.emitChange();
                break;


            /** Widget Actions **/

            case AppConstants.ActionTypes.SET_WIDGET_STATE:
                StrategyEditorStore._setWidgetState(action.property, action.state);
                StrategyEditorStore.emitChange();
                StrategyEditorStore.emitWidgetChange();
                break;

        }

        return true; // No errors. Needed by promise in Dispatcher.
    });

    return StrategyEditorStore;
});