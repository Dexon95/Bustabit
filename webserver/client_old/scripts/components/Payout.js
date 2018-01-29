define(['lib/react', 'lib/clib'], function(React, Clib) {

    var D = React.DOM;

    return React.createClass({
        displayName: 'payout',

        propTypes: {
            engine: React.PropTypes.object.isRequired
        },

        getInitialState: function() {
            return {
                payout: 0
            }
        },

        componentDidMount: function() {
            window.requestAnimationFrame(this.draw);
        },

        draw: function() {
            if (!this.isMounted())
                return;

            var po = Clib.calcGamePayout(Clib.getElapsedTimeWithLag(this.props.engine));

            if (po)
                this.setState({ payout: po * this.props.engine.currentPlay().bet });
            else
                this.setState({ payout: null });

            window.requestAnimationFrame(this.draw);
        },

        render: function() {
            var decimals = this.props.engine.currentPlay().bet < 10000 ? 2 : 0;

            return D.span(null, Clib.formatSatoshis(this.state.payout, decimals));
        }
    });

});