import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhisperModule } from './example/whisper.module';
import { ConfigModule } from '@nestjs/config';
import { StockDataModule } from './modules/stock-data/stock-data.module.js';
import { SignalsModule } from './modules/signals/signals.module.js';

@Module({
  imports: [
    WhisperModule,
    StockDataModule,
    SignalsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
