define(['strategies/auto-bet', 'strategies/custom'], function(AutoBet, Custom){
    return {
        autoBet: AutoBet,
        custom: Custom
    }
});