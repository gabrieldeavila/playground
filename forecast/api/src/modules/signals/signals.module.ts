import { Module } from '@nestjs/common';
import { JsonSignalSnapshotRepository } from './data/json-signal-snapshot.repository.js';
import { PythonSignalRefreshRunner } from './data/python-signal-refresh.runner.js';
import {
  SIGNAL_REFRESH_RUNNER,
  SignalsController,
} from './delivery/signals.controller.js';
import { ListSignals } from './domain/list-signals.js';

@Module({
  controllers: [SignalsController],
  providers: [
    JsonSignalSnapshotRepository,
    { provide: SIGNAL_REFRESH_RUNNER, useClass: PythonSignalRefreshRunner },
    {
      provide: ListSignals,
      useFactory: (repository: JsonSignalSnapshotRepository) =>
        new ListSignals(repository),
      inject: [JsonSignalSnapshotRepository],
    },
  ],
})
export class SignalsModule {}
