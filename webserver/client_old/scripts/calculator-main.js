define([
    'lib/react',
    'components/Calculator'
], function(
    React,
    CalculatorClass
){

    var Calculator = React.createFactory(CalculatorClass);

    React.render(
        Calculator(null),
        document.getElementById('calculator')
    );

});