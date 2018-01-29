define([
    'lib/react',
    'lib/clib'
], function(
    React,
    Clib
){

    var D = React.DOM;

    return React.createClass({
        displayName: 'Calculator',

        getInitialState: function() {
            return {
                amount: 100,
                cashOut: 200,
                err: null
            };
        },

        checkErr: function(a, c) {
            if (isNaN(a))
                return 'Table amount must be set';
            else if (isNaN(c))
                return 'Cashout amount must be set';
            if (a < 1)
                return 'Table amount must be at least 1';
            else if (c < 1)
                return 'Cashout amount must be at least 1';
            else if (c < a)
                return 'Cashout amount must be equal to or greater than table amount';
            else
                return null;
        },


        render: function() {
            var self = this;

            var rows;

            if (this.state.err) {
                rows = [D.tr({ key: 'err' },
                    D.td(null, 'Error: '),
                    D.td(null, this.state.err)
                )];
            } else {
                rows = [
                    D.tr({ key: 'winProb' },
                        D.th(null, 'Probability of Winning:'),
                        D.td(null, (Clib.winProb(this.state.amount, this.state.cashOut) * 100), '%')
                    ),
                    D.tr({ key: 'winProfit' },
                        D.th(null, 'Profit if win:'),
                        D.td(null, Clib.profit(this.state.amount, this.state.cashOut))
                    ),
                    D.tr({ key: 'houseExpected' },
                        D.th(null, 'House Expected Return:'),
                        D.td(null, Clib.houseExpectedReturn(this.state.amount, this.state.cashOut))
                    ),
                    D.tr({ key: 'houseMargin' },
                        D.th(null, 'House Margin:'),
                        D.td(null, (Clib.houseExpectedReturn(this.state.amount, this.state.cashOut) / this.state.amount * 100), '%')
                    )
                ];
            }

            return D.table(null,
                D.tbody(null,
                    D.tr(null,
                        D.th(null, 'Table Amount (Initial Wager):'),
                        D.td(null, D.input({
                            type: 'number',
                            value: this.state.amount,
                            min: 1,
                            onChange: function(event) {
                                var n = parseInt(event.target.value);
                                var e = self.checkErr(n, self.state.cashOut);
                                self.setState({ amount: n, err: e });
                            }
                        }))
                    ),
                    D.tr(null,
                        D.th(null, 'Intended Cashout:'),
                        D.td(null, D.input({
                            type: 'number',
                            value: this.state.cashOut,
                            min: 2,
                            onChange: function(event) {
                                var n = parseInt(event.target.value);
                                var e = self.checkErr(self.state.amount, n);
                                self.setState({ cashOut: n, err: e });
                            }
                        }))
                    ),
                    rows
                )
            );
        }
    });

});