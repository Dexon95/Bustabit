/**
 * This file subscribes the ScriptExecutor to the engine events
 * and run the script that subscribe itself to the ScriptExecutor Events.
 **/
define([
    'lodash',
    'game-logic/engine',
    'game-logic/chat',
    'game-logic/stateLib',
    'lib/events'
], function(
    _,
    Engine,
    Chat,
    StateLib,
    Events
){

    /**
     * Create the ScriptExecutor constructor,
     * subscribe to the engine events and a function to unsubscribe.
     *
     * If you want to see the Strategy API go down some lines to where the docs are pretty.
     */

    var ScriptExecutor = function(logicFn, stopScriptViewFunction) {

        //If the script calls stop, this function is triggered to tell the Strategy Editor the script has stopped
        //And from there the stopScript is called which actually stops the script
        this.stopScriptViewFunction = stopScriptViewFunction;

        _.extend(this, Events);

        //TODO: Print a decent error, maybe using try catch
        //Run the script code that contains the subscription methods for the engine proxy
        logicFn(this);

        //Subscribe the Engine Proxy to all the real engine events
        this.startEngine();
    };

    ScriptExecutor.prototype.startEngine = function() {

        var self = this;

        /** Engine Events **/

        var engineEventNames = [

            /* Game State Events */
            'game_starting', 'game_started', 'game_crash',

            /* Players Events */
            'player_bet', 'cashed_out',

            /* Chat Events */
            //'msg',

            /* Connection Events */
            'connected', 'disconnected'];

        //Array of pairs, where each pair is eventName and the function
        var engineEventFunctions = engineEventNames.map(function(eventName) {
            var fn = self.trigger.bind(self, eventName);
            return [eventName, fn];
        });

        engineEventFunctions.forEach(function(pair) {
            var eventName = pair[0];
            var fn = pair[1];

            Engine.on(eventName, fn);
        });

        this.engineEvents = engineEventFunctions;


        /** Chat Events **/

        var chatEventNames = [
            /* Chat Events */
            'msg'
            ];

        //Array of pairs, where each pair is eventName and the function
        var chatEventFunctions = chatEventNames.map(function(eventName) {
            var fn = self.trigger.bind(self, eventName);
            return [eventName, fn];
        });

        chatEventFunctions.forEach(function(pair) {
            var eventName = pair[0];
            var fn = pair[1];

            Chat.on(eventName, fn);
        });

        this.chatEvents = chatEventFunctions;

    };


    ScriptExecutor.prototype.stopScript = function() {

        this.engineEvents.forEach(function(pair) {
            var eventName = pair[0];
            var fn = pair[1];

            Engine.off(eventName, fn);
        });

        this.chatEvents.forEach(function(pair) {
            var eventName = pair[0];
            var fn = pair[1];

            Chat.off(eventName, fn);
        });
    };


//--------- API here ------->

    /* ==========================================================================
     Game State Events
     ========================================================================== */

    /**
     * 'game_starting': Event called before starting the game to let the client know when the game is going to start
     * @param {object} info - JSON payload
     * @param {number} info.game_id - The next game id
     * @param {number} info.time_till_start - Time lapse for the next game to begin
     */

    /**
     * 'game_started': Event called at the moment when the game starts
     * @param {object} data - JSON payload
     * @param {object} data['username'] - Contains each user bet
     * @param {number} data['username].bet - The bet of the user this game
     */

    /**
     * 'game_crash': Event called at game crash
     * @param {object} data - JSON payload
     * @param {number} data.elapsed - Total game elapsed time
     * @param {number} data.game_crash - Crash payout quantity in percent eg. 200 = 2x. Use this to calculate payout!
     * @param {object} data.bonuses - List of bonuses of each user, in satoshis
     * @param {string} data.hash - Revealed provably fair hash of the game
     */

    /* ==========================================================================
     Player Events
     ========================================================================== */

    /**
     * 'player_bet': Event called every time a user places a bet
     * the user that placed the bet could be me so we check for that
     * @param {object} resp - JSON payload
     * @param {string} resp.username - The player username
     * @param {number} resp.bet - The player bet in satoshis
     */

    /**
     * 'cashed_out': Event called every time the server cash out a user
     * if we call cash out the server is going to call this event
     * with our name.
     * @param {object} resp - JSON payload
     * @param {string} resp.username - The player username
     * @param {number} resp.amount - The amount the user cashed out
     * @param {number} resp.stopped_at -The percentage at which the user cashed out
     */

    /* ==========================================================================
     Chat Events
     ========================================================================== */

    /**
     * 'msg': Event called every time we receive a chat message
     * @param {object} resp - JSON payload
     * @param {string} time - Time when the message was sent
     * @param {string} type - The 'command': say, mute, error, info
     * @param {username} string - The username of who sent it
     * @param {role} string - admin, moderator, user
     * @param {message} string - Da message
     */

    /* ==========================================================================
     Connection Events
     ========================================================================== */

    /**
     * 'connected': The engine is connected to the server
     */

    /**
     * 'disconnected': The engine is disconnected to the server
     */


    /* ==========================================================================
     Getters
     ========================================================================== */

    /**
     * Gets the current balance
     */
    ScriptExecutor.prototype.getBalance = function() {
        return Engine.balanceSatoshis;
    };

    /**
     * Gets the maximum amount you can bet per game
     */
    ScriptExecutor.prototype.getMaxBet = function() {
        return Engine.maxBet;
    };

    /**
     * Gets the current game payout if playing,
     * if the game is not in progress returns null
     */
    ScriptExecutor.prototype.getCurrentPayout = function() {
        return StateLib.getGamePayout(Engine);
    };

    /**
     * Returns the username of the user or null
     */
    ScriptExecutor.prototype.getUsername = function() {
        return Engine.username;
    };

    /**
     * Returns the raw engine
     */
    ScriptExecutor.prototype.getEngine = function() {
        return Engine;
    };

    /**
     * Returns the max win
     */
    ScriptExecutor.prototype.getMaxWin = function() {
        return Engine.maxWin;
    };


    /* ==========================================================================
     Helpers
     ========================================================================== */

    /**
     * Returns 'WON', 'LOST', 'NOT_PLAYED' based on your game history
     */
    ScriptExecutor.prototype.lastGamePlay = function() {
        if(this.lastGamePlayed())
            if(Engine.tableHistory[0].player_info[Engine.username].stopped_at)
                return 'WON';
            else
                return 'LOST';

        return 'NOT_PLAYED';
    };

    /**
     * Returns true if the last game was played
     */
    ScriptExecutor.prototype.lastGamePlayed = function() {
        return !!Engine.tableHistory[0].player_info[Engine.username];
    };


    /* ==========================================================================
     Actions
     ========================================================================== */

    /**
     * Place a bet
     * @param {number} bet - The amount to bet in satoshis
     * @param {number} cashOut - Auto cash at this multiplier
     * @param {function} callback - Optional callback to catch errors
     */
    ScriptExecutor.prototype.placeBet = function(bet, cashOut, callback) {
        Engine.bet(bet, cashOut, callback);
    };

    /**
     * Cash out, only when playing.
     * @param callback - callback to catch errors
     */
    ScriptExecutor.prototype.cashOut = function(callback) {
        Engine.cashOut(callback);
    };

    /**
     * Called by the script.
     * Stop disconnects from receiving all events,
     * Once stop is called there is no reconnecting.
     */
    ScriptExecutor.prototype.stop = function() {
        this.stopScriptViewFunction();
    };

    /**
     * Say something in the chat, from 1 to 500 chars
     */
    ScriptExecutor.prototype.chat = function(msg) {
        Chat.say(msg, true);
    };


    return ScriptExecutor;
});