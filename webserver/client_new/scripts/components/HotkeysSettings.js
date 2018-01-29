define([
    'react',
    'stores/GameSettingsStore',
    'actions/HotkeysActions'
], function(
    React,
    GameSettingsStore,
    HotkeysActions
) {
    var D = React.DOM;

    function getState() {
        return GameSettingsStore.getState();
    }

    return React.createClass({
        displayName: 'Hotkeys Settings',

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

        _hotkeysActiveChange: function(e) {
            HotkeysActions.toggleHotkeysState();
        },

        render: function() {
            return D.div({ id: 'hotkeys-settings-container'},

                D.div({ className: 'activation-row' },
                    D.input({ id: 'activate-hotkeys', type: 'checkbox', checked: this.state.hotkeysActive, onChange: this._hotkeysActiveChange }),
                    D.label({ htmlFor: 'activate-hotkeys' }, 'Activate hotkeys')
                ),

                D.div({ className: 'hotkeys-list' },
                    D.span(null, 'Bet (SPACE)'),
                    D.span(null, 'Double bet (C)'),
                    D.span(null, 'Halve bet (X)')
                )

            );
        }
    });
});