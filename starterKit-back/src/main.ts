import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3009', 
      'http://localhost:4200',
      'http://localhost', 
      'http://18.169.1.118',
      'http://18.169.1.118:4200',
      'http://18.169.1.118:3009',
      'http://18.169.1.118:80',
      '*'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Project Lifecycle Management API')
    .setDescription('API pour la gestion du cycle de vie des projets')
    .setVersion('1.0')
    .addTag('projects')
    .addTag('teams')
    .addTag('chatbot')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3009;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  console.log(`🤖 Chatbot endpoint: http://localhost:${port}/chatbot`);
}

bootstrap();