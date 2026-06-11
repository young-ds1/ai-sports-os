"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentTask = exports.ContentStatus = exports.ContentType = exports.ContentTrigger = void 0;
const typeorm_1 = require("typeorm");
// Content trigger sources
var ContentTrigger;
(function (ContentTrigger) {
    ContentTrigger["MATCH_FINISHED"] = "match_finished";
    ContentTrigger["MATCH_SCHEDULED"] = "match_scheduled";
    ContentTrigger["PLAYER_MILESTONE"] = "player_milestone";
    ContentTrigger["DAILY_DIGEST"] = "daily_digest";
    ContentTrigger["TRENDING_TOPIC"] = "trending_topic";
    ContentTrigger["MANUAL"] = "manual";
})(ContentTrigger || (exports.ContentTrigger = ContentTrigger = {}));
var ContentType;
(function (ContentType) {
    ContentType["PRE_MATCH"] = "pre_match";
    ContentType["POST_MATCH"] = "post_match";
    ContentType["PLAYER_SPOTLIGHT"] = "player_spotlight";
    ContentType["TEAM_DEEP_DIVE"] = "team_deep_dive";
    ContentType["HOT_TAKE"] = "hot_take";
    ContentType["RANKING"] = "ranking";
    ContentType["FUN_FACT"] = "fun_fact";
})(ContentType || (exports.ContentType = ContentType = {}));
var ContentStatus;
(function (ContentStatus) {
    ContentStatus["PENDING"] = "pending";
    ContentStatus["GENERATING"] = "generating";
    ContentStatus["COMPLETED"] = "completed";
    ContentStatus["FAILED"] = "failed";
    ContentStatus["PUBLISHED"] = "published";
})(ContentStatus || (exports.ContentStatus = ContentStatus = {}));
let ContentTask = class ContentTask {
    id;
    trigger_type;
    reference_type; // 'match' | 'team' | 'player'
    reference_id;
    content_type;
    target_platforms; // ['xiaohongshu', 'twitter', 'wechat', 'douyin', 'seo']
    status;
    priority;
    // Context for AI generation
    input_context;
    model_version;
    total_tokens_used;
    completed_at;
    created_at;
};
exports.ContentTask = ContentTask;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ContentTask.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30 }),
    __metadata("design:type", String)
], ContentTask.prototype, "trigger_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], ContentTask.prototype, "reference_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ContentTask.prototype, "reference_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30 }),
    __metadata("design:type", String)
], ContentTask.prototype, "content_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json' }),
    __metadata("design:type", Array)
], ContentTask.prototype, "target_platforms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'pending' }),
    __metadata("design:type", String)
], ContentTask.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ContentTask.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], ContentTask.prototype, "input_context", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ContentTask.prototype, "model_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], ContentTask.prototype, "total_tokens_used", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], ContentTask.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], ContentTask.prototype, "created_at", void 0);
exports.ContentTask = ContentTask = __decorate([
    (0, typeorm_1.Entity)('content_tasks')
], ContentTask);
//# sourceMappingURL=content-task.entity.js.map