define([
    'lib/react',
    'lib/clib',
    'lib/lodash',
    'game-logic/engine'
], function(
    React,
    Clib,
    _,
    Engine
){

    var D = React.DOM;
    var cx = React.addons.classSet;

    function calcProfit(bet, stoppedAt) {
        return ((stoppedAt - 100) * bet)/100;
    }

    function getState(){
        return {
            engine: Engine
        }
    }

    return React.createClass({
        displayName: 'usersPlaying',

        getInitialState: function () {
            return getState();
        },

        componentDidMount: function() {
            Engine.on({
                game_started: this._onChange,
                game_crash: this._onChange,
                game_starting: this._onChange,
                player_bet: this._onChange,
                cashed_out: this._onChange
            });
        },

        componentWillUnmount: function() {
            Engine.off({
                game_started: this._onChange,
                game_crash: this._onChange,
                game_starting: this._onChange,
                player_bet: this._onChange,
                cashed_out: this._onChange
            });
        },

        _onChange: function() {
            //Check if its mounted because when Game view receives the disconnect event from EngineVirtualStore unmounts all views
            //and the views unregister their events before the event dispatcher dispatch them with the disconnect event
            if(this.isMounted())
                this.setState(getState());
        },

        render: function() {
            var self = this;

            var usersWonCashed = [];
            var usersLostPlaying = [];

            var trUsersWonCashed;
            var trUsersLostPlaying;

            var tBody;

            var containerClass;
            var tableClass;

            var game = self.state.engine;

            /** Separate and sort the users depending on the game state **/
            if (game.gameState === 'STARTING') {
                //The list is already ordered by engine given an index

                usersLostPlaying = self.state.engine.joined.map(function(player) {
                    var bet; // can be undefined

                    if (player === self.state.engine.username)
                        bet = self.state.engine.nextBetAmount;

                    return { username: player, bet: bet };
                });
            } else {
                _.forEach(game.playerInfo, function (player, username) {
                    player.username = username;

                    if (player.stopped_at)
                        usersWonCashed.push(player);
                    else
                        usersLostPlaying.push(player);
                });

                usersWonCashed.sort(function(a, b) {
                    var r = b.stopped_at - a.stopped_at;
                    if (r !== 0) return r;
                    return a.username < b.username ? 1 : -1;
                });

                usersLostPlaying.sort(function(a, b) {
                    var r = b.bet - a.bet;
                    if (r !== 0) return r;
                    return a.username < b.username ? 1 : -1;
                });

            }

            /** Create the rows for the table **/

            //Users Playing and users cashed
            if(game.gameState === 'IN_PROGRESS' || game.gameState === 'STARTING') {
                var i, length;
                var bonusClass = (game.gameState === 'IN_PROGRESS')? 'bonus-projection' : '';

                trUsersLostPlaying = [];
                for(i=0, length = usersLostPlaying.length; i < length; i++) {

                    var user = usersLostPlaying[i];
                    var bonus = (game.gameState === 'IN_PROGRESS')? ( (user.bonus)? Clib.formatDecimals((user.bonus*100/user.bet), 2) + '%': '0%' ) : '-';
                    var classes = cx({
                        'user-playing': true,
                        'me': self.state.engine.username === user.username
                    });

                    trUsersLostPlaying.push( D.tr({ className: classes, key: 'user' + i },
                        D.td(null, D.a({ href: '/user/' + user.username,
                                target: '_blank'
                            },
                            user.username)),
                        D.td(null, '-'),
                        D.td(null,
                            user.bet ? Clib.formatSatoshis(user.bet, 0) : '?'
                        ),
                        D.td({ className: bonusClass }, bonus),
                        D.td(null, '-')
                    ));

                }

                trUsersWonCashed = [];
                for (i=0, length = usersWonCashed.length; i < length; i++) {

                    var user = usersWonCashed[i];
                    var profit = calcProfit(user.bet, user.stopped_at);
                    var bonus = (game.gameState === 'IN_PROGRESS')? ( (user.bonus)? Clib.formatDecimals((user.bonus*100/user.bet), 2) + '%': '0%' ) : '-';
                    var classes = cx({
                        'user-cashed': true,
                        'me': self.state.engine.username === user.username
                    });

                    trUsersWonCashed.push( D.tr({ className: classes, key: 'user' + i },
                        D.td(null, D.a({ href: '/user/' + user.username,
                                target: '_blank'
                            },
                            user.username)),
                        D.td(null, user.stopped_at/100 + 'x'),
                        D.td(null, Clib.formatSatoshis(user.bet, 0)),
                        D.td({ className: bonusClass }, bonus),
                        D.td(null, Clib.formatSatoshis(profit))
                    ));
                }

                tBody = D.tbody({ className: '' },
                    trUsersLostPlaying,
                    trUsersWonCashed
                );

                containerClass = 'users-playing-container';
                tableClass = 'users-playing';

                //Users Lost and users Won
            } else if(game.gameState === 'ENDED') {

                trUsersLostPlaying = usersLostPlaying.map(function(entry, i) {
                    var bet = entry.bet;
                    var bonus = entry.bonus;
                    var profit = -bet;

                    if (bonus) {
                        profit = Clib.formatSatoshis(profit + bonus);
                        bonus = Clib.formatDecimals(bonus*100/bet, 2)+'%';
                    } else {
                        profit = Clib.formatSatoshis(profit);
                        bonus = '0%';
                    }

                    var classes = cx({
                        'user-lost': true,
                        'me': self.state.engine.username === entry.username
                    });

                    return D.tr({ className: classes, key: 'user' + i },
                        D.td(null, D.a({ href: '/user/' + entry.username,
                                target: '_blank'
                            },
                            entry.username)),
                        D.td(null, '-'),
                        D.td(null, Clib.formatSatoshis(entry.bet, 0)),
                        D.td(null, bonus),
                        D.td(null, profit)
                    );
                });

                trUsersWonCashed = usersWonCashed.map(function(entry, i) {
                    var bet = entry.bet;
                    var bonus = entry.bonus;
                    var stopped = entry.stopped_at;
                    var profit = bet * (stopped - 100) / 100;

                    if (bonus) {
                        profit = Clib.formatSatoshis(profit + bonus);
                        bonus = Clib.formatDecimals(bonus*100/bet, 2)+'%';
                    } else {
                        profit = Clib.formatSatoshis(profit);
                        bonus = '0%';
                    }

                    var classes = cx({
                        'user-won': true,
                        'me': self.state.engine.username === entry.username
                    });

                    return D.tr(
                        { className: classes, key: 'user' + i },
                        D.td(null, D.a({
                                href: '/user/' + entry.username,
                                target: '_blank'
                            },
                            entry.username)),
                        D.td(null, stopped / 100, 'x'),
                        D.td(null, Clib.formatSatoshis(bet, 0)),
                        D.td(null, bonus),
                        D.td(null, profit)
                    );
                });


                tBody = D.tbody({ className: '' },
                    trUsersLostPlaying,
                    trUsersWonCashed
                );

                containerClass = 'users-cashed-container';
                tableClass = 'users-summary';
            }

            return D.div({ className: containerClass },
                D.table({ className: tableClass },
                    D.thead(null,
                        D.tr(null,
                            D.th(null, 'User'),
                            D.th(null, '@'),
                            D.th(null, 'Bet'),
                            D.th(null, 'Bonus'),
                            D.th(null, 'Profit')
                        )
                    ),
                    tBody
                )
            );
        }

    });

});