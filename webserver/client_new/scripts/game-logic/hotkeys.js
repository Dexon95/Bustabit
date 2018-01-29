define([
    'mousetrap',
    'stores/GameSettingsStore',
    'stores/ControlsStore',
    'actions/HotkeysActions',
    'game-logic/engine',
    'game-logic/stateLib',
    'lodash'
], function(
    Mousetrap,
    GameSettingsStore,
    ControlsStore,
    HotkeysActions,
    Engine,
    StateLib,
    _
) {

    function getState() {
        var state = GameSettingsStore.getState();
        _.extend(state, ControlsStore.getState());
        return state;
    }

    var Hotkeys = function() {
        this.state = {};
        this._doubleBetBinded = this._doubleBet.bind(this);
        this._halfBetBinded = this._halfBet.bind(this);
        this._betCashoutBinded = this._betCashout.bind(this);
        this._onChangeBinded = this._onChange.bind(this);
    };

    Hotkeys.prototype.mount = function() {
        GameSettingsStore.addChangeListener(this._onChangeBinded);
        ControlsStore.addChangeListener(this._onChangeBinded);
        _.extend(this.state, getState());
        if(this.state.hotkeysActive)
            this._bindKeys();
    };

    Hotkeys.prototype.unmount = function() {
        GameSettingsStore.removeChangeListener(this._onChangeBinded);
        ControlsStore.removeChangeListener(this._onChangeBinded);
        Mousetrap.reset();
    };

    Hotkeys.prototype._bindKeys = function() {
        Mousetrap.bind('c', this._doubleBetBinded);
        Mousetrap.bind('x', this._halfBetBinded);
        Mousetrap.bind('space', this._betCashoutBinded);
    };

    Hotkeys.prototype._unbindKeys = function() {
        Mousetrap.unbind('c');
        Mousetrap.unbind('x');
        Mousetrap.unbind('space');
    };

    Hotkeys.prototype._onChange = function() {
        var newState = getState();

        if(this.state.hotkeysActive !== newState.hotkeysActive) {
            if(newState.hotkeysActive)
                this._bindKeys();
            else
                this._unbindKeys();
        }

        _.extend(this.state, getState());
    };

    Hotkeys.prototype._betCashout = function() {
        var invalidBet = (StateLib.canUserBet(Engine.balanceSatoshis, this.state.betSize, this.state.betInvalid, this.state.cashOutInvalid) instanceof Error);
        var notPlaying = StateLib.notPlaying(Engine);
        var isBetting = StateLib.isBetting(Engine);

        // Able to bet, or is already betting
        if(notPlaying || isBetting) {
            if(isBetting && Engine.gameState !== 'STARTING')
                HotkeysActions.cancelBet();

            //Not playing
            else if(!invalidBet && !Engine.placingBet)
                HotkeysActions.placeBet(StateLib.parseBet(this.state.betSize), StateLib.parseCashOut(this.state.cashOut));


        //The user is playing and is not cashing out already
        } else if(!Engine.cashingOut)
                HotkeysActions.cashOut();
    };

    Hotkeys.prototype._doubleBet = function() {
            HotkeysActions.doubleBet();
    };

    Hotkeys.prototype._halfBet = function() {
            HotkeysActions.halfBet();
    };

    return new Hotkeys();
});