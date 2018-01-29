define([
    'react',
    'stores/GameSettingsStore',
    'stores/ChatStore',
    'actions/ChatSettingsActions'
], function(
    React,
    GameSettingsStore,
    ChatStore,
    ChatSettingsActions
) {
    var D = React.DOM;

    function getState() {
        return ChatStore.getState();
    }

    return React.createClass({
        displayName: 'ChatSettings',

        getInitialState: function() {
            return getState();
        },

        componentDidMount: function() {
            ChatStore.addChangeListener(this._onChange);
        },

        componentWillUnmount: function() {
            ChatStore.removeChangeListener(this._onChange);
        },

        _onChange: function() {
            if(this.isMounted())
                this.setState(getState());
        },

        _setBotsDisplayMode: function(e) {
            ChatSettingsActions.setBotsDisplayMode(e.target.value);
        },

        render: function() {
            return D.div({ id: 'chat-settings-container' },

                D.div({ className: 'option-row' },
                    D.span({ className: 'option-text' }, 'Bots Display Mode'),
                    D.select({ value: this.state.botsDisplayMode, onChange: this._setBotsDisplayMode },
                        D.option({ value: 'normal' }, 'Normal'),
                        D.option({ value: 'greyed' }, 'Greyed Out'),
                        D.option({ value: 'none' }, "Don't display"))

                )
            )
        }

    });

});