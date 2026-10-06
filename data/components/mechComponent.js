export class MechComponent {
  constructor(kind, properties = {}) {
    this.kind = kind;
    this.properties = Object.freeze({ ...properties });
  }
}
