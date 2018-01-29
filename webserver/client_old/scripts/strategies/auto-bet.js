define([
    'strategies/auto-bet/widget',
    'strategies/auto-bet/logic',
    'strategies/auto-bet/validation',
    'strategies/auto-bet/initial-state'
], function(
    Widget,
    Logic,
    Validation,
    InitialState
){

    var AutoBet = Widget;
    AutoBet.logic = Logic;
    AutoBet.validate = Validation;
    AutoBet.initialState = InitialState;
    AutoBet.isWidget = true;

    return AutoBet;
});


