define(['dispatcher/Dispatcher', 'lib/lodash', 'constants/AppConstants'], function(Dispatcher, _, AppConstants){

    var AppDispatcher = _.extend(new Dispatcher(), {

        /**
         * A bridge function between the views and the dispatcher, marking the action
         * as a view action.  Another variant here could be handleServerAction.
         * @param  {object} action The data coming from the view.
         */
        handleViewAction: function(action) {
            this.dispatch({
                source: AppConstants.PayloadSources.VIEW_ACTION,
                action: action
            });
        }

    });

    return AppDispatcher;

});