"use strict";
/* eslint-disable class-methods-use-this */
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
const nodecg_1 = require("@tweetr/util/nodecg");
class DummyTwitterClient {
    tweet(text, params) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, nodecg_1.get)().log.info(`Dummy tweet: ${text}`);
        });
    }
    uploadMedia(file) {
        return __awaiter(this, void 0, void 0, function* () {
            return 'Dummy media :D';
        });
    }
}
exports.default = DummyTwitterClient;
