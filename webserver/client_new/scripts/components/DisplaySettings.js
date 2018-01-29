define([
    'react',
    'stores/GameSettingsStore',
    'actions/DisplaySettingsActions'
], function(
    React,
    GameSettingsStore,
    DisplaySettingsActions
) {
    var D = React.DOM;

    function getState() {
        return GameSettingsStore.getState();
    }

    return React.createClass({
        displayName: 'DisplayName',

        getInitialState: function() {
            return getState();
        },

        componentDidMount: function() {
            GameSettingsStore.addChangeListener(this._onChange);
        },

        componentWillUnmount: function() {
            GameSettingsStore.removeChangeListener(this._onChange);
        },

        _onChange: function() {
            if(this.isMounted())
                this.setState(getState());
        },

        _setControlsSize: function(e) {
            DisplaySettingsActions.setControlsSize(e.target.value);
        },

        _setGraphMode: function(e) {
            DisplaySettingsActions.setGraphMode(e.target.value);
        },

        _setControlsPosition: function(e) {
            DisplaySettingsActions.setControlsPosition(e.target.value);
        },

        _setLeftWidget: function(e) {
            DisplaySettingsActions.setLeftWidget(e.target.value);
        },

        render: function() {
            return D.div({ id: 'display-settings-container' },
                D.div({ className: 'option-row' },
                    D.span({ className: 'option-text' }, 'Controls size'),
                    D.select({ value: this.state.controlsSize, onChange: this._setControlsSize },
                        D.option({ value: 'big' }, 'big'),  
                        D.option({ value: 'small' }, 'small')
                    )
                ),
                D.div({ className: 'option-row' },
                    D.span({ className: 'option-text' }, 'Graph mode'),
                    D.select({ value: this.state.graphMode, onChange: this._setGraphMode },
                        D.option({ value: 'graphics' }, 'Graphics'),
                        D.option({ value: 'text' }, 'Text (Low CPU usage)')
                    )
                )
                //D.div({ className: 'option-row' },
                //    D.span({ className: 'option-text' }, 'Bet controls position'),
                //    D.select({ value: this.state.controlsPosition, onChange: this._setControlsPosition },
                //        D.option({ value: 'right' }, 'right'),
                //        D.option({ value: 'left' }, 'left')
                //    )
                //),
                //D.div({ className: 'option-row' },
                //    D.span({ className: 'option-text' }, 'Left widget'),
                //    D.select({ value: this.state.leftWidget, onChange: this._setLeftWidget },
                //        D.option({ value: 'players' }, 'players'),
                //        D.option({ value: 'chat' }, 'chat'),
                //        D.option({ value: 'history' }, 'history')
                //    )
                //)
            )
        }
    });
});