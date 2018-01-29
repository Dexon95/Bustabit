define([
   'react',
    'game-logic/clib',
    'game-logic/engine',
    'game-logic/stateLib',
    'stores/GameSettingsStore'
], function(
    React,
    Clib,
    Engine,
    StateLib,
    GameSettingsStore
) {
    var D = React.DOM;

    var REFRESH_TIME = 100;

    return React.createClass({
        displayName: 'TextDisplay',

        getInitialState: function() {
            return {
                size: {
                    inProgress: '60px',
                    ended: '60px',
                    starting: '60px'
                },
                theme: GameSettingsStore.getCurrentTheme()
            }
        },

        componentDidMount: function() {
            GameSettingsStore.addChangeListener(this._onChange);
            window.addEventListener("resize", this._calcTextValues);
            this._calcTextValues();

            var self = this;
            setTimeout(function() {
                self._update();
            }, REFRESH_TIME);
        },

        componentWillUnmount: function() {
            GameSettingsStore.removeChangeListener(this._onChange);
            window.removeEventListener("resize", this._calcTextValues);
        },

        _onChange: function() {
            if(this.isMounted())
                this.setState({ theme: GameSettingsStore.getCurrentTheme() });
        },

        _calcTextValues: function() {
            var onePercent = this.getDOMNode().clientWidth/100;

            function fontSizePx(times) {
                var fontSize = onePercent * times;
                return fontSize.toFixed(2) + 'px';
            }

            this.setState({
               size: {
                   inProgress: fontSizePx(20),
                   ended: fontSizePx(15),
                   starting: fontSizePx(5)
               }
            });

        },

        _update: function() {
            var self = this;

            if(this.isMounted()) {
                this.forceUpdate();

                setTimeout(function() {
                    self._update();
                }, REFRESH_TIME);
            }
        },

        render: function() {
            var cId = 'text-display-container', content, color;
            switch (Engine.gameState) {
                case 'IN_PROGRESS':

                    if (StateLib.currentlyPlaying(Engine))
                        color = '#7cba00';
                    else
                        color = (this.state.theme === 'white'? "black" : "#b0b3c1");

                    content = D.div({ id: cId, className: 'in-progress', style: { fontSize: this.state.size.inProgress, color: color } },
                        D.span(null, StateLib.getGamePayout(Engine).toFixed(2) + 'x')
                    );
                    break;
                case 'ENDED':
                    content = D.div({ id: cId, className: 'ended', style: { fontSize: this.state.size.ended, color: 'red' } },
                        D.span({ className: 'busted' }, 'Busted'),
                        D.span({ className: 'at' }, '@ ' + Clib.formatDecimals(Engine.tableHistory[0].game_crash/100, 2) + 'x')
                    );
                    break;
                case 'STARTING':
                    var timeLeft = ((Engine.startTime - Date.now())/1000).toFixed(1);
                    content = D.div({ id: cId, className: 'starting', style: { fontSize: this.state.size.starting, color: 'grey' } },
                        D.span(null, 'Next round in ' + timeLeft + 's')
                    );
                    break;

            }
          return content;
        }
    });
});