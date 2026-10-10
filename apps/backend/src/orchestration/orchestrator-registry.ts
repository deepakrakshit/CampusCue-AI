import { SessionOrchestrator } from './session-orchestrator.js';

class OrchestratorRegistry {
  private orchestrators: Map<string, SessionOrchestrator> = new Map();

  get(sessionId: string): SessionOrchestrator | undefined {
    return this.orchestrators.get(sessionId);
  }

  getOrCreate(sessionId: string): SessionOrchestrator {
    let orchestrator = this.orchestrators.get(sessionId);
    if (!orchestrator) {
      orchestrator = new SessionOrchestrator(sessionId);
      this.orchestrators.set(sessionId, orchestrator);
    }
    return orchestrator;
  }

  delete(sessionId: string): void {
    const orchestrator = this.orchestrators.get(sessionId);
    if (orchestrator) {
      orchestrator.destroy();
      this.orchestrators.delete(sessionId);
    }
  }
}

export const orchestratorRegistry = new OrchestratorRegistry();
