define([
    'lib/react',
    'components/Chat',
    'components/GamesLog',
    'components/StrategyEditor',
    'stores/TabsSelectorStore',
    'actions/TabsSelectorActions'
], function(
    React,
    ChatClass,
    GamesLogClass,
    StrategyEditorClass,
    TabsSelectorStore,
    TabsSelectorActions
) {

    var Chat = React.createFactory(ChatClass);
    var GamesLog = React.createFactory(GamesLogClass);
    var StrategyEditor = React.createFactory(StrategyEditorClass);

    var D = React.DOM;

    function getState(){
        return TabsSelectorStore.getState();
    }

    return React.createClass({
        displayName: 'logChatSelector',

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
            //Check if its mounted because when Game view receives the disconnect event from EngineVirtualStore unmounts all views
            //and the views unregister their events before the event dispatcher dispatch them with the disconnect event
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
                    widget = Chat();
                    break;
                case 'strategyEditor':
                    widget = StrategyEditor();
                    break;
            }

            return D.div({ className: 'log-chat-tabs-container' },
                D.ul({ className: 'chat-log-tabs unselect' },
                    D.li({
                            className: 'chat-log-tab ' + ((this.state.selectedTab === 'gamesLog') ? 'tab-active' : ''),
                            onClick: this._selectTab('gamesLog')
                        },
                        D.a(null, 'History')
                    ),
                    D.li({
                            className: 'chat-log-tab ' + ((this.state.selectedTab === 'chat') ? 'tab-active' : ''),
                            onClick: this._selectTab('chat')
                        },
                        D.a(null, 'Chat')
                    ),
                    D.li({
                            className: 'chat-log-tab ' + ((this.state.selectedTab === 'strategyEditor') ? 'tab-active' : ''),
                            onClick: this._selectTab('strategyEditor')
                        },
                        D.a(null, 'Strategy')
                    )
                ),
                D.div({ className: 'log-chat-container ' + contClass },
                    widget
                )
            );

        }
    });

});