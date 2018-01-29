define([
    'lib/react',
    'lib/lodash'
], function(
    React, _
){

    var D = React.DOM;

    /** Abstraction for using radio buttons as components in react **/
    return React.createClass({
        displayName: 'reactRadio',

        propTypes: {
            name: React.PropTypes.string.isRequired,
            value: React.PropTypes.string, //Selected radio, not way to change it,
            defaultValue: React.PropTypes.string, //Default value, selected
            onChange: React.PropTypes.func.isRequired
        },

        //When mounting the component we set the default value
        componentDidMount: function() {
            this.update();
        },

        //If the component updates we don't want the component to return to the default value
        componentDidUpdate: function() {
            //this.update();
        },

        update: function() {
            if(this.props.defaultValue && !this.props.value)
                this.setSelectedRadio(this.props.defaultValue);
        },

        change: function() {
            if(!this.props.value)
                this.props.onChange(this.getSelectedRadio());
        },

        getSelectedRadio: function() {
            var radios = this.getRadios();

            for(var i=0, length = radios.length; i < length; i++)
                if(radios[i].checked)
                    return radios[i].value;

            return null;
        },

        setSelectedRadio: function(value) {
            var radios = this.getRadios();

            for(var i = 0, length = radios.length; i < length; i++)
                if(radios[i].value == value)
                    radios[i].checked = true;
        },

        getRadios: function() {
            return this.getDOMNode().querySelectorAll('input[type="radio"]');
        },

        render: function() {
            var self = this;

            return D.div({ onChange: this.change },
                React.Children.map(this.props.children, function(child) {

                    var newProps = { name: self.props.name };

                    //Disable propagation if we send children inside the radios, the event will uncheck the radio, i don't have idea why xD
                    if(child.props.children)
                        React.Children.map(child.props.children, function(child) {

                            if(child.props.onChange)
                                var childrenChange = child.props.onChange;

                            _.extend(child.props, { onChange: function(e) {
                                e.stopPropagation();
                                if(childrenChange)
                                    childrenChange();
                            } });
                        });

                    //If the user sends a value disable all the other options
                    if(self.props.value)
                        if(child.props.value !== self.props.value)
                            newProps.disabled = true;
                        else {
                            newProps.checked = true;
                            newProps.readOnly = true;
                        }

                    //assign name to each child
                    _.extend(child.props, newProps);
                    return child;
                })
            )
        }
    });

});