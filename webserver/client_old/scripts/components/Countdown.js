define(['lib/react'], function(React){

    var D = React.DOM;

    return React.createClass({
        displayName: 'Timer',

        propTypes: {
            engine: React.PropTypes.object.isRequired
        },

        getInitialState: function() {
            return {
                countdown: 0
            }
        },

        interval: null,

        componentWillMount: function() {
            this.interval = setInterval(this._update, 1000); //TODO: Is this fluxy?
            this._update();
        },

        componentWillUnmount: function() {
            clearInterval(this.interval);
        },

        _update: function() {
            var countdown = Math.ceil(Math.max(this.props.engine.startTime - Date.now(), 0) / 1000); //Todo: Next game in, send to a lib
            this.setState({ countdown: countdown });
        },

        render: function() {
            return D.span(null, 'The game is starting in ', D.b(null, this.state.countdown), '...');
        }
    });
});

