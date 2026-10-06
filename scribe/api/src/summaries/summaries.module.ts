import { Module } from '@nestjs/common';
import { DocsModule } from '../docs/docs.module';
import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';

@Module({
  imports: [DocsModule],
  controllers: [SummariesController],
  providers: [SummariesService],
})
export class SummariesModule {}
