# Input System

Human keyboard input and CPU commands share `Input` in `js/input.js`. Each fighter's `controls` object maps semantic actions to physical keys. `Game.processFighterInput` consumes those semantic bindings through the same `justPressed` and `down` APIs for both input sources.

## Default keyboard bindings

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | A / D | Left / Right arrows |
| Jump / double jump | W | Up arrow |
| Fast fall / drop through | S | Down arrow |
| Attack | Left mouse click | K |
| Primary special | Right mouse click | L |
| Secondary special, when equipped | E | O |
| Ultimate (unchanged) | R | ; |
| Block | Shift | Shift |
| Dash / air dash | Shift + direction | Shift + direction |
| Pause / resume | Escape | Escape |

Player 1's left and right mouse clicks activate attack and primary special while the pointer is over the game canvas. The right-click context menu is suppressed on the canvas. Player 2 continues to use keyboard controls. Attack plus a direction selects a directional attack. Shift plus attack grabs, and Shift plus direction dashes. The on-screen setup guide shows the default bindings; each fighter's special HUD tooltip includes that fighter's primary and secondary ability keys. Secondary keys do nothing when a selected mech has no secondary ability.

The restart toolbar button remains available; R is reserved for Player 1's ultimate.

## Extension points

- Edit `PLAYER_CONTROLS` to change a player's control layout. Values are semantic action keys; mouse actions use `mouse-left` and `mouse-right`.
- Add semantic input handling in `Game.processFighterInput` when introducing a new gameplay action. Do not call fighter movement or combat methods from a keyboard listener.
- AI should emit semantic actions via `AIController.act`; `Input.setVirtualKeys` maps them onto the current fighter controls.
- Keep setup hints, README controls, and any dynamically displayed ability hints aligned with `PLAYER_CONTROLS`.

## Future AI Notes

### Architectural decisions

AI emits semantic actions and submits them as a named virtual input source. `Input` merges virtual and physical keys so the game has one input-processing path.

### Why

This keeps CPU behavior consistent with player controls and avoids duplicated movement, attack, and ability rules. Direct secondary bindings simplify ability selection while preserving attack and movement keys.

### Extension points

Add AI actions only when they correspond to a semantic action on `fighter.controls`; add physical bindings in `PLAYER_CONTROLS`. Keep ability availability checks in gameplay input processing so an absent secondary ability cannot fall back to the primary one.

### Known limitations

The keyboard layouts are fixed in code. There is no input remapping screen, gamepad support, or per-player pause key.

### Recommended next steps

If remapping is requested, make UI hints and ability labels derive from `PLAYER_CONTROLS`, then validate simultaneous local-player inputs and CPU virtual inputs through the same action path.
