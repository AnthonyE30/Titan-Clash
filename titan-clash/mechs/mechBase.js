export class MechBase {
  constructor(definition) {
    this.definition = definition;
    this.id = definition.id;
    this.name = definition.name;
    this.role = definition.role;
    this.components = Object.freeze({ ...definition.components });
    this.stats = Object.freeze({ ...definition.stats });
    this.movement = Object.freeze({ ...definition.movement });
    this.attacks = Object.freeze({ ...definition.attacks });
    this.abilities = Object.freeze({ ...definition.abilities });
    this.visual = Object.freeze({ ...definition.visual });
    this.passive = typeof definition.passive === 'string' ? null : definition.passive;
    this.passiveDescription = typeof definition.passive === 'string'
      ? definition.passive
      : Array.isArray(definition.passive)
        ? definition.passive.map(passive => passive?.description).filter(Boolean).join(' ')
        : definition.passive?.description ?? '';
  }

  getAttack(name) {
    const attack = this.attacks[name];
    if (!attack) throw new Error(`Mech "${this.id}" has no attack "${name}".`);
    return attack;
  }
}
