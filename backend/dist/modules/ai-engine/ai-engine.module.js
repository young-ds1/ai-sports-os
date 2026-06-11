"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiEngineModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const domain_module_1 = require("../domain/domain.module");
const analysis_entity_1 = require("./analysis/analysis.entity");
const prediction_entity_1 = require("./prediction/prediction.entity");
const chat_session_entity_1 = require("./chat/chat-session.entity");
const chat_message_entity_1 = require("./chat/chat-message.entity");
const openai_service_1 = require("./engines/openai.service");
const prompt_builder_service_1 = require("./engines/prompt-builder.service");
const source_tracer_service_1 = require("./engines/source-tracer.service");
const chat_agent_service_1 = require("./chat/chat-agent.service");
const ai_cache_service_1 = require("./cache/ai-cache.service");
const analysis_service_1 = require("./analysis/analysis.service");
const prediction_service_1 = require("./prediction/prediction.service");
const chat_service_1 = require("./chat/chat.service");
const cost_tracker_service_1 = require("./cost/cost-tracker.service");
const AI_ENTITIES = [analysis_entity_1.AiAnalysis, prediction_entity_1.AiPrediction, chat_session_entity_1.ChatSession, chat_message_entity_1.ChatMessage];
const AI_SERVICES = [
    openai_service_1.OpenaiService, prompt_builder_service_1.PromptBuilderService, source_tracer_service_1.SourceTracerService,
    chat_agent_service_1.ChatAgentService, ai_cache_service_1.AiCacheService, cost_tracker_service_1.CostTrackerService,
    analysis_service_1.AnalysisService, prediction_service_1.PredictionService, chat_service_1.ChatService,
];
let AiEngineModule = class AiEngineModule {
};
exports.AiEngineModule = AiEngineModule;
exports.AiEngineModule = AiEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [domain_module_1.DomainModule, typeorm_1.TypeOrmModule.forFeature(AI_ENTITIES)],
        providers: AI_SERVICES,
        exports: [typeorm_1.TypeOrmModule, ...AI_SERVICES],
    })
], AiEngineModule);
//# sourceMappingURL=ai-engine.module.js.map