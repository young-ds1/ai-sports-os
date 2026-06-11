"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_NAMES = exports.ContentEventType = exports.MatchEventType = void 0;
var MatchEventType;
(function (MatchEventType) {
    MatchEventType["MATCH_CREATED"] = "match.created";
    MatchEventType["MATCH_UPDATED"] = "match.updated";
    MatchEventType["MATCH_FINISHED"] = "match.finished";
    MatchEventType["STANDINGS_UPDATED"] = "standings.updated";
})(MatchEventType || (exports.MatchEventType = MatchEventType = {}));
var ContentEventType;
(function (ContentEventType) {
    ContentEventType["CONTENT_DAILY"] = "content.daily";
    ContentEventType["CONTENT_MANUAL"] = "content.manual";
})(ContentEventType || (exports.ContentEventType = ContentEventType = {}));
exports.QUEUE_NAMES = {
    MATCH_EVENTS: 'match-events',
    CONTENT_EVENTS: 'content-events',
};
//# sourceMappingURL=queue.types.js.map