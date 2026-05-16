import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo global da API
  app.setGlobalPrefix('api/v1');

  // Validação automática dos DTOs com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // remove campos não declarados no DTO
      forbidNonWhitelisted: true,
      transform: true,       // converte tipos automaticamente
    }),
  );

  // Envelope de resposta padrão { success, data, message }
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Filtro de exceções padrão { success: false, message, error }
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
