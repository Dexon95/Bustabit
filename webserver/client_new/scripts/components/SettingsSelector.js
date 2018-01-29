define([
   'react',
    'components/DisplaySettings',
    'components/HotkeysSettings',
    'components/ChatSettings'
], function(
    React,
    DisplaySettingsClass,
    HotkeysSettingsClass,
    ChatSettingsClass
) {
    var D = React.DOM;

    var DisplaySettings = React.createFactory(DisplaySettingsClass);
    var HotkeysSettings = React.createFactory(HotkeysSettingsClass);
    var ChatSettings = React.createFactory(ChatSettingsClass);

    return React.createClass({
        displayName: 'Settings',

        getInitialState: function() {
            return {
                selectedTab: 'display' //display || hotkeys || chat
            }
        },

        _selectTab: function(tabName) {
            var self = this;
            return function() {
                self.setState({ selectedTab: tabName });
            }
        },

        render: function() {

            var selectedTab;
            switch(this.state.selectedTab) {
                case 'display':
                    selectedTab = DisplaySettings();
                    break;
                case 'hotkeys':
                    selectedTab = HotkeysSettings();
                    break;
                case 'chat':
                    selectedTab = ChatSettings();
                    break;
            }

            return D.div({ id: 'settings-selector-container' },
                D.div({ className: 'tabs-container noselect' },
                    D.div({ className: 'tab-holder' + (this.state.selectedTab === 'display'? ' tab-active' : ''), onClick: this._selectTab('display') },
                        D.a(null,  'Display' )
                    ),
                    D.div({ className: 'tab-holder' + (this.state.selectedTab === 'hotkeys'? ' tab-active' : ''), onClick: this._selectTab('hotkeys') },
                        D.a(null,  'Hotkeys' )
                    ),
                    D.div({ className: 'tab-holder' + (this.state.selectedTab === 'chat'? ' tab-active' : ''), onClick: this._selectTab('chat') },
                        D.a(null,  'Chat' )
                    )
                ),

                D.div({ className: 'settings-widget-container' },
                    selectedTab
                )
            )
        }
    });
});