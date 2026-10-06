export const PLAYER_CONTROLS = [
  { left: 'a', right: 'd', up: 'w', down: 's', attack: 'mouse-left', special: 'mouse-right', secondary: 'e', ultimate: 'r', block: 'shift' },
  { left: 'arrowleft', right: 'arrowright', up: 'arrowup', down: 'arrowdown', attack: 'k', special: 'l', secondary: 'o', ultimate: ';', block: 'shift2' }
];

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.virtualKeys = new Map();
    window.addEventListener('keydown', event => {
      const key = event.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) event.preventDefault();
      for (const inputKey of this.physicalKeys(key)) {
        if (!this.down(inputKey)) this.pressed.add(inputKey);
        this.keys.add(inputKey);
      }
    });
    window.addEventListener('keyup', event => {
      const key = event.key.toLowerCase();
      for (const inputKey of this.physicalKeys(key)) {
        this.keys.delete(inputKey);
        if (!this.down(inputKey)) this.released.add(inputKey);
      }
    });
    canvas.addEventListener('mousedown', event => {
      const key = this.mouseKey(event.button);
      if (!key) return;
      event.preventDefault();
      if (!this.down(key)) this.pressed.add(key);
      this.keys.add(key);
    });
    window.addEventListener('mouseup', event => {
      const key = this.mouseKey(event.button);
      if (!key) return;
      this.keys.delete(key);
      if (!this.down(key)) this.released.add(key);
    });
    canvas.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener('blur', () => this.keys.clear());
  }

  down(key) {
    if (this.keys.has(key)) return true;
    for (const keys of this.virtualKeys.values()) if (keys.has(key)) return true;
    return false;
  }
  justPressed(key) { return this.pressed.has(key); }
  justReleased(key) { return this.released.has(key); }

  physicalKeys(key) {
    return key === 'shift' ? ['shift', 'shift2'] : [key];
  }

  mouseKey(button) {
    if (button === 0) return 'mouse-left';
    if (button === 2) return 'mouse-right';
    return null;
  }

  setVirtualKeys(source, keys) {
    const nextKeys = new Set(keys);
    const previousKeys = this.virtualKeys.get(source) ?? new Set();
    const affectedKeys = new Set([...previousKeys, ...nextKeys]);
    const wasDown = new Map([...affectedKeys].map(key => [key, this.down(key)]));
    if (nextKeys.size) this.virtualKeys.set(source, nextKeys);
    else this.virtualKeys.delete(source);
    for (const key of affectedKeys) {
      const isDown = this.down(key);
      if (!wasDown.get(key) && isDown) this.pressed.add(key);
      else if (wasDown.get(key) && !isDown) this.released.add(key);
    }
  }

  endFrame() { this.pressed.clear(); this.released.clear(); }
}
