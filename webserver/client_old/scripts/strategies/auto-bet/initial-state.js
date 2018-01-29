define(function(){
    return {
        baseBet: 1,
        autoCashAt: 2,
        onLossSelectedOpt: 'return_to_base', //Options: return_to_base, increase_bet_by
        onLossIncreaseQty: 2,
        onWinSelectedOpt: 'return_to_base', //Options: return_to_base, increase_bet_by
        onWinIncreaseQty: 2,
        invalidData: false,
        maxBetStop: 1000000
    }
});