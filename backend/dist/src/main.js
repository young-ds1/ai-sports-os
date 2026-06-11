"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // CORS for Next.js frontend
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
    });
    // Global prefix
    app.setGlobalPrefix('api', { exclude: ['api/health'] });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`⚽ AI Sports OS backend running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map