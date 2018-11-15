const fs = require('fs');
const ValidatorHelper = require('../helpers/validator-helper');
const path = require('path');
const app = require('../app');

let nextUpdate = -1;
let REFRESH_RATE = -1;

/**
 * The current pile of actions and player IPs (emptied every 60 seconds)
 *
 * @type {Array}
 */
let playerIps = [];
let actions = [];

/**
 * Retrieves the next update timestamp
 *
 * @param req
 * @param res
 */
exports.getNextUpdateTimestamp = function (req, res) {
    if (REFRESH_RATE === -1) {
        REFRESH_RATE = app.REFRESH_RATE;
    }

    // adding an extra second
    const secondsLeft = nextUpdate - Math.floor((+ new Date()) / 1000) + 1;
    res.send({
        success: true,
        message: 'Please wait ' + secondsLeft + ' second(s) before sending a new code version.',
        data: {
            nextUpdate: nextUpdate,
            refreshRate: REFRESH_RATE
        }
    });
};

/**
 * Submit a coding action: write or delete a letter
 *
 * @param req
 * @param res
 */
exports.submitCodingAction = function (req, res) {
    const validRequest = ValidatorHelper.validateCodingRequest(req, res);

    if (playerIps.indexOf(req.connection.remoteAddress) > -1) {
        // adding an extra second
        const secondsLeft = nextUpdate - Math.floor((+ new Date()) / 1000) + 1;
        res.status(400).send({
            success: false,
            message: 'Please wait ' + secondsLeft + ' second(s) before sending a new code version.',
            data: {
                nextUpdate: nextUpdate,
                refreshRate: REFRESH_RATE
            }
        });
        return;
    }

    if (validRequest) {
        const action = req.body;

        actions.push(action.type + ';' + action.value + ';' + action.row + ';' + action.column);
        playerIps.push(req.connection.remoteAddress);

        // adding an extra second
        const secondsLeft = nextUpdate - Math.floor((+ new Date()) / 1000) + 1;
        res.send({
            success: true,
            message: 'Please wait ' + secondsLeft + ' second(s) before sending a new code version.',
            data: {
                nextUpdate: nextUpdate,
                refreshRate: REFRESH_RATE
            }
        });
    }
};

/**
 * Finds the most voted action and executes it
 */
exports.executeAction = function () {
    if (actions.length > 0) {
        let mostVotedAction = mostOccurrences(actions);
        mostVotedAction = mostVotedAction.split(';');

        const type = mostVotedAction[0];
        const value = mostVotedAction[1];
        const row = Number.parseInt(mostVotedAction[2]);
        const column = Number.parseInt(mostVotedAction[3]);

        if (column < 0 || row < 0) {
            return;
        }

        if (type === 'WRITE') {
            const data = fs.readFileSync(path.join(__dirname, '../resources/index.html'), 'utf-8').toString().replace(/\r\n/g,'\n').split("\n");
            let lineIndex = row - 1;
            let line = data[lineIndex];

            if (typeof line !== 'undefined') {
                if (value === 'Enter') {
                    if (column <= 0) {
                        data.splice(lineIndex, 0, '');
                    } else if (column >= line.length) {
                        data.splice(lineIndex + 1, 0, '');
                    } else {
                        const currentLine = line.substr(0, column);
                        const newLine = line.substr(column, line.length - column);
                        data[lineIndex] = currentLine;
                        data.splice(lineIndex + 1, 0, newLine);
                    }
                } else if (value === 'Spacebar') {
                    data[lineIndex] = line.substr(0, column) + ' ' + line.substr(column);
                } else if (column <= line.length) {
                    const newLine = line.substr(0, column) + value + line.substr(column);
                    data[lineIndex] = newLine;
                }

                fs.writeFile(path.join(__dirname, '../resources/index.html'), data.join("\n"), function (err) {
                    if (err) return console.log(err);
                });
            }
        } else {
            // DELETE
            const data = fs.readFileSync(path.join(__dirname, '../resources/index.html'), 'utf-8').toString().replace(/\r\n/g,'\n').split("\n");
            let lineIndex = row - 1;
            let line = data[lineIndex];

            if (typeof line !== 'undefined') {
                if (column === 0 && lineIndex !== 0) {
                    data[lineIndex - 1] += line;
                    data.splice(lineIndex, 1);
                } else if (column <= line.length) {
                    const part1 = data[lineIndex].substring(0, column - 1);
                    const part2 = data[lineIndex].substring(column, data[lineIndex].length);
                    data[lineIndex] = part1 + part2;
                }

                fs.writeFile(path.join(__dirname, '../resources/index.html'), data.join("\n"), function (err) {
                    if (err) return console.log(err);
                });
            }
        }
    }

    playerIps = [];
    actions = [];

    if (REFRESH_RATE === -1) {
        REFRESH_RATE = app.REFRESH_RATE;
    }
    nextUpdate = Math.floor((+ new Date()) / 1000) + REFRESH_RATE;
};

/**
 * Returns the string with the most occurrences in the given array
 *
 * @param arr
 * @returns {String}
 */
const mostOccurrences = function (arr) {
    return arr.sort((a, b) =>
        arr.filter(v => v === a).length
        - arr.filter(v => v === b).length
    ).pop();
};