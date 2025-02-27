import { get as nodecg } from '@tweetr/util/nodecg';
import { TweetData } from '@tweetr/types/schemas';
import {
  countdownTimer,
  runDataActiveRun,
  runDataActiveRunSurrounding,
  runDataArray,
  runFinishTimes,
  selectedRunId,
  settings,
  tweetData,
} from '@tweetr/util/replicants';
import { layoutsBundle } from '@tweetr/util/bundles';
import { RunData } from 'speedcontrol-util/types';
import ITwitterClient, { TweetOptions } from '@tweetr/base/ITwitterClient';
import TwitterApiClient from '@tweetr/twitter/TwitterApiClient';
import DummyTwitterClient from '@tweetr/twitter/DummyTwitterClient';
import type NodeCGTypes from '@nodecg/types';
import Papa from 'papaparse';
import BlueskyApiClient from '@tweetr/bluesky/BlueskyApiClient';
import { MediaData as BussyPics } from '@tweetr/bluesky/types';

let buttonTimer: NodeJS.Timeout | undefined;

const config = nodecg().bundleConfig;
const twitterClient: ITwitterClient<string> = config.useDummyTwitterClient
  ? new DummyTwitterClient() : new TwitterApiClient(config);
const blueskyClient: ITwitterClient<BussyPics> = config.useDummyTwitterClient
  ? new DummyTwitterClient() : new BlueskyApiClient(config);

setTimeout(() => {
  clearInterval(buttonTimer);
  countdownTimer.value = {
    countdownActive: false,
    cancelTweet: false,
    sendTweet: false,
    countdown: -1,
  };
}, 1000);

function getMediaPath(mediaName: string): string {
  return `./assets/speedcontrol-tweetr/media/${mediaName}`;
}

async function sendTweet(): Promise<void> {
  clearInterval(buttonTimer);
  const data = tweetData.value[selectedRunId.value];

  if (!data || !data.content) {
    nodecg().log.warn(`Skipping tweet for "${data.game}, ${data.category}" due to missing content`);
    return;
  }

  if (data.content.includes('!lastRunTime')) {
    const prev = runDataActiveRunSurrounding.value.previous;

    if (prev) {
      try {
        data.content = data.content.replace('!lastRunTime', runFinishTimes.value[prev].time);
      } catch {
        nodecg().log.warn('The last run either doesn\'t exist or doesn\'t have a final time.');
      }
    } else {
      nodecg().log.warn('The last run either doesn\'t exist or doesn\'t have a final time.');
    }
  }

  try {
    let twitterImageData: TweetOptions<string> | undefined;
    let bussyImageData: TweetOptions<BussyPics> | undefined;

    if (data.media && data.media !== 'None') {
      const mediaPath = getMediaPath(data.media);
      const blueskyImageData = await blueskyClient.uploadMedia(mediaPath);
      const mediaId = await twitterClient.uploadMedia(mediaPath);

      twitterImageData = {
        imageData: mediaId,
      };
      bussyImageData = {
        imageData: blueskyImageData,
      };
    }

    // const content = `Automated production test: ${Date.now()}, please ignore.\n${data.content}`;
    const { content } = data;

    await blueskyClient.tweet(content, bussyImageData);
    await twitterClient.tweet(content, twitterImageData);

    countdownTimer.value = {
      ...countdownTimer.value,
      countdownActive: false,
      sendTweet: true,
    };
  } catch (e: unknown) {
    const run = runDataArray.value.find((r) => r.id === selectedRunId.value)
      || { game: 'missingno', category: '' };
    nodecg().log.warn(
      `Error posting tweet. Your tweet is either blank, invalid, or a duplicate. Run: ${
        run.game} ${run.category}`,
    );
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

function startCountdown(): void {
  clearInterval(buttonTimer);

  let time = settings.value.countdown;
  countdownTimer.value = {
    countdownActive: true,
    cancelTweet: false,
    sendTweet: false,
    countdown: time,
  };

  buttonTimer = setInterval(() => {
    time -= 1;
    countdownTimer.value = {
      ...countdownTimer.value,
      countdownActive: true,
      countdown: time,
    };
    if (time <= 0) {
      clearInterval(buttonTimer);
      sendTweet();
    }
  }, 1000);
}

function cancelTweet(): void {
  clearInterval(buttonTimer);
  countdownTimer.value = {
    countdownActive: false,
    cancelTweet: true,
    sendTweet: false,
    countdown: -1,
  };
}

type CSVData = {
  ID: string;
  Game: string;
  Category: string;
  'Runner(s)': string;
  'Tweet Content': string;
  Media: string;
};

async function importCSV(val: string, ack: NodeCGTypes.Acknowledgement | undefined): Promise<void> {
  const { data } = Papa.parse<string[]>(val);
  const tmpData: TweetData = {
    ...tweetData.value,
  };

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
          content: row[4], // index 3 is runner names
          media: mediaName || null,
        };
      }
    }

    nodecg().log.debug('Imported csv data', tmpData);

    tweetData.value = tmpData;

    if (ack && !ack.handled) {
      ack(null);
    }
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);

    if (ack && !ack.handled) {
      ack(err);
    }
  }
}

function createCSV(ack: NodeCGTypes.Acknowledgement | undefined): void {
  const array: CSVData[] = [];

  Object.keys(tweetData.value).forEach((run) => {
    const runData = runDataArray.value.find((x) => x.id === run);

    if (!runData) {
      return;
    }

    const runners = runData.teams.flatMap(
      (team) => team.players.map((r) => r.name),
    );

    array.push({
      ID: run,
      Game: runData.game || 'missingno',
      Category: runData.category || 'unknown%',
      'Runner(s)': runners.join(', '),
      'Tweet Content': tweetData.value[run].content,
      Media: (tweetData.value[run].media === 'None') ? '' : tweetData.value[run].media || '',
    });
  });

  if (ack && !ack.handled) {
    ack(null, Papa.unparse<CSVData>(array));
  }
}

function syncArrays(runArray: RunData[]): void {
  const currentData = tweetData.value;
  const updatedData: TweetData = {};

  runArray.forEach((run) => {
    if (currentData[run.id] === undefined) {
      updatedData[run.id] = {
        game: run.game || 'Unknown Game',
        category: run.category || 'Unknown Category',
        content: '',
        media: null,
      };
    } else {
      updatedData[run.id] = currentData[run.id];
    }
  });

  nodecg().log.debug('Arrays synced', updatedData);

  tweetData.value = updatedData;
}

if (config.useEsaLayouts) {
  nodecg().listenFor('obsChangeScene', layoutsBundle, ({ scene }) => {
    if (scene === config.obs.gameLayout && settings.value.autoTweet) {
      startCountdown();
    }
  });
}

nodecg().listenFor('sendTweet', () => sendTweet());
nodecg().listenFor('cancelTweet', () => cancelTweet());
nodecg().listenFor('exportCSV', (value, callback) => createCSV(callback));
nodecg().listenFor('importCSV', (value, callback) => importCSV(value, callback));

runDataArray.on('change', (newVal) => syncArrays(newVal));
runDataActiveRun.on('change', (newVal) => {
  let newRunId = '';

  if (newVal) {
    newRunId = newVal.id;
  } else {
    const runs = runDataArray.value;

    if (runs.length) {
      newRunId = runs[0].id;
    }
  }

  if (!config.useEsaLayouts && newRunId !== selectedRunId.value && settings.value.autoTweet) {
    startCountdown();
  }

  if (newRunId !== selectedRunId.value) {
    countdownTimer.value = {
      cancelTweet: false,
      countdownActive: false,
      sendTweet: false,
      countdown: 0,
    };
  }

  selectedRunId.value = newRunId;
});

selectedRunId.on('change', () => {
  if (countdownTimer.value.countdownActive) {
    cancelTweet();
  }
});
