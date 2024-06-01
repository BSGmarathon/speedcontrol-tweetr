"use strict";
/* eslint-disable max-len */
Object.defineProperty(exports, "__esModule", { value: true });
exports.countdownTimer = exports.settings = exports.selectedRunId = exports.tweetData = exports.runFinishTimes = exports.runDataActiveRunSurrounding = exports.runDataArray = exports.runDataActiveRun = void 0;
const bundles_1 = require("@tweetr/util/bundles");
const nodecg_1 = require("./nodecg");
/**
 * This is where you can declare all your replicant to import easily into other files,
 * and to make sure they have any correct settings on startup.
 */
// Replicants from other bundles
exports.runDataActiveRun = (0, nodecg_1.get)().Replicant('runDataActiveRun', bundles_1.speedcontrolBundle);
exports.runDataArray = (0, nodecg_1.get)().Replicant('runDataArray', bundles_1.speedcontrolBundle);
exports.runDataActiveRunSurrounding = (0, nodecg_1.get)().Replicant('runDataActiveRunSurrounding', bundles_1.speedcontrolBundle);
exports.runFinishTimes = (0, nodecg_1.get)().Replicant('runFinishTimes', bundles_1.speedcontrolBundle);
// Our replicants
exports.tweetData = (0, nodecg_1.get)().Replicant('tweetData', {
    defaultValue: {},
});
exports.selectedRunId = (0, nodecg_1.get)().Replicant('selectedRunId');
exports.settings = (0, nodecg_1.get)().Replicant('settings', {
    defaultValue: {
        autoTweet: false,
        countdown: 60,
    },
});
exports.countdownTimer = (0, nodecg_1.get)().Replicant('countdownTimer', {
    persistent: false,
    defaultValue: {
        countdownActive: false,
        cancelTweet: false,
        sendTweet: false,
        countdown: -1,
    },
});
