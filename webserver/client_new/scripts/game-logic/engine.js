define([
    'socketio',
    'lib/events',
    'lodash',
    'game-logic/clib',
    'constants/AppConstants',
    'dispatcher/AppDispatcher'
], function(
    io,
    Events,
    _,
    Clib,
    AppConstants,
    AppDispatcher
) {
    function Engine() {
        var self = this;

        /**
         * Engine inherits from BackBone events:
         * http://backbonejs.org/#Events
         * which means it has events like .on, off, .trigger, .once, .listenTo, .stopListening
         */
        _.extend(this, Events);

        self.ws = io(AppConstants.Engine.HOST);

        //Dev functions
        //window.disconnect = function() {
        //    self.ws.io.disconnect();
        //};
        //
        //window.reconnect = function() {
        //    self.ws.io.connect();
        //};

        /** The engine is connected to the server, if not connected, all fields are unreadable */
        self.isConnected = false;

        /** The username or null if is not logged in */
        self.username = null;

        /** The balance of the user */
        self.balanceSatoshis = null;

        /** Max bet will be sent by the server in the future, for now is a constant **/
        self.maxBet = AppConstants.Engine.MAX_BET;

        /** Array containing chat history */
        //self.chat = [];

        /** Object containing the game history */
        self.tableHistory = [];

        /** Array of the user names of the current players who joined the game, while the game is STARTING
         * sorted by bet by the server but the client doesn't know the bet amount
         * its empty in the other states */
        self.joined = [];

        /** Object containing the current game players and their status, this is saved in game history every game crash
         * cleared in game_starting.
         * e.g: { user1: { bet: satoshis, stopped_at: 200 }, user2: { bet: satoshis } }
         */
        self.playerInfo = null;

        /**
         * The state of the game
         * Possible states: IN_PROGRESS, ENDED, STARTING
         */
        self.gameState = null;

        /** Creation time of current game. This is the server time, not clients.. **/
        self.created = null;

        /** The game id of the current game */
        self.gameId = null;

        /** How much can be won this game */
        self.maxWin = null;

        /**
         * Client side times:
         * if the game is pending, startTime is how long till it starts
         * if the game is running, startTime is how long its running for
         * if the game is ended, startTime is how long since the game started
         */
        self.startTime = null;

        /** time from the game_starting event to game_started event **/
        self.timeTillStart = null;

        /** If you are currently placing a bet
         * True if the bet is queued (nextBetAmount)
         * True if the bet was sent to the server but the server has not responded yet
         *
         * Cleared in game_started, its possible to receive this event before receiving the response of
         */
        self.placingBet = false;

        /** True if cashing out.. */
        self.cashingOut = false;

        /**
         * If a number, how much to bet next round
         * Saves the queued bet if the game is not 'game_starting', cleared in 'bet_placed' by us and 'game_started' and 'cancel bet'
         */
        self.nextBetAmount = null;

        /** Complements nextBetAmount queued bet with the queued autoCashOut */
        self.nextAutoCashout = null;

        /** Store the id of the timer to check for lag **/
        self.tickTimer = null;

        /** Tell if the game is lagging but only  when the game is in progress **/
        self.lag = false;

        /** The hash of the last game **/
        self.lastHash = null;

        /** Animation Events triggers**/
        self.nyan = false;

        /**
         * Events triggered by the engine
         *
         * 'connected': The client is connected to the server
         * 'disconnected': The client got disconnected to the server
         * 'game_started': The game just started
         * 'game_crash': The game just crashed
         * 'game_starting': The game is going to start in X ms
         *
         * 'player_bet': A player bet
         * 'cashed_out': A player cashed out
         * 'msg': A player sent a message to the chat
         *
         * 'placing_bet':
         * 'bet_placed':
         * 'bet_queued':
         * 'cashing_out':
         * 'cancel_bet':
         *
         * 'lag_change': The engine changed its lag state
         *
         * 'error': Socket io errors
         * 'err': Server errors
         */


        /**
         * Event called at the moment when the game starts
         */
        self.ws.on('game_started', function(bets) {
            self.joined = [];

            self.gameState = 'IN_PROGRESS';
            self.startTime = Date.now();
            self.lastGameTick = self.startTime;
            self.placingBet = false;
            self.timeTillStart = null;


            self.nextBetAmount = null;
            self.nextAutoCashout = null;

            //Create the player info object with bet and username
            //If you are in the bets rest your bet from your balance
            Object.keys(bets).forEach(function(username) {
                if (self.username === username)
                    self.balanceSatoshis -= bets[username];

                self.playerInfo[username] = { bet: bets[username], username: username };
            });

            self.calcBonuses();

            self.trigger('game_started', self.playerInfo);
        });

        /**
         * Event called each 150ms telling the client the game is still alive
         * @param {number} data - elapsed time
         */
        self.ws.on('game_tick', function(elapsed) {
            /** Time of the last tick received */
            self.lastGameTick = Date.now();
            if(self.lag === true){
                self.lag = false;
                self.trigger('lag_change');
            }

            /** Correct the time of startTime every gameTick **/
            var currentLatencyStartTime = self.lastGameTick - elapsed;
            if(self.startTime>currentLatencyStartTime)
                self.startTime = currentLatencyStartTime;

            if(self.tickTimer)
                clearTimeout(self.tickTimer);

            self.tickTimer = setTimeout(self.checkForLag.bind(self), AppConstants.Engine.STOP_PREDICTING_LAPSE);

            //Check for animation triggers
            if(elapsed > AppConstants.Animations.NYAN_CAT_TRIGGER_MS && !self.nyan) {
                self.nyan = true;
                self.trigger('nyan_cat_animation');
            }

        });

        /** Socket io errors */
        self.ws.on('error', function(x) {
            console.log('on error: ', x);
            self.trigger('error', x);
        });

        /** Server Errors */
        self.ws.on('err', function(err) {
            console.error('Server sent us the error: ', err);
        });

        /**
         * Event called at game crash
         * @param {object} data - JSON payload
         * @param {number} data.elapsed - Total game elapsed time
         * @param {number} data.game_crash - Crash payout quantity in percent eg. 200 = 2x. Use this to calculate payout!
         * @param {object} data.bonuses - List of bonuses of each user, in satoshis
         * @param {string} data.hash - Revealed hash of the game
         */
        self.ws.on('game_crash', function(data) {

            if(self.tickTimer)
                clearTimeout(self.tickTimer);

            //If the game crashed at zero x remove bonuses projections by setting them to zero.
            if(data.game_crash == 0)
                self.setBonusesToZero();

            //Update your balance if you won a bonus, use this one because its the bonus rounded by the server
            for (var user in data.bonuses) {
                console.assert(self.playerInfo[user]);
                self.playerInfo[user].bonus = data.bonuses[user]; //TODO: Deprecate sending bonuses to the client?
                if (self.username === user) {
                    self.balanceSatoshis += data.bonuses[user];
                }
            }

            self.lastHash = data.hash;

            var gameInfo = {
                created: self.created,
                ended: true,
                game_crash: data.game_crash,
                game_id: self.gameId,
                hash: data.hash,
                player_info: self.playerInfo
            };


            //Add the current game info to the game history and if the game history is larger than 40 remove one element
            if (self.tableHistory.length >= 40)
                self.tableHistory.pop();
            self.tableHistory.unshift(gameInfo);

            //Clear current game properties
            self.gameState = 'ENDED';
            self.cashingOut = false;
            self.lag = false;

            //Clear Animation trigger flags
            self.nyan = false;

            self.trigger('game_crash', data);
        });

        /**
         * Event called before starting the game to let the client know when the game is going to start
         * @param {object} info - JSON payload
         * @param {number} info.game_id - The next game id
         * @param {number} info.time_till_start - Time lapse for the next game to begin
         */
        self.ws.on('game_starting', function(info) {
            self.playerInfo = {};
            self.joined = [];

            self.gameState = 'STARTING';
            self.gameId = info.game_id;
            self.timeTillStart = info.time_till_start;
            self.startTime = new Date(Date.now() + info.time_till_start);
            self.maxWin = info.max_win;

            // Every time the game starts checks if there is a queue bet and send it
            if (self.nextBetAmount) {
                self.doBet(self.nextBetAmount, self.nextAutoCashout, function(err) {
                    if(err)
                        console.log('Response from placing a bet: ', err);
                });
            }

            self.trigger('game_starting', info);
        });

        /**
         * Event called every time a user places a bet
         * the user that placed the bet could be me so we check for that
         * @param {object} resp - JSON payload
         * @param {string} resp.username - The player username
         * @param {number} resp.bet - The player bet in satoshis
         */
        self.ws.on('player_bet', function(data) {
            if (self.username === data.username) {
                self.placingBet = false;
                self.nextBetAmount = null;
                self.nextAutoCashout = null;
            }

            self.joined.splice(data.index, 0, data.username);

            self.trigger('player_bet', data);
        });

        /**
         * Event called every time the server cash out a user
         * if we call cash out the server is going to call this event
         * with our name.
         * @param {object} resp - JSON payload
         * @param {string} resp.username - The player username
         * @param {number} resp.stopped_at -The percentage at which the user cashed out
         */
        self.ws.on('cashed_out', function(resp) {
            //Add the cashout percentage of each user at cash out
            if (!self.playerInfo[resp.username])
                return console.warn('Username not found in playerInfo at cashed_out: ', resp.username);

            self.playerInfo[resp.username].stopped_at = resp.stopped_at;

            if (self.username === resp.username) {
                self.cashingOut = false;
                self.balanceSatoshis += self.playerInfo[resp.username].bet * resp.stopped_at / 100;
            }

            self.calcBonuses();

            self.trigger('cashed_out', resp);
        });

        /**
         * Event called every time we receive a chat message
         * @param {object} resp - JSON payload
         * @param {string} time - Time when the message was sent
         * @param {string} type - The 'command': say, mute, error, info
         * @param {username} string - The username of who sent it
         * @param {role} string - admin, moderator, user
         * @param {message} string - Da message
         */
        //self.ws.on('msg', function(data) {
        //    //The chat only renders if the Arr length is diff, remove blocks of the array
        //    if (self.chat.length > AppConstants.Chat.MAX_LENGTH)
        //        self.chat.splice(0, 400);
        //
        //    // Match @username until end of string or invalid username char
        //    var r = new RegExp('@' + self.username + '(?:$|[^a-z0-9_\-])', 'i');
        //    if (data.type === 'say' && data.username !== self.username && r.test(data.message)) {
        //        new Audio('/sounds/gong.mp3').play();
        //    }
        //    self.chat.push(data);
        //
        //    self.trigger('msg', data);
        //});

        /** Triggered by the server to let users the have to reload the page */
        self.ws.on('update', function() {
            alert('Please refresh your browser! We just pushed a new update to the server!');
        });

        self.ws.on('connect', function() {

            requestOtt(function(err, ott) {
                if (err && err != 401) { // If the error is 401 means the user is not logged in
                    console.error('request ott error:', err);
                    if (confirm("An error, click to reload the page: " + err))
                        location.reload();
                    return;
                }

                //If there is a Dev ott use it
                self.ws.emit('join', { ott: window.DEV_OTT? window.DEV_OTT : ott },
                    function(err, resp) {
                        if (err) {
                            console.error('Error when joining the game...', err);
                            return;
                        }

                        self.balanceSatoshis = resp.balance_satoshis;
                        //self.chat = resp.chat;

                        /** If username is a falsey value the user is not logged in */
                        self.username = resp.username;

                        /** Variable to check if we are connected to the server */
                        self.isConnected = true;
                        self.gameState = resp.state;
                        self.playerInfo = resp.player_info;

                        // set current game properties
                        self.gameId = resp.game_id;
                        self.maxWin = resp.max_win;
                        self.lastHash = resp.last_hash;
                        self.created = resp.created;
                        self.startTime = new Date(Date.now() - resp.elapsed);
                        self.joined = resp.joined;
                        self.tableHistory = resp.table_history;

                        if (self.gameState === 'IN_PROGRESS')
                            self.lastGameTick = Date.now();

                    	//Attach username to each user for sorting proposes 
                    	for(var user in self.playerInfo) {
                    		self.playerInfo[user].username = user;
                    	}

                    	//Calculate the bonuses of the current game if necessary
                        if (self.gameState === 'IN_PROGRESS' || self.gameState === 'ENDED'){
                        	self.calcBonuses();
                        }
                            
                        self.trigger('connected');
                    }
                );
            });
        });

        self.ws.on('disconnect', function(data) {
            self.isConnected = false;

            console.log('Client disconnected |', data, '|', typeof data);
            self.trigger('disconnected');
        });
    }

    /**
     * STOP_PREDICTING_LAPSE milliseconds after game_tick we put the game in lag state
     */
    Engine.prototype.checkForLag = function() {
        this.lag = true;
        this.trigger('lag_change');
    };

    /**
     * Sends chat message
     * @param {string} msg - String containing the message, should be longer than 1 and shorter than 500.
     */
    //Engine.prototype.say = function(msg) {
    //    console.assert(msg.length > 1 && msg.length < 500);
    //    this.ws.emit('say', msg);
    //};

    /**
     * Places a bet with a giving amount.
     * @param {number} amount - Bet amount in bits
     * @param {number} autoCashOut - Percentage of self cash out
     * @param {function} callback(err, result)
     */
    Engine.prototype.bet = function(amount, autoCashOut, callback) {
        console.assert(typeof amount == 'number');
        console.assert(Clib.isInteger(amount));
        console.assert(!autoCashOut || (typeof autoCashOut === 'number' && autoCashOut >= 100));

        if(!Clib.isInteger(amount) || !((amount%100) == 0))
            return console.error('The bet amount should be integer and divisible by 100');

        this.nextBetAmount = amount;
        this.nextAutoCashout = autoCashOut;
        this.placingBet = true;

        if (this.gameState === 'STARTING')
            return this.doBet(amount, autoCashOut, callback);

        //otherwise, lets queue the bet
        if (callback)
            callback(null, 'WILL_JOIN_NEXT');

        this.trigger('bet_queued');
    };

    /** Throw the bet at the server **/
    Engine.prototype.doBet =  function(amount, autoCashOut, callback) {
        var self = this;

        this.ws.emit('place_bet', amount, autoCashOut, function(error) {

            if (error) {
                console.warn('place_bet error: ', error);

                if (error !== 'GAME_IN_PROGRESS' && error !== 'ALREADY_PLACED_BET') {
                    alert('There was an error, please reload the window: ' + error);
                }
                if (callback)
                    callback(error);
                return;
            }

            self.trigger('bet_placed');

            if (callback)
                callback(null);
        });
        self.trigger('placing_bet');
    };

    /** Cancels a bet, if the game state is able to do it so */
    Engine.prototype.cancelBet = function() {
        if (!this.nextBetAmount)
            return console.error('Can not cancel next bet, wasn\'t going to make it...');

        this.nextBetAmount = null;
        this.placingBet = false;

        this.trigger('cancel_bet');
    };

    /**
     * Request the server to cash out
     */
    Engine.prototype.cashOut = function() {
        var self = this;
        this.cashingOut = true;
        this.ws.emit('cash_out', function(error) {
            if (error) {
                self.cashingOut = false;
                console.warn('Cashing out error: ', error);
                self.trigger('cashing_out_error'); //TODO: This is not listened anywhere, check if a component needs to listen to it.
            }
        });
        this.trigger('cashing_out');
    };

    /**
     * If the game crashed at zero x remove the bonus projections by setting bonuses to zero.
     */
    Engine.prototype.setBonusesToZero = function() {
        for(var user in this.playerInfo) {
            this.playerInfo[user].bonus = 0;
        }
    };

    /**
     * Calculate the bonuses based on player info and append them to it on connect, cashed_out and game_started
     **/
    Engine.prototype.calcBonuses = function() {
        var self = this;

        //Slides across the array and apply the function to equally stopped_at parts of the array
        function slideSameStoppedAt(arr, fn) {
            var i = 0;
            while (i < arr.length) {
                var tmp = [];
                var betAmount = 0;
                var sa = arr[i].stopped_at;
                for (; i < arr.length && arr[i].stopped_at === sa; ++i) {
                    betAmount += arr[i].bet;
                    tmp.push(i);
                }
                fn(arr, tmp, sa, betAmount);
            }
        }

        //Transform the player info object in an array of references to the user objects
        //{ user1: { bet: satoshis, stopped_at: 200 }, user2: { bet: satoshis } } -> [ user1: { bet: satoshis, stopped_at: 200 } ... ]
        var playersArr = _.map(self.playerInfo, function(player, username) {
            return player;
        });

        //Sort the list of players based on the cashed position, the rest doesn't matter because the losers get the same ratio of bonus
        var playersArrSorted = _.sortBy(playersArr, function(player){
            return player.stopped_at ? -player.stopped_at : null;
        });

        var bonusPool = 0;
        var largestBet = 0;

        //Get max bet and bonus pool
        for (var i = 0, length = playersArrSorted.length; i < length; ++i) {
            var bet = playersArrSorted[i].bet;
            bonusPool += bet / 100;
            largestBet = Math.max(largestBet, bet);
        }

        //The ratio bits per bit bet
        var maxWinRatio = bonusPool / largestBet;

        slideSameStoppedAt(playersArrSorted,
            function(array, listOfRecordsPositions, cashOutAmount, totalBetAmount) {

                //If the bonus pool is empty fill the bonus with 0's
                if (bonusPool <= 0) {
                    for (var i = 0, length = listOfRecordsPositions.length; i < length; i++) {
                        array[listOfRecordsPositions[i]].bonus = 0;
                    }
                    return;
                }

                //If the bonusPool is less than what this user/group could get just give the remaining of the bonus pool
                var toAllocAll = Math.min(totalBetAmount * maxWinRatio, bonusPool);

                //Alloc the bonuses
                for (var i = 0, length = listOfRecordsPositions.length; i < length; i++) {

                    //The alloc qty of this user, if its one it will get all
                    var toAlloc = (array[listOfRecordsPositions[i]].bet / totalBetAmount) * toAllocAll;

                    bonusPool -= toAlloc;

                    array[listOfRecordsPositions[i]].bonus = toAlloc;
                }
            }
        );

    };

    /**
     * Function to request the one time token to the server
     */
    function requestOtt(callback) {

        try {
            var ajaxReq  = new XMLHttpRequest();

            if(!ajaxReq)
                throw new Error("Your browser doesn't support xhr");

            ajaxReq.open("POST", "/ott", true);
            ajaxReq.setRequestHeader('Accept', 'text/plain');
            ajaxReq.send();

        } catch(e) {
            console.error(e);
            alert('Requesting token error: ' + e);
            location.reload();
        }

        ajaxReq.onload = function() {
            if (ajaxReq.status == 200) {
                var response = ajaxReq.responseText;
                callback(null, response);

            } else if (ajaxReq.status == 401) {
                callback(ajaxReq.status);
            } else callback(ajaxReq.responseText);
        }
    }


    /** Create engine Singleton **/
    var EngineSingleton = new Engine();

    /**
     * Here is the other virtual part of the store:
     * The actions created by flux views are converted
     * to calls to the engine which will case changes there
     * and they will be reflected here through the event listener
     */
    AppDispatcher.register(function(payload) {
        var action = payload.action;

        switch(action.actionType) {

            case AppConstants.ActionTypes.PLACE_BET:
                EngineSingleton.bet(action.bet, action.cashOut);
                break;

            case AppConstants.ActionTypes.CANCEL_BET:
                EngineSingleton.cancelBet();
                break;

            case AppConstants.ActionTypes.CASH_OUT:
                EngineSingleton.cashOut();
                break;
            //
            //case AppConstants.ActionTypes.SAY_CHAT:
            //    EngineSingleton.say(action.msg);
            //    break;

        }

        return true; // No errors. Needed by promise in Dispatcher.
    });

    //Singleton Engine
    return EngineSingleton;
});
