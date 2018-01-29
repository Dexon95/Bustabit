define(function(){
    return "// This strategy editor is in BETA mode, please\n\
// exercise extreme caution and use exclusively at\n\
// your own risk. No bets can or will be refunded in\n\
// case of errors.\n\
\n\
// Please note the strategy editor executes arbitrary\n\
// javascript without a sandbox and as such, only use\n\
// strategies from trusted sources, as they can be\n\
// backdoored to lose all your money or have\n\
// intentional exploitable weaknesses etc.\n\
\n\
// To see the full engine API go to:\n\
///https://github.com/moneypot/webserver/blob/master/client_new/scripts/game-logic/script-controller.js\n\
\n\
// To discuss, request or post a strategy checkout:\n\
///http://www.reddit.com/r/moneypot/\n\
\n\
//Engine events: \n\
\n\
engine.on('game_starting', function(info) {\n\
    console.log('Game Starting in ' + info.time_till_start);\n\
});\n\
\n\
engine.on('game_started', function(data) {\n\
    console.log('Game Started', data);\n\
});\n\
\n\
engine.on('game_crash', function(data) {\n\
    console.log('Game crashed at ', data.game_crash);\n\
});\n\
\n\
engine.on('player_bet', function(data) {\n\
    console.log('The player ', data.username, ' placed a bet. This player could be me :o.')\n\
});\n\
\n\
engine.on('cashed_out', function(resp) {\n\
    console.log('The player ', resp.username, ' cashed out. This could be me.');\n\
});\n\
\n\
engine.on('msg', function(data) {\n\
    console.log('Chat message!...');\n\
});\n\
\n\
engine.on('connect', function() {\n\
    console.log('Client connected, this wont happen when you run the script');\n\
});\n\
\n\
engine.on('disconnect', function() {\n\
    console.log('Client disconnected');\n\
});\n\
\n\
\n\
//Getters:\n\
console.log('Balance: ' + engine.getBalance());\n\
console.log('The current payout is: ' + engine.getCurrentPayout());\n\
console.log('My username is: ', engine.getUsername());\n\
console.log('The max current bet is: ', engine.getMaxBet()/100, ' Bits');\n\
console.log('The current maxWin is: ', engine.getMaxWin()/100, ' Bits');\n\
// engine.getEngine() for raw engine \n\
\n\
\n\
//Helpers:\n\
console.log('Was the last game played? ', engine.lastGamePlayed()?'Yes':'No');\n\
console.log('Last game status: ', engine.lastGamePlay());\n\
\n\
\n\
//Actions:\n\
//Do this between the 'game_starting' and 'game_started' events\n\
//engine.placeBet(betInSatoshis, autoCashOutinPercent, autoPlay);\n\
\n\
//engine.cashOut(); //Do this when playing\n\
//engine.stop(); //Stops the strategy\n\
//engine.chat('Hello Spam');\n";
});
