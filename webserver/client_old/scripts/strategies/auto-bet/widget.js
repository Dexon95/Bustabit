/** Todo: If we send the Store and the actions maybe is better to just send the state, this looks like not fluxy **/

define([
    'lib/react',
    'lib/react-radio'
], function(
    React,
    ReactRadioClass
){

    var ReactRadio = React.createFactory(ReactRadioClass);
    var D = React.DOM;

    return React.createClass({
        displayName: 'AutoBetWidget',

        propTypes: {
            StrategyEditorStore: React.PropTypes.object.isRequired,
            StrategyEditorActions: React.PropTypes.object.isRequired
        },

        getState: function() {
            var state = this.props.StrategyEditorStore.getWidgetState();
            state.active = this.props.StrategyEditorStore.getEditorState();
            return state;
        },

        getInitialState: function() {
            return this.getState();
        },

        componentDidMount: function() {
            this.props.StrategyEditorStore.addWidgetChangeListener(this._onChange);
        },

        componentWillUnmount: function() {
            this.props.StrategyEditorStore.removeWidgetChangeListener(this._onChange);
        },

        _onChange: function() {
            this.setState(this.getState());
        },

        updateOnLoss: function(opt) {
            this.props.StrategyEditorActions.setWidgetState('onLossSelectedOpt', opt);
        },

        updateOnWin: function(opt) {
            this.props.StrategyEditorActions.setWidgetState('onWinSelectedOpt', opt);
        },

        updateBetAmount: function() {
            var amount = this.refs.bet_amount.getDOMNode().value;
            this.props.StrategyEditorActions.setWidgetState('baseBet', amount);
        },

        updateAutoCashAt: function() {
            var amount = this.refs.auto_cash_at.getDOMNode().value;
            this.props.StrategyEditorActions.setWidgetState('autoCashAt', amount);
        },

        updateOnLossQty: function() {
            var amount = this.refs.onLossQty.getDOMNode().value;
            this.props.StrategyEditorActions.setWidgetState('onLossIncreaseQty', amount);
        },

        updateOnWinQty: function() {
            var amount = this.refs.onWinQty.getDOMNode().value;
            this.props.StrategyEditorActions.setWidgetState('onWinIncreaseQty', amount);
        },

        updateMaxBetStop: function() {
            var amount = this.refs.max_bet_stop.getDOMNode().value;
            this.props.StrategyEditorActions.setWidgetState('maxBetStop', amount);
        },

        render: function() {
            return D.div({ className: 'widget-container' },
                D.div({ className: 'stra-base-bet' },
                    D.span({ className: 'widget-title' }, 'Base Bet: '),
                    D.input({ type: 'text', ref: 'bet_amount', onChange: this.updateBetAmount, value: this.state.baseBet, disabled: this.state.active }),
                    D.span(null, 'Bits')
                ),
                D.div({ className: 'stra-cash-out-at' },
                    D.span({ className: 'widget-title' }, 'Auto Cashout at:'),
                    D.input({ type: 'text', ref: 'auto_cash_at', onChange: this.updateAutoCashAt, value: this.state.autoCashAt, disabled: this.state.active }),
                    D.span(null, 'x')
                ),
                D.div({ className: 'stra-max-bet-stop' },
                    D.span({ className: 'widget-title' }, 'Stop if bet is > '),
                    D.input({ type: 'text', ref: 'max_bet_stop', onChange: this.updateMaxBetStop, value: this.state.maxBetStop, disabled: this.state.active }),
                    D.span(null, 'Bits')
                ),
                D.div({ className: 'stra-on-loss' },
                    D.span({ className: 'widget-title' }, 'On loss:'),
                    ReactRadio({ name: 'onLoss', onChange: this.updateOnLoss, defaultValue: this.state.onLossSelectedOpt  },
                        D.input({
                                type: 'radio',
                                className: 'stra-on-loss-return-to-base-radio',
                                value: 'return_to_base',
                                disabled: this.state.active
                            },  D.span(null, 'Return to base bet'),
                            D.br()
                        ),
                        D.input({
                                type: 'radio',
                                className: 'stra-on-loss-increase-bet-by',
                                value: 'increase_bet_by',
                                disabled: this.state.active
                            },  D.span(null, 'Increase bet by: '),
                            D.input({
                                    type: 'text',
                                    ref: 'onLossQty',
                                    onChange: this.updateOnLossQty,
                                    value: this.state.onLossIncreaseQty,
                                    disabled: this.state.active || this.state.onLossSelectedOpt != 'increase_bet_by' }
                            ),
                            D.span(null, 'x')
                        )
                    )
                ),
                D.div({ className: 'stra-on-win' },
                    D.span({ className: 'widget-title' }, 'On win:'),
                    ReactRadio({ name: 'onWin', onChange: this.updateOnWin, defaultValue: this.state.onWinSelectedOpt },
                        D.input({
                                type: 'radio',
                                className: 'stra-on-win-return-to-base-radio',
                                value: 'return_to_base',
                                disabled: this.state.active
                            },  D.span(null, 'Return to base bet'),
                            D.br()
                        ),
                        D.input({
                                type: 'radio',
                                className: 'stra-on-win-increase_bet_by',
                                value: 'increase_bet_by',
                                disabled: this.state.active
                            },  D.span(null, 'Increase bet by: '),
                            D.input({
                                    type: 'text',
                                    ref: 'onWinQty',
                                    onChange: this.updateOnWinQty,
                                    value: this.state.onWinIncreaseQty,
                                    disabled: this.state.active || this.state.onWinSelectedOpt != 'increase_bet_by' }
                            ),
                            D.span(null, 'x')
                        )
                    )
                )
            );
        }

    });

});