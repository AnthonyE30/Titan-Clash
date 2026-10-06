export class PassiveBase {
  constructor({ id, name, description, parameters = {} }) {
    if (!id || !name) throw new Error('A passive requires an id and name.');
    this.id = id;
    this.name = name;
    this.description = description;
    this.parameters = Object.freeze({ ...parameters });
  }

  onSpawn() {}
  onDamageTaken() {}
  onDamageDealt() {}
  onAttackStart() {}
  onAttackHit() {}
  onStockLost() {}
  onUltimateUsed() {}
  onFrame() {}
  onDash() {}
  onJump() {}
}
