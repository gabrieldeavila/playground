import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { HealthModule } from "@src/core/health/health.module";

import { LoggerModule } from "@shared/logger/logger.module";

import { QuoatationModule } from "./core/quotation/quotation.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    LoggerModule,
    HealthModule,
    QuoatationModule,
  ],
})
export class AppModule {}
