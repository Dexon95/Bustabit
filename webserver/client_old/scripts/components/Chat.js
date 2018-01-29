define([
    'lib/react',
    'lib/clib',
    'lib/Autolinker',
    'stores/ChatStore',
    'actions/ChatActions',
    'game-logic/engine'
], function(
    React,
    Clib,
    Autolinker,
    ChatStore,
    ChatActions,
    Engine
){

    // Overrides Autolinker.js' @username handler to instead link to
    // user profile page.
    var replaceUsernameMentions = function(autolinker, match) {
      // Use default handler for non-twitter links
      if (match.getType() !== 'twitter') return true;

      var username = match.getTwitterHandle();
      return '<a href="/user/' + username +'" target="_blank">@' + username + '</a>';
    };

    var escapeHTML = (function() {
      var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;'
      };

      return function(str) {
        return String(str).replace(/[&<>"']/g, function (s) {
          return entityMap[s];
        });
      };
    })();

    var D = React.DOM;

    /* Constants */
    var SCROLL_OFFSET = 120;

    function getState(){
        var state = ChatStore.getState();
        state.engine = Engine;
        return state;
    }

    return React.createClass({
        displayName: 'Chat',

        getInitialState: function () {
            var state = getState();

            /* Avoid scrolls down if a render is not caused by length chat change */
            this.listLength = state.engine.chat.length;

            return state;
        },

        componentDidMount: function() {
            Engine.on({ msg: this._onChange });
            ChatStore.addChangeListener(this._onChange);

            var msgs = this.refs.messages.getDOMNode();
            msgs.scrollTop = msgs.scrollHeight;
        },

        componentWillUnmount: function() {
            Engine.off({ msg: this._onChange });
            ChatStore.removeChangeListener(this._onChange);

            var height = this.refs.messages.getDOMNode().style.height;
            ChatActions.setHeight(height);
        },

        /** If the length of the chat changed and the scroll position is near bottom scroll to the bottom **/
        componentDidUpdate: function(prevProps, prevState) {

            if(prevState.engine.chat.length != this.listLength){
                this.listLength = this.state.engine.chat.length;

                var msgsBox = this.refs.messages.getDOMNode();
                var scrollBottom = msgsBox.scrollHeight-msgsBox.offsetHeight-msgsBox.scrollTop;

                if(scrollBottom < SCROLL_OFFSET)
                    msgsBox.scrollTop = msgsBox.scrollHeight;
            }
        },

        _onChange: function() {
            //Check if its mounted because when Game view receives the disconnect event from EngineVirtualStore unmounts all views
            //and the views unregister their events before the event dispatcher dispatch them with the disconnect event
            if(this.isMounted())
                this.setState(getState());
        },

        _sendMessage: function(e) {
            if(e.keyCode == 13) {
                var msg = this.state.inputText;
                if(msg.length > 1 && msg.length < 500) {
                    this._say(msg);
                }
            }
        },

        _say: function(msg) {
            ChatActions.say(msg);
        },

        _updateInputText: function(ev) {
            ChatActions.updateInputText(ev.target.value);
        },

        render: function() {
            var self = this;
            var messages = this.state.engine.chat.map(renderMessage, self);
            var chatInput;

            if (this.state.engine.username)
                chatInput = D.input(
                    { className: 'chat-input',
                        onKeyDown: this._sendMessage,
                        onChange: this._updateInputText,
                        value: this.state.inputText,
                        ref: 'input',
                        placeholder: 'Type here...'
                    }
                );
            else
                chatInput = D.input(
                    { className: 'chat-input',
                        ref: 'input',
                        placeholder: 'Log in to chat...',
                        disabled: true
                    }
                );

            var ulStyle = {
                height: this.state.height
            };

            return D.div({ className: 'messages-container' },
                D.ul({ className: 'messages', ref: 'messages', style: ulStyle },
                    messages
                ),
                chatInput
            );
        }
    });

    function renderMessage(message, index) {
        var self = this;

        var pri = 'msg-chat-message';
        switch(message.type) {
            case 'say':
                if (message.role === 'admin') pri += ' msg-admin-message';

                var username = self.state.engine.username;

                var r = new RegExp('@' + username + '(?:$|[^a-z0-9_\-])', 'i');
                if (username && message.username != username && r.test(message.message)) {
                    pri += ' msg-highlight-message';
                }
                return D.li({ className: pri , key: 'msg' + index },
                    D.a({
                            href: '/user/' + message.username,
                            target: '_blank'
                        },
                        message.username, ':'),
                        ' ',
                        D.span({
                          className: 'msg-body',
                          dangerouslySetInnerHTML: {
                            __html: Autolinker.link(
                                      escapeHTML(message.message),
                                      { truncate: 50, replaceFn: replaceUsernameMentions }
                                    )
                          }
                        })
                    );
            case 'mute':
                pri = 'msg-mute-message';
                return D.li({ className: pri , key: 'msg' + index },
                    D.a({ href: '/user/' + message.moderator,
                            target: '_blank'
                        },
                        '*** <'+message.moderator+'>'),
                    message.shadow ? ' shadow muted ' : ' muted ',
                    D.a({ href: '/user/' + message.username,
                            target: '_blank'
                        },
                        '<'+message.username+'>'),
                    ' for ' + message.timespec);
            case 'error':
            case 'info':
                pri = 'msg-info-message';
                return D.li({ className: pri, key: 'msg' + index },
                    D.span(null, ' *** ' + message.message));
                break;
            default:
                break;
        }
    }

});