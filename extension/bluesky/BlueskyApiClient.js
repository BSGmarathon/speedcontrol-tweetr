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
const axios_1 = __importDefault(require("axios"));
const promises_1 = require("fs/promises");
const nodecg_1 = require("@tweetr/util/nodecg");
const constants_1 = require("@tweetr/bluesky/constants");
const utf8_1 = __importDefault(require("utf8"));
class BlueskyApiClient {
    // private encoder = new TextEncoder();
    // private decoder = new TextDecoder();
    constructor(config) {
        this.config = config;
        this.bussyClient = axios_1.default.create({
            baseURL: 'https://bsky.social',
            headers: {
                'User-Agent': 'BussyClient +github.com/bsgmarathon/speedcontrol-tweetr',
            },
        });
        this.session = null;
        this.login().then((loginSes) => {
            this.session = loginSes;
            // Refresh every 30 mins
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    this.session = yield this.refreshToken();
                }
                catch (e) {
                    (0, nodecg_1.get)().log.error('Error refreshing Bluesky token:', e);
                }
            }), 30 * 60 * 1000);
        });
    }
    tweet(text, params) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.session === null) {
                this.session = yield this.login();
            }
            const facets = yield this.parseFacets(text);
            const created = (new Date()).toISOString();
            const postData = {
                $type: 'app.bsky.feed.post',
                text,
                createdAt: created,
                embed: params === null || params === void 0 ? void 0 : params.imageData,
                facets,
            };
            const collectionData = {
                repo: (_b = (_a = this.session) === null || _a === void 0 ? void 0 : _a.did) !== null && _b !== void 0 ? _b : '',
                collection: 'app.bsky.feed.post',
                record: postData,
            };
            const { data } = yield this.bussyClient.post('/xrpc/com.atproto.repo.createRecord', collectionData, {
                headers: {
                    Authorization: this.accessToken,
                },
            });
            (0, nodecg_1.get)().log.debug('Post create response', data);
        });
    }
    uploadMedia(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileStat = yield (0, promises_1.stat)(file);
            const contentType = this.guessContentType(file);
            const fileType = contentType.split('/')[0];
            if (fileType === 'image' && fileStat.size > constants_1.IMAGE_MAX_SIZE) {
                throw new Error(`Image too large :), got ${fileStat.size} bytes, ${constants_1.IMAGE_MAX_SIZE} bytes maximum.`);
            }
            else if (fileType === 'video' && fileStat.size > constants_1.VIDEO_MAX_SIZE) {
                throw new Error(`Video too large :), got ${fileStat.size} bytes, ${constants_1.VIDEO_MAX_SIZE} bytes maximum.`);
            }
            if (this.session === null) {
                this.session = yield this.login();
            }
            const fileBuff = yield (0, promises_1.readFile)(file);
            const { data } = yield this.bussyClient.post('/xrpc/com.atproto.repo.uploadBlob', fileBuff, {
                headers: {
                    Authorization: this.accessToken,
                    'Content-Type': contentType,
                },
            });
            (0, nodecg_1.get)().log.debug('Image upload response', data);
            // So turns out this does not work???
            // Keep getting "Video not found"
            // 11/10 platform
            // Documentation: https://github.com/bluesky-social/atproto/blob/main/lexicons/app/bsky/feed/post.json#L30
            // Yeah good luck
            if (fileType === 'video') {
                return {
                    $type: 'app.bsky.embed.video',
                    video: data.blob,
                };
            }
            return {
                $type: 'app.bsky.embed.images',
                images: [
                    {
                        alt: '',
                        image: data.blob,
                    },
                ],
            };
        });
    }
    get accessToken() {
        var _a, _b;
        return `Bearer ${(_b = (_a = this.session) === null || _a === void 0 ? void 0 : _a.accessJwt) !== null && _b !== void 0 ? _b : ''}`;
    }
    get refreshHeader() {
        var _a, _b;
        return `Bearer ${(_b = (_a = this.session) === null || _a === void 0 ? void 0 : _a.refreshJwt) !== null && _b !== void 0 ? _b : ''}`;
    }
    guessContentType(fileName) {
        const ext = fileName.split('.')[2];
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
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.bussyClient.post('/xrpc/com.atproto.server.createSession', {
                identifier: this.config.bluesky.identifier,
                password: this.config.bluesky.password,
            });
            console.log(data);
            return data;
        });
    }
    refreshToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.bussyClient.post('/xrpc/com.atproto.server.refreshSession', null, {
                headers: {
                    Authorization: this.refreshHeader,
                },
            });
            console.log(data);
            return data;
        });
    }
    fetchTheStupidDid(handle) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.bussyClient.get('/xrpc/com.atproto.identity.resolveHandle', {
                    params: {
                        handle,
                    },
                });
                return data.did;
            }
            catch (e) {
                return null;
            }
        });
    }
    parseMentions(message) {
        var _a;
        const spans = [];
        const matches = message.matchAll(constants_1.mentionRegex);
        // Iterators do not have forEach
        // eslint-disable-next-line no-restricted-syntax
        for (const match of matches) {
            const handle = match[1];
            const index = ((_a = match.index) !== null && _a !== void 0 ? _a : 0) + 1;
            spans.push({
                start: index,
                end: index + handle.length,
                handle: utf8_1.default.decode(handle).substring(1), // strip off the '@'
            });
        }
        return spans;
    }
    parseUrls(message) {
        var _a;
        const spans = [];
        const matches = message.matchAll(constants_1.urlRegex);
        // Iterators do not have forEach
        // eslint-disable-next-line no-restricted-syntax
        for (const match of matches) {
            const url = match[1];
            const index = ((_a = match.index) !== null && _a !== void 0 ? _a : 0) + 1;
            spans.push({
                start: index,
                end: index + url.length,
                url: utf8_1.default.decode(url),
            });
        }
        return spans;
    }
    parseHashtags(message) {
        var _a;
        const spans = [];
        const matches = message.matchAll(constants_1.hashtagRegex);
        // Iterators do not have forEach
        // eslint-disable-next-line no-restricted-syntax
        for (const match of matches) {
            const tag = match[1];
            const index = ((_a = match.index) !== null && _a !== void 0 ? _a : 0) + 1;
            spans.push({
                start: index,
                end: index + tag.length,
                tag: utf8_1.default.decode(tag).substring(1), // strip off the '#'
            });
        }
        return spans;
    }
    parseFacets(message) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: find a way to use TextEncoder/TextDecoder that are built-in
            const utf8Message = utf8_1.default.encode(message);
            const facets = [];
            const promises = [];
            this.parseMentions(utf8Message).forEach((mention) => {
                // I hate this so much
                // I don't want to make a request for each mention found
                // WHY DO YOU WORK THIS WAY
                promises.push(this.fetchTheStupidDid(mention.handle)
                    .then((did) => {
                    if (did) {
                        facets.push({
                            index: {
                                byteStart: mention.start,
                                byteEnd: mention.end,
                            },
                            features: [
                                { $type: 'app.bsky.richtext.facet#mention', did },
                            ],
                        });
                    }
                }));
            });
            this.parseUrls(utf8Message).forEach((url) => {
                facets.push({
                    index: {
                        byteStart: url.start,
                        byteEnd: url.end,
                    },
                    features: [
                        { $type: 'app.bsky.richtext.facet#link', uri: url.url },
                    ],
                });
            });
            this.parseHashtags(utf8Message).forEach((hashtag) => {
                facets.push({
                    index: {
                        byteStart: hashtag.start,
                        byteEnd: hashtag.end,
                    },
                    features: [
                        { $type: 'app.bsky.richtext.facet#tag', tag: hashtag.tag },
                    ],
                });
            });
            yield Promise.all(promises);
            return facets;
        });
    }
}
exports.default = BlueskyApiClient;
