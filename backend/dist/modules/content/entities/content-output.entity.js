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
exports.ContentOutput = void 0;
const typeorm_1 = require("typeorm");
const content_task_entity_1 = require("./content-task.entity");
let ContentOutput = class ContentOutput {
    id;
    task;
    task_id;
    platform;
    title;
    content; // Final formatted content ready to publish
    format; // 'markdown' | 'plain_text' | 'script' | 'thread'
    hashtags;
    utm_url; // Tracked URL with UTM params
    content_id; // Unique ID for cross-platform tracking
    // AI metadata
    model_version;
    tokens_used;
    confidence_score;
    generated_at;
    // Distribution tracking
    published_at;
    published_url;
    // Engagement metrics (回填)
    engagement;
    created_at;
};
exports.ContentOutput = ContentOutput;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ContentOutput.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => content_task_entity_1.ContentTask, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'task_id' }),
    __metadata("design:type", content_task_entity_1.ContentTask)
], ContentOutput.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_id' }),
    __metadata("design:type", String)
], ContentOutput.prototype, "task_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30 }),
    __metadata("design:type", String)
], ContentOutput.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], ContentOutput.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ContentOutput.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'markdown' }),
    __metadata("design:type", String)
], ContentOutput.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Array)
], ContentOutput.prototype, "hashtags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], ContentOutput.prototype, "utm_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], ContentOutput.prototype, "content_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ContentOutput.prototype, "model_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], ContentOutput.prototype, "tokens_used", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], ContentOutput.prototype, "confidence_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', }),
    __metadata("design:type", Date)
], ContentOutput.prototype, "generated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], ContentOutput.prototype, "published_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], ContentOutput.prototype, "published_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], ContentOutput.prototype, "engagement", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], ContentOutput.prototype, "created_at", void 0);
exports.ContentOutput = ContentOutput = __decorate([
    (0, typeorm_1.Entity)('content_outputs')
], ContentOutput);
//# sourceMappingURL=content-output.entity.js.map