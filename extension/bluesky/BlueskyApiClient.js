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
class BlueskyApiClient {
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
            const created = (new Date()).toISOString();
            const postData = {
                $type: 'app.bsky.feed.post',
                text,
                createdAt: created,
                embed: params === null || params === void 0 ? void 0 : params.imageData,
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
            if (fileStat.size > 1000000) {
                throw new Error('File too large :)');
            }
            if (this.session === null) {
                this.session = yield this.login();
            }
            const fileBuff = yield (0, promises_1.readFile)(file);
            const { data } = yield this.bussyClient.post('/xrpc/com.atproto.repo.uploadBlob', fileBuff, {
                headers: {
                    Authorization: this.accessToken,
                    'Content-Type': this.guessContentType(file),
                },
            });
            (0, nodecg_1.get)().log.debug('Image upload response', data);
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
}
exports.default = BlueskyApiClient;
