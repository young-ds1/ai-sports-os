import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainModule } from '../domain/domain.module';
import { AiAnalysis } from './analysis/analysis.entity';
import { AiPrediction } from './prediction/prediction.entity';
import { ChatSession } from './chat/chat-session.entity';
import { ChatMessage } from './chat/chat-message.entity';
import { OpenaiService } from './engines/openai.service';
import { PromptBuilderService } from './engines/prompt-builder.service';
import { SourceTracerService } from './engines/source-tracer.service';
import { ChatAgentService } from './chat/chat-agent.service';
import { AiCacheService } from './cache/ai-cache.service';
import { AnalysisService } from './analysis/analysis.service';
import { PredictionService } from './prediction/prediction.service';
import { ChatService } from './chat/chat.service';
import { CostTrackerService } from './cost/cost-tracker.service';

const AI_ENTITIES = [AiAnalysis, AiPrediction, ChatSession, ChatMessage];
const AI_SERVICES = [
  OpenaiService, PromptBuilderService, SourceTracerService,
  ChatAgentService, AiCacheService, CostTrackerService,
  AnalysisService, PredictionService, ChatService,
];

@Module({
  imports: [DomainModule, TypeOrmModule.forFeature(AI_ENTITIES)],
  providers: AI_SERVICES,
  exports: [TypeOrmModule, ...AI_SERVICES],
})
export class AiEngineModule {}
