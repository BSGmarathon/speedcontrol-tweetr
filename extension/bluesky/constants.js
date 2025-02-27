"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMAGE_MAX_SIZE = exports.VIDEO_MAX_SIZE = exports.hashtagRegex = exports.urlRegex = exports.mentionRegex = void 0;
/* eslint-disable max-len */
// regex based on: https://atproto.com/specs/handle#handle-identifier-syntax
exports.mentionRegex = /[$|\W](@([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)/g;
exports.urlRegex = /[$|\W](https?:\/\/(www\.)?[-a-zA-Z0-9@:%._x+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*[-a-zA-Z0-9@%_+~#//=])?)/g;
exports.hashtagRegex = /[$|\W](#[a-zA-Z0-9_-]+)/g;
exports.VIDEO_MAX_SIZE = 50000000;
exports.IMAGE_MAX_SIZE = 1000000;
