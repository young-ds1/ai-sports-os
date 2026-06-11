import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || 'sk-mock-key';
    const baseURL = process.env.OPENAI_BASE_URL || undefined; // GitHub Models, DeepSeek etc.

    const config: any = { apiKey };
    if (baseURL) {
      config.baseURL = baseURL;
      this.logger.log(`Using custom AI provider: ${baseURL}`);
    }

    this.client = new OpenAI(config);
  }

  async chat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: { model?: string; temperature?: number; maxTokens?: number },
  ): Promise<{ answer: string; model: string; tokensUsed: number }> {
    // DeepSeek V4 Pro by default. Override with OPENAI_MODEL env var.
    const model = options?.model || process.env.OPENAI_MODEL || 'deepseek-v4-pro';

    // Mock mode: no API key or explicitly set to mock
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-mock-key') {
      return this.mockResponse(messages);
    }

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      });

      return {
        answer: response.choices[0]?.message?.content || 'No response generated',
        model: response.model,
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch (err) {
      this.logger.error('AI API call failed', err);
      throw err;
    }
  }

  private mockResponse(
    messages: { role: string; content: string }[],
  ): { answer: string; model: string; tokensUsed: number } {
    const userMsg = messages.find((m) => m.role === 'user')?.content || '';

    if (userMsg.includes('分析') || userMsg.includes('analysis')) {
      return {
        answer: `## AI 赛事分析报告

### 📊 近期状态
本场比赛双方近期表现有明显差异。主队近5场取得4胜，客队状态不佳。

### ⚔️ 攻防分析
主队进攻体系运转流畅，场均进球2.3个；客队防线存在明显漏洞。

### 👤 关键球员
主队核心球员近期状态火热，是比赛的关键变量。客队需要重点限制其发挥。

### 🧠 战术预测
预计主队将采用高位压迫战术，利用边路速度撕开防线。客队可能收缩防守，寻求反击机会。

### 💡 AI 总结
综合来看，主队占据明显优势，但足球比赛充满变数。本场比赛值得关注。`,
        model: 'mock-mode',
        tokensUsed: 0,
      };
    }

    return {
      answer: `Based on the available data: ${userMsg.substring(0, 100)}... I'd recommend checking the match details for comprehensive statistics and insights.`,
      model: 'mock-mode',
      tokensUsed: 0,
    };
  }
}
