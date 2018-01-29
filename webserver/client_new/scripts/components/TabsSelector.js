define([
    'react',
    'components/Chat',
    'components/GamesLog',
    'components/Players',
    'components/SettingsSelector',
    'components/StrategyEditor',
    'stores/TabsSelectorStore',
    'actions/TabsSelectorActions'
], function(
    React,
    ChatClass,
    GamesLogClass,
    PlayersClass,
    SettingsSelectorClass,
    StrategyEditorClass,
    TabsSelectorStore,
    TabsSelectorActions
) {

    var Chat = React.createFactory(ChatClass);
    var GamesLog = React.createFactory(GamesLogClass);
    var Players = React.createFactory(PlayersClass);
    var SettingsSelector = React.createFactory(SettingsSelectorClass);
    var StrategyEditor = React.createFactory(StrategyEditorClass);

    var D = React.DOM;

    function getState(){
        return TabsSelectorStore.getState();
    }

    return React.createClass({
        displayName: 'LogChatSelector',

        propTypes: {
            isMobileOrSmall: React.PropTypes.bool.isRequired,
            controlsSize: React.PropTypes.string.isRequired
        },

        getInitialState: function () {
            return getState();
        },

        componentDidMount: function() {
            TabsSelectorStore.addChangeListener(this._onChange);
        },

        componentWillUnmount: function() {
            TabsSelectorStore.removeChangeListener(this._onChange);
        },

        _onChange: function() {
            if(this.isMounted())
                this.setState(getState());
        },

        _selectTab: function(tab) {
            return function() {
                TabsSelectorActions.selectTab(tab);
            }
        },

        render: function() {
            var widget, contClass = '';
            switch(this.state.selectedTab) {
                case 'gamesLog':
                    widget = GamesLog();
                    contClass = 'gamesLog';
                    break;
                case 'chat':
                    widget = Chat({ isMobileOrSmall: this.props.isMobileOrSmall });
                    break;
                case 'players':
                    widget = Players();
                    break;
                case 'settings':
                    widget = SettingsSelector();
                    break;
                case 'autobet':
                    widget = StrategyEditor();
            }

            var autoBetTab, playersTab, tabCols, tabCount = 2;

            //Show the players tab when we are on mobile
            if(this.props.isMobileOrSmall)
        		tabCount++;
        	//Show the auto widget when the controls are set to small
        	if(this.props.controlsSize === 'small')
        		tabCount++;

        	tabCols = 'col-' + tabCount;

            if(this.props.isMobileOrSmall) {
            	playersTab = D.li({
                        className: 'tab ' + tabCols + ' noselect' + ((this.state.selectedTab === 'players') ? ' tab-active' : ''),
                        onClick: this._selectTab('players')
                    },
                    D.a(null, 'Players')
                )
            } else {
            	playersTab = null;
            }

            if(this.props.controlsSize === 'small') {
                autoBetTab = D.li({
                        className: 'tab ' + tabCols + ' noselect' + ((this.state.selectedTab === 'autobet') ? ' tab-active' : ''),
                        onClick: this._selectTab('autobet')
                    },
                    D.a(null, 'Auto')
                );
            } else {
                autoBetTab = null;
            }

            return D.div({ id: 'tabs-inner-container', className: 'log-chat-tabs-container' },

                D.div({ className: 'tab-container noselect' },
                        D.ul({ className: '' },
                            D.li({
                                    className: 'tab ' + tabCols + ' noselect' + ((this.state.selectedTab === 'gamesLog') ? ' tab-active' : ''),
                                    onClick: this._selectTab('gamesLog')
                                },
                                D.a(null, 'History')
                            ),
                            D.li({
                                    className: 'tab ' + tabCols + ' noselect' + ((this.state.selectedTab === 'chat') ? ' tab-active' : ''),
                                    onClick: this._selectTab('chat')
                                },
                                D.a(null, 'Chat')
                            ),
							playersTab,
                            autoBetTab
                        ),
                        D.div({
                                className: 'tab-settings noselect' + ((this.state.selectedTab === 'settings') ? ' tab-active' : ''),
                                onClick: this._selectTab('settings')
                            },
                            D.a(null, D.i({ className: 'fa fa-cog' }))
                        )
                ),

                D.div({ className: 'widget-container ' + contClass },
                    widget
                )
            );

        }
    });

});