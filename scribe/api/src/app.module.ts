import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DocsModule } from './docs/docs.module';
import { GoogleModule } from './google/google.module';
import { SummariesModule } from './summaries/summaries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    GoogleModule,
    DocsModule,
    SummariesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
