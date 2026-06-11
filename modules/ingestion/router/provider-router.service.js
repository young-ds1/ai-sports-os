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
exports.ProviderRouterService = void 0;
const common_1 = require("@nestjs/common");
const api_football_mock_1 = require("../../../providers/football/api-football.mock");
let ProviderRouterService = class ProviderRouterService {
    adapters = new Map();
    constructor() {
        // Phase 2: Mock adapters. Phase 3: Real HTTP adapters via config.
        this.register(new api_football_mock_1.ApiFootballMockAdapter());
    }
    register(adapter) {
        this.adapters.set(adapter.provider, adapter);
    }
    getAdapter(provider) {
        const adapter = this.adapters.get(provider);
        if (!adapter) {
            throw new Error(`No provider adapter registered for: ${provider}`);
        }
        return adapter;
    }
};
exports.ProviderRouterService = ProviderRouterService;
exports.ProviderRouterService = ProviderRouterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ProviderRouterService);
//# sourceMappingURL=provider-router.service.js.map