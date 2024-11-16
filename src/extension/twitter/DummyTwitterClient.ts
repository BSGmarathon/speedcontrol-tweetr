import { get as nodecg } from '@tweetr/util/nodecg';
import ITwitterClient, { TweetOptions } from '@tweetr/base/ITwitterClient';

export default class DummyTwitterClient implements ITwitterClient<never> {
  async tweet(text: string, params: TweetOptions<never> | undefined): Promise<void> {
    nodecg().log.info(`Dummy tweet: ${text}`);
  }

  async uploadMedia(file: string): Promise<never> {
    return 'Dummy media :D' as never; // cursed as fuck lmao :D
  }
}
