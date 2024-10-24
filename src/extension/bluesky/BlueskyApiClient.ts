import ITwitterClient, { TweetOptions } from '@tweetr/base/ITwitterClient';
import axios from 'axios';
import { Configschema } from '@tweetr/types/schemas';
import { readFile, stat } from 'fs/promises';

export interface BlueskySession {
  accessJwt: string;
  did: string;
}

export interface BlueskyUpdateResult {
  blob: {
    $type: 'blob';
    ref: {
      $link: string;
    };
    mimeType: string;
    size: number;
  };
}

export interface BlueskyImageData {
  $type: 'app.bsky.embed.images';
  images: {
    alt: string;
    image: BlueskyUpdateResult['blob'];
  }[];
}

export default class BlueskyApiClient implements ITwitterClient<BlueskyImageData> {
  private bussyClient = axios.create({
    baseURL: 'https://bsky.social',
    headers: {
      'User-Agent': 'BussyClient +github.com/bsgmarathon/speedcontrol-tweetr',
    },
  });
  private session: BlueskySession | null = null;

  constructor(
    private config: Configschema,
  ) {
  }

  async tweet(text: string, params: TweetOptions<BlueskyImageData> | undefined): Promise<void> {
    if (this.session === null) {
      this.session = await this.login();
    }

    const created = (new Date()).toISOString();
    const postData = {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: created,
      embed: params?.imageData,
    };
    const collectionData = {
      repo: this.session?.did ?? '',
      collection: 'app.bsky.feed.post',
      record: postData,
    };

    const { data } = await this.bussyClient.post('/xrpc/com.atproto.repo.createRecord', collectionData, {
      headers: {
        Authorization: this.accessToken,
      },
    });

    console.log(data);
  }

  async uploadMedia(file: string): Promise<BlueskyImageData> {
    const fileStat = await stat(file);

    if (fileStat.size > 1000000) {
      throw new Error('File too large :)');
    }

    if (this.session === null) {
      this.session = await this.login();
    }

    const fileBuff = await readFile(file);

    const { data } = await this.bussyClient.post<BlueskyUpdateResult>(
      '/xrpc/com.atproto.repo.uploadBlob',
      fileBuff,
      {
        headers: {
          Authorization: this.accessToken,
          'Content-Type': this.guessContentType(file),
        },
      },
    );

    console.log(data);

    return {
      $type: 'app.bsky.embed.images',
      images: [
        {
          alt: '',
          image: data.blob,
        },
      ],
    };
  }

  private get accessToken(): string {
    return `Bearer ${this.session?.accessJwt ?? ''}`;
  }

  private guessContentType(fileName: string): string {
    const ext = fileName.split('.')[1];

    switch (ext) {
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'mp4':
        return 'video/mp4';
      default:
        return 'application/octet-stream';
    }
  }

  private async login(): Promise<BlueskySession> {
    const { data } = await this.bussyClient.post<BlueskySession>('/xrpc/com.atproto.server.createSession', {
      identifier: this.config.bluesky.identifier,
      password: this.config.bluesky.password,
    });

    console.log(data);

    return data;
  }
}
