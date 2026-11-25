// Keyboard and mouse, boiled down to one small state object the world reads
// each step: four directions, whether the action key is down, and the last
// click (in canvas coordinates) for click-to-walk and click-to-use.

export function createInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    action: false,
    actionPressed: false,
    click: null,
    clickHandled: true,
  };
}

const KEY_DIRECTIONS = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

export function attachInput(input, canvas, handlers) {
  window.addEventListener('keydown', (event) => {
    const direction = KEY_DIRECTIONS[event.code];
    if (direction) {
      input[direction] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      if (!event.repeat) input.actionPressed = true;
      input.action = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'Enter' && handlers.onEnter) handlers.onEnter();
    if (event.code === 'KeyR' && handlers.onRestart) handlers.onRestart();
    if (event.code === 'KeyM' && handlers.onMute) handlers.onMute();
  });
  window.addEventListener('keyup', (event) => {
    const direction = KEY_DIRECTIONS[event.code];
    if (direction) input[direction] = false;
    if (event.code === 'KeyE' || event.code === 'Space') input.action = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    input.clickHandled = false;
  });
  window.addEventListener('blur', () => {
    input.up = false;
    input.down = false;
    input.left = false;
    input.right = false;
    input.action = false;
  });
}

// The world consumes the one-shot press; the held state stays for chopping.
export function consumeActionPress(input) {
  const pressed = input.actionPressed;
  input.actionPressed = false;
  return pressed;
}

export function consumeClick(input) {
  if (!input.click || input.clickHandled) return null;
  input.clickHandled = true;
  return input.click;
}
