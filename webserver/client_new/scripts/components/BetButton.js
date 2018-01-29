define([
    'react',
    'game-logic/clib',
    'game-logic/stateLib',
    'constants/AppConstants',
    'components/Payout'
], function(
    React,
    Clib,
    StateLib,
    AppConstants,
    PayoutClass
){

    var D = React.DOM;
    var Payout = React.createFactory(PayoutClass);

    return React.createClass({
        displayName: 'BetButton',

        propTypes: {
            engine: React.PropTypes.object.isRequired,
            placeBet: React.PropTypes.func.isRequired,
            cancelBet: React.PropTypes.func.isRequired,
            cashOut: React.PropTypes.func.isRequired,
            isMobileOrSmall: React.PropTypes.bool.isRequired,
            betSize: React.PropTypes.string.isRequired,
            betInvalid: React.PropTypes.any.isRequired,
            cashOutInvalid: React.PropTypes.any.isRequired,
            controlsSize: React.PropTypes.string.isRequired
        },

        getInitialState: function() {
            return {
                initialDisable: true
            }
        },

        componentDidMount: function() {
            this._initialDisableTimeout();
            this.props.engine.on({
                game_crash: this._onGameCrash
            });
        },

        componentWillUnmount: function() {
            this.props.engine.off({
                game_crash: this._onGameCrash
            });
        },

        _onGameCrash: function() {
            this.setState({ initialDisable: true });
            this._initialDisableTimeout();
        },

        _initialDisableTimeout: function() {
            var self = this;
            setTimeout(function() {
                if(self.isMounted())
                    self.setState({ initialDisable: false });
            }, AppConstants.BetButton.INITIAL_DISABLE_TIME);
        },

        _cashOut: function () {
            this.props.cashOut();
            this.setState({ initialDisable: true });
            this._initialDisableTimeout();
        },

        render: function() {
            var self = this;

            var smallButton = this.props.isMobileOrSmall || this.props.controlsSize === 'small';

            var notPlaying = StateLib.notPlaying(this.props.engine);
            var isBetting = StateLib.isBetting(this.props.engine);

            // Able to bet, or is already betting
            var notPlayingOrBetting = notPlaying || isBetting;

            var canUserBet = StateLib.canUserBet(this.props.engine.balanceSatoshis, this.props.betSize, this.props.betInvalid, this.props.cashOutInvalid);
            var invalidBet = canUserBet instanceof Error; 

            var btnClasses, btnContent = [], onClickFun = null, onMouseDownFun = null, onMouseUpFun = null;
            btnClasses = 'bet-button';

            if(notPlayingOrBetting) {
                //Betting
                if(isBetting) {
                    btnClasses += ' disable';

                    //Can cancel
                    if (this.props.engine.gameState !== 'STARTING') {
                        btnContent.push(D.span({ key: 'bc-0'}, smallButton? '' : 'Betting...'), D.a({ className: 'cancel', key: 'bc-1' }, ' (Cancel)'));
                        onClickFun = this.props.cancelBet;
                        btnClasses += ' cancel';
                    } else {
                        btnContent.push(D.span({ key: 'bc-0'}, 'Betting...'));
                    }

                    //Initial disable
                } else if(this.state.initialDisable) {
                	var btnText =   (canUserBet.message === 'Not enough bits')? (smallButton? 'Bet' : 'Bet too big') : (smallButton? 'Bet' : 'Place bet');
                    btnContent.push(D.span({ key: 'bc-2' }, btnText));
                    btnClasses += ' disable unselect';

                    //Able to betting
                } else if(notPlaying) {

                    //Invalid bet
                    if(invalidBet) {

                    	var btnText =   (canUserBet.message === 'Not enough bits')? (smallButton? 'Bet' : 'Bet too big') : (smallButton? 'Bet' : 'Place bet');
                        //btnContent.push(D.span({ key: 'bc-3' }, invalidBet));
                        btnContent.push(D.span({ key: 'bc-3' }, btnText));
                        btnClasses += ' invalid-bet unselect';

                    //Placing bet
                    } else if(this.props.engine.placingBet) {
                        btnContent.push(D.span({ key: 'bc-4' }, smallButton? 'Bet' : 'Place bet'));
                        btnClasses += ' disable unselect';

                    //Able to bet
                    } else {
                        btnContent.push(D.span({ key: 'bc-5' }, smallButton? 'Bet' : 'Place bet'));
                        btnClasses += ' ';
                        onClickFun = self.props.placeBet;
                    }

                    //User is cashing out
                } else {
                    console.error('Not defined state in controls');
                }

            //The user is playing
            } else {
                btnContent.push(
                    D.div({ className: 'btn-content', key: 'bc-6' },
                        D.span({ className: 'cashout-cont' }, 'Cash out'),
                        D.span({ className: 'cashout-amount-cont' },
                            D.span(null, '@ '),
                            Payout({ engine: this.props.engine }),
                            D.span(null, 'bits')
                        )
                    )
                );

                //Cashing out
                if (this.props.engine.cashingOut) {
                    btnClasses += ' disable';

                //Able to cash out
                } else {
                    btnClasses += ' cashout';
                    onMouseDownFun = this._cashOut;
                }
            }

            return D.div({ className: 'bet-button-container' },
                D.button({ className: btnClasses, onClick: onClickFun, onMouseDown: onMouseDownFun, onMouseUp: onMouseUpFun },
                    btnContent
                )

            );
        }
    });

});