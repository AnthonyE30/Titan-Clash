export const SUCCESS = 'success';
export const FAILURE = 'failure';

export class Selector {
  constructor(children) {
    this.children = children;
  }

  tick(context) {
    for (const child of this.children) {
      if (child.tick(context) === SUCCESS) return SUCCESS;
    }
    return FAILURE;
  }
}

export class Sequence {
  constructor(children) {
    this.children = children;
  }

  tick(context) {
    for (const child of this.children) {
      if (child.tick(context) === FAILURE) return FAILURE;
    }
    return SUCCESS;
  }
}

export class Condition {
  constructor(predicate) {
    this.predicate = predicate;
  }

  tick(context) {
    return this.predicate(context) ? SUCCESS : FAILURE;
  }
}

export class Action {
  constructor(action) {
    this.action = action;
  }

  tick(context) {
    return this.action(context) ? SUCCESS : FAILURE;
  }
}
