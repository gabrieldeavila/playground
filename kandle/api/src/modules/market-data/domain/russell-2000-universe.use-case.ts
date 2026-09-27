import type {
  Russell2000Universe,
  Russell2000UniverseRepository,
} from './russell-2000-universe.repository';

export class Russell2000UniverseUseCase {
  constructor(private readonly repository: Russell2000UniverseRepository) {}

  execute(): Promise<Russell2000Universe> {
    return this.repository.getUniverse();
  }
}
