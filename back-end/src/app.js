const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const serveStatic = require('serve-static');
const ActionController = require('./controllers/action-controller');

const api = express();
const webapp = express();

const REFRESH_RATE = 10;
const PORT = process.env.PORT || 3000;

// enable CORS for all requests
api.use(cors());

// parse application/x-www-form-urlencoded
api.use(bodyParser.urlencoded({extended: false}));

// parse application/json
api.use(bodyParser.json());

// initialize the router
const router = express.Router();

/// API ROUTES ///
router.post('/code', ActionController.submitCodingAction);
router.get('/nextUpdate', ActionController.getNextUpdateTimestamp);
router.get('/', serveStatic(path.join(__dirname, './resources/')));

api.use('/api', router);

// serve front-end application
webapp.use('/', serveStatic(path.join(__dirname, '../..', 'front-end/dist/front-end')));

// start api
api.listen(PORT, function () {
    console.log('Pageblanche api listening on port ' + PORT + '!');

    ActionController.executeAction();
    setInterval(ActionController.executeAction, REFRESH_RATE * 1000);
});

// start web app
webapp.listen(80, function () {
    console.log('Pageblanche web app listening on port 80!');
});

module.exports.REFRESH_RATE = REFRESH_RATE;