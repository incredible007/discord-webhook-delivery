import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    const config = new DocumentBuilder()
        .setTitle('Discord Webhook Delivery')
        .setDescription(
            'Отказоустойчивая система отправки Discord-вебхуков с очередью и Outbox Pattern',
        )
        .setVersion('1.0')
        .addApiKey(
            {
                type: 'apiKey',
                name: 'x-api-key',
                in: 'header',
                description: 'API ключ для авторизации',
            },
            'x-api-key',
        )
        .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api-doc', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    })

    await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
