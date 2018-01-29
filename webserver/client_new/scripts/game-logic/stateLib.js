/** Helper functions to process the states of the stores, also helps to keep the stores cleaner **/

define([
    'constants/AppConstants',
    'game-logic/clib'
], function(
    AppConstants,
    Clib
) {
    return {

        /** ====== Engine Store ====== **/


        /** If the user is currently playing return and object with the status else null **/
        currentPlay: function(engine) {
            if (!engine.username)
                return null;
            else
                return engine.playerInfo[engine.username];
        },

        /** True if you are playing and haven't cashed out, it returns true on game_crash also, it clears until game_starting **/
        currentlyPlaying: function(engine) {
            var currentPlay = this.currentPlay(engine);
            return currentPlay && currentPlay.bet && !currentPlay.stopped_at;
        },



        /**
         * Returns the game payout as a percentage if game is in progress
         * if the game is not in progress returns null.
         *
         * Used by the script-controller
         *
         * If the last was time exceed the STOP_PREDICTING_LAPSE constant
         * It returns the last game tick elapsed time + the STOP_PREDICTING_LAPSE
         * This will cause the graph or others to stops if there is lag.
         * Only call this function if the game is 'IN_PROGRESS'.
         * Use it for render, strategy, etc.
         * @return {number}
         */
        getGamePayout: function(engine) {
            if(!(engine.gameState === 'IN_PROGRESS'))
                return null;

            var elapsed;
            if((Date.now() - engine.lastGameTick) < AppConstants.Engine.STOP_PREDICTING_LAPSE) {
                elapsed = Date.now() - engine.startTime;
            } else {
                elapsed = engine.lastGameTick - engine.startTime + AppConstants.Engine.STOP_PREDICTING_LAPSE; //+ STOP_PREDICTING_LAPSE because it looks better
            }
            var gamePayout = Clib.growthFunc(elapsed);
            console.assert(isFinite(gamePayout));
            return gamePayout;
        },

        /** True if are not playing in the current game or already cashed out */
        notPlaying: function(engine) {
            var currentPlay = this.currentPlay(engine);
            return !(engine.gameState === 'IN_PROGRESS' && currentPlay && !currentPlay.stopped_at);
        },

        /** To Know if the user is betting **/
        isBetting : function(engine) {
            if (!engine.username) return false;
            if (engine.nextBetAmount) return true;
            for (var i = 0 ; i < engine.joined.length; ++i) {
                if (engine.joined[i] == engine.username)
                    return true;
            }
            return false;
        },

        ///** Not playing and not betting **/
        //ableToBet: function(engine) {
        //    return this.notPlaying(engine) && !this.isBetting(engine);
        //},

        /** ====== Controls Store ====== **/


        /** Parse the bet string in bits and returns a integer **/
        parseBet: function(betStringBits) {
          return parseInt(betStringBits.replace(/k/g, '000')) * 100;
        },

        /** Convert the cash out string into an integer **/
        parseCashOut: function(cashOutString) {
            var cashOut = parseFloat(cashOutString);
            cashOut = Math.round(cashOut * 100);
            return cashOut;
        },


        /** ====== Mixed ====== **/

        canUserBet: function(balanceSatoshis, betStringBits, betInvalid, autoCashOutInvalid) {
            var betAmountSatoshis = this.parseBet(betStringBits);

            if(balanceSatoshis < 100)
                return new Error('Not enough bits to play');
            if(betInvalid)
                return new Error(betInvalid);
            if(autoCashOutInvalid)
                return new Error(autoCashOutInvalid);
            if(balanceSatoshis < betAmountSatoshis)
                return new Error('Not enough bits');

            return true;
        }
    }
});