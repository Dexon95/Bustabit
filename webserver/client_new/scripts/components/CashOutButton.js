define([
    'react',
    'game-logic/clib',
    'components/Payout'
], function(
    React,
    Clib,
    PayoutClass
){

    var Payout = React.createFactory(PayoutClass);
    var D = React.DOM;

    return React.createClass({
        displayName: 'CashOutButton',

        propTypes: {
            engine: React.PropTypes.object.isRequired,
            invalidBet: React.PropTypes.func.isRequired,
            cashOut: React.PropTypes.func.isRequired
        },

        _cashOut: function () {
            this.props.cashOut();
        },

        render: function() {

            if (this.props.engine.cashingOut) {
                return D.div({ className: 'cash-out' },
                    D.a({ className: 'big-button-disable unclick' },
                        'Cash out at ', Payout({ engine: this.props.engine }), ' bits'
                    )
                );
            } else {
                return D.div({ className: 'cash-out', onMouseDown: this._cashOut },
                    D.a({ className: 'big-button unclick' },
                        'Cash out at ', Payout({ engine: this.props.engine }), ' bits'
                    )
                );
            }
        }
    });
});