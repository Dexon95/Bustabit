define(['game-logic/clib'], function(Clib){

    return function(settings) {

        //Validate base bet amount
        var bet = Clib.parseBet(settings.baseBet);
        if(bet instanceof Error)
            return bet.message;

        //Validate auto cash amount
        var co = Clib.parseAutoCash(settings.autoCashAt);
        if(co instanceof Error)
            return co.message;

        //Validate maxBetAmount
        if(!Clib.isInteger(Number(settings.maxBetStop)))
            return 'Max bet should be a number';

        if(!settings.onLossIncreaseQty || settings.onLossIncreaseQty == 0)
            return 'Increase bet by should be a number bigger than 0';
        if(!settings.onWinIncreaseQty || settings.onLossIncreaseQty == 0)
            return 'Increase bet by should be a number bigger than 0';

        var onLossIncreaseQty = Number(settings.onLossIncreaseQty);
        var onWinIncreaseQty = Number(settings.onWinIncreaseQty);

        //The bet multiplier should be greater than zero and a number
        if(settings.onLossSelectedOpt == 'increase_bet_by')
            if(!Clib.isNumber(onLossIncreaseQty))
                return 'Increase bet by should be a number bigger than 0';

        if(settings.onWinSelectedOpt == 'increase_bet_by')
            if(!Clib.isNumber(onWinIncreaseQty))
                return 'Increase bet by should be a number bigger than 0';

        return false;
    };

});
