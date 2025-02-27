"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodecg_1 = require("@tweetr/util/nodecg");
const replicants_1 = require("@tweetr/util/replicants");
const bundles_1 = require("@tweetr/util/bundles");
const TwitterApiClient_1 = __importDefault(require("@tweetr/twitter/TwitterApiClient"));
const DummyTwitterClient_1 = __importDefault(require("@tweetr/twitter/DummyTwitterClient"));
const papaparse_1 = __importDefault(require("papaparse"));
const BlueskyApiClient_1 = __importDefault(require("@tweetr/bluesky/BlueskyApiClient"));
let buttonTimer;
const config = (0, nodecg_1.get)().bundleConfig;
const twitterClient = config.useDummyTwitterClient
    ? new DummyTwitterClient_1.default() : new TwitterApiClient_1.default(config);
const blueskyClient = config.useDummyTwitterClient
    ? new DummyTwitterClient_1.default() : new BlueskyApiClient_1.default(config);
setTimeout(() => {
    clearInterval(buttonTimer);
    replicants_1.countdownTimer.value = {
        countdownActive: false,
        cancelTweet: false,
        sendTweet: false,
        countdown: -1,
    };
}, 1000);
function getMediaPath(mediaName) {
    return `./assets/speedcontrol-tweetr/media/${mediaName}`;
}
function sendTweet() {
    return __awaiter(this, void 0, void 0, function* () {
        clearInterval(buttonTimer);
        const data = replicants_1.tweetData.value[replicants_1.selectedRunId.value];
        if (!data || !data.content) {
            (0, nodecg_1.get)().log.warn(`Skipping tweet for "${data.game}, ${data.category}" due to missing content`);
            return;
        }
        if (data.content.includes('!lastRunTime')) {
            const prev = replicants_1.runDataActiveRunSurrounding.value.previous;
            if (prev) {
                try {
                    data.content = data.content.replace('!lastRunTime', replicants_1.runFinishTimes.value[prev].time);
                }
                catch (_a) {
                    (0, nodecg_1.get)().log.warn('The last run either doesn\'t exist or doesn\'t have a final time.');
                }
            }
            else {
                (0, nodecg_1.get)().log.warn('The last run either doesn\'t exist or doesn\'t have a final time.');
            }
        }
        try {
            let twitterImageData;
            let bussyImageData;
            if (data.media && data.media !== 'None') {
                const mediaPath = getMediaPath(data.media);
                const blueskyImageData = yield blueskyClient.uploadMedia(mediaPath);
                const mediaId = yield twitterClient.uploadMedia(mediaPath);
                twitterImageData = {
                    imageData: mediaId,
                };
                bussyImageData = {
                    imageData: blueskyImageData,
                };
            }
            // const content = `Automated production test: ${Date.now()}, please ignore.\n${data.content}`;
            const { content } = data;
            yield blueskyClient.tweet(content, bussyImageData);
            yield twitterClient.tweet(content, twitterImageData);
            replicants_1.countdownTimer.value = Object.assign(Object.assign({}, replicants_1.countdownTimer.value), { countdownActive: false, sendTweet: true });
        }
        catch (e) {
            const run = replicants_1.runDataArray.value.find((r) => r.id === replicants_1.selectedRunId.value)
                || { game: 'missingno', category: '' };
            (0, nodecg_1.get)().log.warn(`Error posting tweet. Your tweet is either blank, invalid, or a duplicate. Run: ${run.game} ${run.category}`);
            // eslint-disable-next-line no-console
            console.error(e);
        }
    });
}
function startCountdown() {
    clearInterval(buttonTimer);
    let time = replicants_1.settings.value.countdown;
    replicants_1.countdownTimer.value = {
        countdownActive: true,
        cancelTweet: false,
        sendTweet: false,
        countdown: time,
    };
    buttonTimer = setInterval(() => {
        time -= 1;
        replicants_1.countdownTimer.value = Object.assign(Object.assign({}, replicants_1.countdownTimer.value), { countdownActive: true, countdown: time });
        if (time <= 0) {
            clearInterval(buttonTimer);
            sendTweet();
        }
    }, 1000);
}
function cancelTweet() {
    clearInterval(buttonTimer);
    replicants_1.countdownTimer.value = {
        countdownActive: false,
        cancelTweet: true,
        sendTweet: false,
        countdown: -1,
    };
}
function importCSV(val, ack) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data } = papaparse_1.default.parse(val);
        const tmpData = Object.assign({}, replicants_1.tweetData.value);
        try {
            // we start at 1 to skip the header row
            for (let i = 1; i < data.length; i += 1) {
                const row = data[i];
                // We are missing properties so we skip it
                if (row.length < 6) {
                    // eslint-disable-next-line no-continue
                    continue;
                }
                const split = row[5].split('/');
                const mediaName = split[split.length - 1];
                if (row[0]) {
                    tmpData[row[0]] = {
                        game: row[1],
                        category: row[2],
                        content: row[4],
                        media: mediaName || null,
                    };
                }
            }
            (0, nodecg_1.get)().log.debug('Imported csv data', tmpData);
            replicants_1.tweetData.value = tmpData;
            if (ack && !ack.handled) {
                ack(null);
            }
        }
        catch (err) {
            // eslint-disable-next-line no-console
            console.error(err);
            if (ack && !ack.handled) {
                ack(err);
            }
        }
    });
}
function createCSV(ack) {
    const array = [];
    Object.keys(replicants_1.tweetData.value).forEach((run) => {
        const runData = replicants_1.runDataArray.value.find((x) => x.id === run);
        if (!runData) {
            return;
        }
        const runners = runData.teams.flatMap((team) => team.players.map((r) => r.name));
        array.push({
            ID: run,
            Game: runData.game || 'missingno',
            Category: runData.category || 'unknown%',
            'Runner(s)': runners.join(', '),
            'Tweet Content': replicants_1.tweetData.value[run].content,
            Media: (replicants_1.tweetData.value[run].media === 'None') ? '' : replicants_1.tweetData.value[run].media || '',
        });
    });
    if (ack && !ack.handled) {
        ack(null, papaparse_1.default.unparse(array));
    }
}
function syncArrays(runArray) {
    const currentData = replicants_1.tweetData.value;
    const updatedData = {};
    runArray.forEach((run) => {
        if (currentData[run.id] === undefined) {
            updatedData[run.id] = {
                game: run.game || 'Unknown Game',
                category: run.category || 'Unknown Category',
                content: '',
                media: null,
            };
        }
        else {
            updatedData[run.id] = currentData[run.id];
        }
    });
    (0, nodecg_1.get)().log.debug('Arrays synced', updatedData);
    replicants_1.tweetData.value = updatedData;
}
if (config.useEsaLayouts) {
    (0, nodecg_1.get)().listenFor('obsChangeScene', bundles_1.layoutsBundle, ({ scene }) => {
        if (scene === config.obs.gameLayout && replicants_1.settings.value.autoTweet) {
            startCountdown();
        }
    });
}
(0, nodecg_1.get)().listenFor('sendTweet', () => sendTweet());
(0, nodecg_1.get)().listenFor('cancelTweet', () => cancelTweet());
(0, nodecg_1.get)().listenFor('exportCSV', (value, callback) => createCSV(callback));
(0, nodecg_1.get)().listenFor('importCSV', (value, callback) => importCSV(value, callback));
replicants_1.runDataArray.on('change', (newVal) => syncArrays(newVal));
replicants_1.runDataActiveRun.on('change', (newVal) => {
    let newRunId = '';
    if (newVal) {
        newRunId = newVal.id;
    }
    else {
        const runs = replicants_1.runDataArray.value;
        if (runs.length) {
            newRunId = runs[0].id;
        }
    }
    if (!config.useEsaLayouts && newRunId !== replicants_1.selectedRunId.value && replicants_1.settings.value.autoTweet) {
        startCountdown();
    }
    if (newRunId !== replicants_1.selectedRunId.value) {
        replicants_1.countdownTimer.value = {
            cancelTweet: false,
            countdownActive: false,
            sendTweet: false,
            countdown: 0,
        };
    }
    replicants_1.selectedRunId.value = newRunId;
});
replicants_1.selectedRunId.on('change', () => {
    if (replicants_1.countdownTimer.value.countdownActive) {
        cancelTweet();
    }
});
