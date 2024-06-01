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
Object.defineProperty(exports, "__esModule", { value: true });
const twitter_api_v2_1 = require("twitter-api-v2");
class TwitterApiClient {
    constructor(config) {
        this.twitterApi = new twitter_api_v2_1.TwitterApi({
            appKey: config.apiKey,
            appSecret: config.apiSecret,
            accessToken: config.accessToken,
            accessSecret: config.accessTokenSecret,
        });
    }
    tweet(text, params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.twitterApi.v2.tweet(text, params);
        });
    }
    uploadMedia(file) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.twitterApi.v1.uploadMedia(file);
        });
    }
}
exports.default = TwitterApiClient;
