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
exports.UserUsage = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserUsage = class UserUsage {
    id;
    user;
    user_id;
    session_id;
    action;
    entity_type;
    entity_id;
    latency_ms;
    created_at;
};
exports.UserUsage = UserUsage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserUsage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserUsage.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], UserUsage.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', nullable: true }),
    __metadata("design:type", String)
], UserUsage.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30 }),
    __metadata("design:type", String)
], UserUsage.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], UserUsage.prototype, "entity_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id', nullable: true }),
    __metadata("design:type", String)
], UserUsage.prototype, "entity_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], UserUsage.prototype, "latency_ms", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], UserUsage.prototype, "created_at", void 0);
exports.UserUsage = UserUsage = __decorate([
    (0, typeorm_1.Entity)('user_usage')
], UserUsage);
//# sourceMappingURL=user-usage.entity.js.map