const fs = require('fs');
const dotenv = require('dotenv');
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const serveStatic = require('serve-static');
const ActionController = require('./controllers/action-controller');

dotenv.config();
const api = express();
const webapp = express();

/// CONFIGURATION ///
const REFRESH_RATE = 10;
const API_PORT = process.env.PORT || 3000;

const allowedExt = [
    '.js',
    '.ico',
    '.css',
    '.png',
    '.jpg',
    '.woff2',
    '.woff',
    '.ttf',
    '.svg',
];

// enable CORS for all requests
api.use(cors());

// parse application/x-www-form-urlencoded
api.use(bodyParser.urlencoded({extended: false}));

// parse application/json
api.use(bodyParser.json());

// initialize the router
const router = express.Router();

/// ROUTES ///
router.post('/code', ActionController.submitCodingAction);
router.get('/nextUpdate', ActionController.getNextUpdateTimestamp);
router.get('/', serveStatic(path.join(__dirname, './resources/')));

api.use('/api', router);

// serve front-end application
webapp.get('*', (req, res) => {
    if (allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
        res.sendFile(path.join(__dirname, '../..', `front-end/dist/front-end/${req.url}`));
    } else {
        res.sendFile(path.join(__dirname, '../..', 'front-end/dist/front-end/index.html'));
    }
});

if (process.env.NODE_ENV === 'production') {
    // certificate
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/pageblanche.hugodlb.fr/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/pageblanche.hugodlb.fr/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/pageblanche.hugodlb.fr/chain.pem', 'utf8');

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    const httpsApiServer = https.createServer(credentials, api);
    const httpsWebServer = https.createServer(credentials, webapp);

    // start web app
    httpsWebServer.listen(443, () => {
        console.log('Pageblanche web app listening on port 443!');
    });

    // start api
    httpsApiServer.listen(API_PORT, () => {
        console.log('Pageblanche api listening on port ' + API_PORT + '!');

        ActionController.executeAction();
        setInterval(ActionController.executeAction, REFRESH_RATE * 1000);
    });
} else {
    const httpApiServer = http.createServer(api);
    const httpWebServer = http.createServer(webapp);

    // start web app
    httpWebServer.listen(80, () => {
        console.log('Pageblanche web app listening on port 80!');
    });

    // start api
    httpApiServer.listen(API_PORT, () => {
        console.log('Pageblanche api listening on port ' + API_PORT + '!');

        ActionController.executeAction();
        setInterval(ActionController.executeAction, REFRESH_RATE * 1000);
    });
}

module.exports.REFRESH_RATE = REFRESH_RATE;