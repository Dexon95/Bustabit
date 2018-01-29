define([
    'lib/react',
    'lib/clib',
    'components/Graph',
    'game-logic/engine'
], function(
    React,
    Clib,
    Graph,
    Engine
){

    var D = React.DOM;

    function getState(){
        return {
            engine: Engine
        }
    }

    return React.createClass({
        displayName: 'Chart',

        getInitialState: function () {
            return getState();
        },

        _onChange: function() {
            //Check if its mounted because when Game view receives the disconnect event from EngineVirtualStore unmounts all views
            //and the views unregister their events before the event dispatcher dispatch them with the disconnect event
            if(this.isMounted())
                this.setState(getState());
        },

        componentWillMount: function() {
            var width;

            window.onresize=function() {
                if (window.innerWidth > 767) {
                    if((window.innerWidth) < 1000) {
                        width = Math.floor(window.innerWidth * 0.58);
                    } else {
                        width = 600;
                    }
                } else {
                    width = window.innerWidth * 0.9;
                }
                self.graph = new Graph(width, 300);
            };

            if (window.innerWidth > 767) {
                if((window.innerWidth) < 1000) {
                    width = Math.floor(window.innerWidth * 0.58);
                } else {
                    width = 600;
                }
            } else {
                width = window.innerWidth * 0.9;
            }

            this.graph = new Graph(width, 300);
        },

        componentWillUnmount: function() {
            Engine.off({
                game_started: this._onChange,
                game_crash: this._onChange,
                game_starting: this._onChange,
                lag_change: this._onChange
            });

            this.mounted = false;
        },

        componentDidMount: function() {
            Engine.on({
                game_started: this._onChange,
                game_crash: this._onChange,
                game_starting: this._onChange,
                lag_change: this._onChange
            });

            this.mounted = true;
            this.animRequest = window.requestAnimationFrame(this._draw);
        },

        _draw: function() {
            if(this.mounted) { //TODO: If mounted could be checked with react, is there a reason to do it manually?
                var canvas = this.refs.canvas.getDOMNode();
                if (!canvas.getContext) {
                    console.log('No canvas');
                    return;
                }
                var ctx = canvas.getContext('2d');

                this.graph.setData(ctx, canvas, this.state.engine);
                this.graph.calculatePlotValues();
                this.graph.clean();
                this.graph.drawGraph();
                this.graph.drawAxes();
                this.graph.drawGameData();

                this.animRequest = window.requestAnimationFrame(this._draw);
            }
        },

        render: function() {
            return D.div({ className: 'chart', style: { position: 'relative' }},
                D.div({ style: { position: 'absolute', bottom: '27px', right: '30px', fontSize: '55%' }},
                    'Max profit: ', (this.state.engine.maxWin/1e8).toFixed(4), ' BTC'),

                D.canvas({
                    width: this.graph.canvasWidth,
                    height: this.graph.canvasHeight,
                    ref: 'canvas'
                })
            )
        }

    });

});