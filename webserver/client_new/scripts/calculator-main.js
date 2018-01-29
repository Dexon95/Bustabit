requirejs.config({
    baseUrl: "scripts", //If no baseUrl is explicitly set in the configuration, the default value will be the location of the HTML page that loads require.js.
    paths: {

        react: 'https://cdnjs.cloudflare.com/ajax/libs/react/0.13.3/react.min',
        seedrandom: 'https://cdnjs.cloudflare.com/ajax/libs/seedrandom/2.4.0/seedrandom.min',
        lodash: "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/3.9.3/lodash.min"

    }
});

require(['calculator']);