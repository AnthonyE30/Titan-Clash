import { ARENA_EVENT_TYPES } from './events/index.js';

export class ArenaEventManager {
  constructor(arena) {
    this.arena = arena;
    const definitions = [
      ...(arena.hazards ?? []).map((hazard, index) => ({
        ...hazard,
        id: hazard.id ?? `legacy-hazard-${index + 1}`,
        type: 'legacy-hazard',
        name: hazard.name ?? 'Arena Hazard',
        warningTime: hazard.warningTime ?? 0,
        duration: hazard.activeTime ?? 1,
        cooldown: Math.max(0, (hazard.period ?? 3) - (hazard.activeTime ?? 1)),
        initialDelay: 0
      })),
      ...(arena.events ?? [])
    ];

    this.events = definitions.map(definition => {
      const EventType = ARENA_EVENT_TYPES[definition.type];
      if (!EventType) throw new Error(`Unknown arena event type "${definition.type}".`);
      return new EventType(definition);
    });
  }

  update(dt, context) {
    for (const event of this.events) event.update(dt, context);
  }

  draw(ctx) {
    for (const event of this.events) event.draw(ctx);
  }

  getThreats() {
    return this.events.flatMap(event => event.getThreats());
  }

  get gravityScale() {
    return this.events.reduce((scale, event) => {
      if (!event.isActive || event.type !== 'gravity-shift') return scale;
      return scale * (event.definition.gravityScale ?? 1);
    }, 1);
  }

  get activeEvents() {
    return this.events.filter(event => event.isWarning || event.isActive);
  }
}
