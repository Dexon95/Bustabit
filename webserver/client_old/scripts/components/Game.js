/**
 * This view acts as a wrapper for all the other views in the game
 * it is subscribed to changes in EngineVirtualStore but it only
 * listen to connection changes so every view should subscribe to
 * EngineVirtualStore independently.
 */
define([
    'lib/react',
    'components/Chart',
    'components/Controls',
    'components/TabsSelector',
    'components/Players',
    'components/BetBar',
    'game-logic/engine'
], function(
    React,
    ChartClass,
    ControlsClass,
    TabsSelectorClass,
    PlayersClass,
    BetBarClass,
    Engine
){
    var Chart = React.createFactory(ChartClass);
    var Controls  = React.createFactory(ControlsClass);
    var TabsSelector = React.createFactory(TabsSelectorClass);
    var Players = React.createFactory(PlayersClass);
    var BetBar = React.createFactory(BetBarClass);

    var D = React.DOM;

    return React.createClass({
        displayName: 'Game',

        getInitialState: function () {
            return {
                isConnected: Engine.isConnected
            }
        },

        componentDidMount: function() {
            Engine.on({
                'connected': this._onChange,
                'disconnected': this._onChange
            });
        },

        componentWillUnmount: function() {
            Engine.off({
                'connected': this._onChange,
                'disconnected': this._onChange
            });
        },

        _onChange: function() {
            if(this.state.isConnected != Engine.isConnected)
                this.setState({ isConnected: Engine.isConnected });
        },

        render: function() {
            if (!this.state.isConnected)
                return D.p(null, 'Connecting to server..');

            return D.div({ className: 'content' },
                D.div({ className: 'grid grid-pad' },
                    D.div({ className: 'col-7-12 game' },
                        Chart(),
                        Controls()
                    ),
                    D.div({ className: 'col-5-12 tabs' },
                        D.div({ className: 'players' },
                            Players()
                        ),
                        D.div({ className: 'bet-bar' },
                            BetBar()
                        ),
                        D.div({ className: 'log-chat' },
                            TabsSelector()
                        )
                    )

                )
            )
        }
    });

});