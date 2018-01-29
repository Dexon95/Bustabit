define([
    'react',
    'strategies/strategies',
    'lodash',
    'game-logic/clib',
    'game-logic/engine',
    'stores/StrategyEditorStore',
    'actions/StrategyEditorActions'
],function(
    React,
    Strategies,
    _,
    Clib,
    Engine,
    StrategyEditorStore,
    StrategyEditorActions
){

    var D = React.DOM;

    function getState() {
        var state = StrategyEditorStore.getState();
        state.engine = Engine; //Just to know if the user is logged in
        return state;
    }

    return React.createClass({
        displayName: 'strategyEditor',

        getInitialState: function() {
            return getState();
        },

        componentDidMount: function() {
            StrategyEditorStore.addChangeListener(this._onChange);
        },

        componentWillUnmount: function() {
            StrategyEditorStore.removeChangeListener(this._onChange);
        },

        _onChange: function() {
            if(this.isMounted())
                this.setState(getState());
        },

        _runStrategy: function() {
            StrategyEditorActions.runStrategy();
        },

        _stopStrategy: function() {
            StrategyEditorActions.stopScript();
        },

        _updateScript: function() {
            var script = this.refs.input.getDOMNode().value;
            StrategyEditorActions.updateScript(script);
        },

        _selectStrategy: function() {
            var strategyName = this.refs.strategies.getDOMNode().value;
            StrategyEditorActions.selectStrategy(strategyName);
        },

        render: function() {
            var self = this;

            var strategiesOptions =_.map(Strategies, function(strategy, strategyName) {
                return D.option({ value: strategyName, key: 'strategy_'+strategyName }, Clib.capitaliseFirstLetter(strategyName));
            });

            var WidgetElement;
            //If the strategy is not a script should be a widget function and we mount it
            if(typeof this.state.strategy == 'function'){
                //Send the strategy StrategyEditorStore and StrategyEditorActions to avoid circular dependencies
                var element = React.createFactory(this.state.strategy);
                WidgetElement = element({ StrategyEditorStore: StrategyEditorStore, StrategyEditorActions: StrategyEditorActions });

            } else {
                WidgetElement = D.textarea({ className: 'strategy-input', ref: 'input', value: self.state.strategy, onChange: self._updateScript, disabled: this.state.active });
            }

            return D.div({ id: 'strategy-container' },
                D.div({ className: 'widget-container' },
                    WidgetElement
                ),
                D.div({ className: 'control-buttons' },
                    D.span({ className: 'strategy-invalid-data' }, this.state.invalidData || !this.state.engine.username),
                    D.div({ className: 'buttons-container' },
                        D.button({ className: 'strategy-start', onClick: self._runStrategy, disabled: this.state.active || this.state.invalidData || !this.state.engine.username }, 'RUN!'),
                        D.button({ className: 'strategy-stop', onClick: self._stopStrategy, disabled: !this.state.active }, 'STOP'),
                        D.select({ className: 'strategy-select', value: this.state.selectedStrategy,  onChange: self._selectStrategy, ref: 'strategies', disabled: this.state.active }, strategiesOptions)
                    )
                )
            );
        }
    });

});