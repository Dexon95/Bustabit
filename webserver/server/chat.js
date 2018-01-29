var assert   =  require('assert');
var CBuffer  =  require('CBuffer');
var events   =  require('events');
var util     =  require('util');
var _        =  require('lodash');
var debug    =  require('debug')('app:chat');

var db       =  require('./database');
var lib      =  require('./lib');

/** How to use the chat on the client?
 *
 * 1.- Connect with socket.io to bustabit.com
 *      The id(session) cookie on the socket.io handshake is used for authentication
 * 2.- On connect emit a join event with the channel name you want to join
 * 3.- Listen for the 'say' and other stuff
 *
 * There is an all channel where every message is broadcasted
 * The bots should send every message with the flag is bot for other clients to be able to filter them if they want
 *
 * Moderators:
 *
 *
 */

//2nd step
//Create a mod channel and save it to the database
//Mute users by ip/username and store muted users in the database

var CHAT_HISTORY_SIZE = 100;

var SPECIAL_CHANNELS = {
    all: {
        desc: 'Channel where all messages are broadcasted, read only',
        writable: false,
        modsOnly: false
    },

    moderators: {
        desc: 'Channel for moderators only, they are joinedds',
        writable: true,
        modsOnly: true
    }

    //This is the behaviour for all the other channels:
    //defaultProps: {
    //    desc: '',
    //    writable: true,
    //    modsOnly: false
    //}
};

// There is a mods channel for every channel
// The mods are joined to a channel called mod:channelName

function Chat(io) {
    var self = this;

    self.io = io;

    // Number of connected clients
    self.clientCount = 0;

    /*
     Collection of muted users.
     key:   Username
     value: Object with the following fields
     time:       Date object when the user was muted
     moderator:  The username of the moderator that muted the user
     timespec:   Initial (nominal diff) time the user has been muted
     end:        Until when the user is muted
     shadow:     If the mute is a shadow mute
     */
    self.muted = {};

    io.on('connection', onConnection);

    function onConnection(socket) {  //socket.user is attached on the login middleware
        debug('socket connection event received');

        //Attach disconnect handler
        socket.on('disconnect', function() {
            --self.clientCount;
            console.log('Client disconnect, left: ', self.clientCount);
            debug('client disconnect');
        });

        //Join to a Room
        socket.on('join', function(channelName) {
            debug('join event received from user %s', socket.user ? socket.user.username : '~guest~');
            self.join(socket, channelName);
        });

        //Register the message event
        socket.on('say', function(message, isBot, customChannelName) {
            self.onSay(socket, message, isBot, customChannelName);
        });

        ++self.clientCount;
        console.log('Client joined: ', self.clientCount, ' - ', socket.user ? socket.user.username : '~guest~'); //TODO: Add ip address
    }

    events.EventEmitter.call(self); //Call event emitter 'constructor' function
}

util.inherits(Chat, events.EventEmitter);

Chat.prototype.join = function(socket, channelName) {
    var self = this;

    var moderator = socket.user && socket.user.moderator;

    //Check channelName variable and avoid users to join the mods channel
    if(isChannelNameInvalid(channelName) || isChannelNameModsOnly(channelName))
        return sendError(socket, '[join] Invalid channel name');

    //Check if the channel is moderators only
    if(SPECIAL_CHANNELS.hasOwnProperty(channelName))
        if(SPECIAL_CHANNELS[channelName].modsOnly && !moderator)
            return sendError(socket, '[join] This channel is moderators only');

    //Check if the user was joined to another room before, if it was leave that room
    if(socket.currentChannel)
        socket.leave(socket.currentChannel);

    //If mod leave the mods channel for this channel
    if(socket.modCurrentChannel)
        socket.leave(socket.modCurrentChannel);

    //Save the name of the current room in the socket, this can also be used to check if the user is joined into a channel
    socket.currentChannel = channelName;

    //Get user history of a room and send it to the user
    self.getHistory(channelName, function(err, history) {

        //If we couldn't reach the history send an empty history to the user
        if(err) {
            history = [];
        }

        var res = {
            history: history,
            username: socket.user ? socket.user.username : null,
            channel: channelName,
            moderator: moderator
        };

        //Actually join the socket.io room
        socket.join(channelName);

        //If the user is mod and is not on the mods channel join him to the channel mod:channelName
        if(moderator && channelName !== 'moderators') {
            var chan = 'mod:'+channelName;
            socket.join(chan);
            socket.modCurrentChannel = chan;
        }

        //Return join info to the user
        socket.emit('join', res);
    });

};

Chat.prototype.onSay = function(socket, message, isBot, customChannelName) {
    if (!socket.user)
        return sendError(socket, '[say] you must be logged in to chat');

    if (!socket.currentChannel)
        return sendError(socket, '[say] you must be joined before you can chat');

    //Check if the message is for a custom channel
    var channelName;
    if(customChannelName)
        if(isChannelNameInvalid(customChannelName))
            return sendError(socket, '[say] invalid channel name');
        else
            channelName = customChannelName;
    else
        channelName = socket.currentChannel;

    //Check if the message is for a non writable channel ('all')
    if(SPECIAL_CHANNELS.hasOwnProperty(channelName) && !SPECIAL_CHANNELS[channelName].writable)
        return sendErrorChat(socket, 'The all channel is read only');

    //Message validation
    message = message.trim();

    if (typeof message !== 'string')
        return sendError(socket, '[say] no message');

    if (message.length == 0 || message.length > 500)
        return sendError(socket, '[say] invalid message size');

    var cmdReg = /^\/([a-zA-z]*)\s*(.*)$/;
    var cmdMatch = message.match(cmdReg);

    if (cmdMatch) //If the message is a command try to execute it
        this.doChatCommand(socket.user, cmdMatch, channelName, socket);
    else //If not broadcast the message
        this.say(socket, socket.user, message, channelName, isBot);

};

Chat.prototype.doChatCommand = function(user, cmdMatch, channelName, socket) {
    var self = this;

    var cmd  = cmdMatch[1];
    var rest = cmdMatch[2];

    switch (cmd) {
        case 'shutdown':
            return sendErrorChat(socket, '[shutdown] deprecated feature boss');
        case 'mute':
        case 'shadowmute':
            if (user.moderator) {
                var muteReg = /^\s*([a-zA-Z0-9_\-]+)\s*([1-9]\d*[dhms])?\s*$/;
                var muteMatch = rest.match(muteReg);

                if (!muteMatch)
                    return sendErrorChat(socket, 'Usage: /mute <user> [time]');

                var username = muteMatch[1];
                var timespec = muteMatch[2] ? muteMatch[2] : "30m";
                var shadow   = cmd === 'shadowmute';

                self.mute(shadow, user, username, timespec, channelName,
                    function (err) {
                        if (err)
                            return sendErrorChat(socket, err);
                    });
            } else {
                return sendErrorChat(socket, '[mute] Not a moderator.');
            }
            break;
        case 'unmute':
            if (user.moderator) {
                var unmuteReg = /^\s*([a-zA-Z0-9_\-]+)\s*$/;
                var unmuteMatch = rest.match(unmuteReg);

                if (!unmuteMatch)
                    return sendErrorChat(socket, 'Usage: /unmute <user>');

                var username = unmuteMatch[1];
                self.unmute(
                    user, username, channelName,
                    function (err) {
                        if (err) return sendErrorChat(socket, err);
                    });
            }
            break;
        default:
            sendErrorChat(socket, 'Unknown command ' + cmd);
            break;
    }
};

Chat.prototype.getHistory = function (channelName, callback) {
    if(channelName === 'all')
        db.getAllChatTable(CHAT_HISTORY_SIZE, fn);
    else
        db.getChatTable(CHAT_HISTORY_SIZE, channelName, fn);

    function fn (err, history) {
        if(err) {
            console.error('[INTERNAL_ERROR] got error ', err, ' loading chat table');
            return callback(err);
        }

        callback(null, history);
    }
};

Chat.prototype.say = function(socket, user, message, channelName, isBot) {
    var self = this;

    var date = new Date();

    isBot = !!isBot;

    var msg = {
        date:      date,
        type:      'say',
        username:  user.username,
        role:      user.userclass,
        message:   message,
        bot:       isBot,
        channelName: channelName
    };

    //Check if the user is muted
    if (lib.hasOwnProperty(self.muted, user.username)) {
        var muted = self.muted[user.username];
        if (muted.end < date) {
            // User has been muted before, but enough time has passed.
            delete self.muted[user.username];
        } else if (muted.shadow) {
            // User is shadow muted. Echo the message back to the
            // user but don't broadcast.
            self.sendMessageToUser(socket, msg);
            return;
        } else {
            self.sendMessageToUser(socket, {
                date:      date,
                type:      'info',
                username:  user.username,
                role:      user.userclass,
                message:   'You\'re muted. ' + lib.printTimeString(muted.end - date) + ' remaining',
                bot:       false,
                channelName: channelName
            });
            return;
        }
    }

    self.sendMessageToChannel(channelName, msg, user.id);
};

/** Send a message to the user of this socket **/
Chat.prototype.sendMessageToUser = function(socket, msg) {
    socket.emit('msg', msg);
};

/** Send a message to a channel and to the all channel and store it in the database **/
Chat.prototype.sendMessageToChannel = function(channelName, msg, userID) {
    console.assert(msg.hasOwnProperty('bot') && msg.date, msg.hasOwnProperty('message') && msg.type);
    this.io.to(channelName).emit('msg', msg);
    this.io.to('all').emit('msg', msg);
    this.saveChatMessage(userID, msg.message, channelName, msg.bot, msg.date);
};

Chat.prototype.saveChatMessage = function(userId, message, channelName, isBot, date) {
    db.addChatMessage(userId, date, message, channelName, isBot, function(err) {
       if(err)
        console.error('[INTERNAL_ERROR] got error ', err, ' saving chat message of user id ', userId);
    });
};

Chat.prototype.mute = function(shadow, moderatorUser, username, time, channelName, callback) {
    var self = this;
    var now = new Date();
    var ms  = lib.parseTimeString(time);
    var end = new Date(Date.now() + ms);

    // Query the db to make sure that the username exists.
    db.getUserByName(username, function(err, userInfo) {

        if (err) {
            if(typeof err === 'string') //USERNAME_DOES_NOT_EXIST
                callback(err);
            else
                console.error('[INTERNAL_ERROR] got error ', err, ' muting user ', userInfo.username);
            return;
        }
        assert(userInfo);

        // Overriding previous mutes.
        self.muted[userInfo.username] = {
            date:        now,
            moderator:   moderatorUser.username,
            timespec:    time,
            end:         end,
            shadow:      shadow
        };

        var msg = {
            date:        now,
            type:        'mute',
            message: null,
            moderator:   moderatorUser.username,
            username:    userInfo.username,
            timespec:    time,
            shadow:      shadow,
            bot: false
        };

        //If mute shadow inform only mods about it
        if (shadow) {
            self.io.to('moderators').emit('msg', msg);
            self.io.to('mod:'+channelName).emit('msg', msg);
        //If regular mute send mute message to the channel
        } else {
            self.io.to(channelName).emit('msg', msg);
            self.io.to('moderators').emit('msg', msg);
        }

        callback(null);
    });
};

Chat.prototype.unmute = function(moderatorUser, username, channelName, callback) {
    var self = this;
    var now = new Date();

    if (!lib.hasOwnProperty(self.muted, username))
        return callback('USER_NOT_MUTED');

    var shadow = self.muted[username].shadow;
    delete self.muted[username];

    var msg = {
        date:      now,
        type:      'unmute',
        message: null,
        moderator: moderatorUser.username,
        username:  username,
        shadow:    shadow,
        bot: false
    };

    //If mute shadow inform only mods about it
    if (shadow) {
        self.io.to('moderators').emit('msg', msg);
        self.io.to('mod:'+channelName).emit('msg', msg);
        //If regular mute send mute message to the channel
    } else {
        self.io.to(channelName).emit('msg', msg);
        self.io.to('moderators').emit('msg', msg);
    }

    callback(null);
};

//Send an error to the chat to a client's socket
function sendErrorChat(socket, message) {
    socket.emit('msg', {
        date: new Date(),
        type: 'error',
        message: message
    });
}

//Send an error event to a client's socket
function sendError(socket, description) {
    console.warn('Chat client error ', description);
    socket.emit('err', description);
}

function isChannelNameInvalid(channelName) {
    return (typeof channelName !== 'string' || channelName.length < 1 || channelName.length > 100);
}

function isChannelNameModsOnly(channelName) {
    return /^mod:/.test(channelName);
}

module.exports = Chat;