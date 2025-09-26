const npc = document.getElementById('npc');
const chatBubble = document.getElementById('chat-bubble');
const npcContainer = document.getElementById('npc-container');

// Load metadata
let metadata = null;
try {
  metadata = window.buddyMetadata;
} catch (e) {
  metadata = null;
}

const quotes = [
  "You’ve got this!",
  "Keep going, champion!",
  "Every try makes you better!",
  "Focus and win!",
  "Mistakes are proof you’re learning!",
  "Small steps, big progress!",
  "Believe in yourself!"
];

// Position
let x = 100;
let y = 100;
const baseSpeed = 2;

// Directions
const directions = metadata ? Object.keys(metadata.frames.rotations) : ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

// Current state
let currentDir = 'south';
let frame = 0;
const totalFrames = metadata ? metadata.frames.animations['walking-8-frames'][directions[0]].length : 8;

// Movement vector
let dx = 0;
let dy = 1;

// Time until next direction change
let changeTime = randomInt(50, 150); // frames

// Helper functions
function getDirection(dx, dy) {
  if (dx === 0 && dy < 0) return 'north';
  if (dx > 0 && dy < 0) return 'north-east';
  if (dx > 0 && dy === 0) return 'east';
  if (dx > 0 && dy > 0) return 'south-east';
  if (dx === 0 && dy > 0) return 'south';
  if (dx < 0 && dy > 0) return 'south-west';
  if (dx < 0 && dy === 0) return 'west';
  if (dx < 0 && dy < 0) return 'north-west';
  return 'south';
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick a random direction
function randomDirection() {
  // Pick a random direction from the directions array
  const dirIdx = randomInt(0, directions.length - 1);
  currentDir = directions[dirIdx];
  // Set dx, dy based on direction
  switch (currentDir) {
    case 'north': dx = 0; dy = -1; break;
    case 'north-east': dx = 1; dy = -1; break;
    case 'east': dx = 1; dy = 0; break;
    case 'south-east': dx = 1; dy = 1; break;
    case 'south': dx = 0; dy = 1; break;
    case 'south-west': dx = -1; dy = 1; break;
    case 'west': dx = -1; dy = 0; break;
    case 'north-west': dx = -1; dy = -1; break;
    default: dx = 0; dy = 1;
  }
}

// Autonomous idle/walk state
let walking = true;
let idleTime = 0;
let stopCount = 0;

// Main animation loop
function moveNPC() {
  if (walking) {
    // Change direction occasionally
    changeTime--;
    if (changeTime <= 0) {
      randomDirection();
      changeTime = randomInt(50, 150); // next change
    }

    // Normalize diagonal speed
    let speed = baseSpeed;
    if (dx !== 0 && dy !== 0) speed /= Math.sqrt(2);

    // Use character size from metadata
    const charWidth = metadata ? metadata.character.size.width : 128;
    const charHeight = metadata ? metadata.character.size.height : 128;
    let nextX = x + dx * speed;
    let nextY = y + dy * speed;
    let hitBorder = false;
    // Check borders
    if (nextX < 0 || nextX > window.innerWidth - charWidth || nextY < 0 || nextY > window.innerHeight - charHeight - 48) {
      hitBorder = true;
    }

    if (hitBorder) {
      walking = false;
      idleTime = randomInt(60, 180); // 1s to 3s
      npc.src = metadata ? metadata.frames.rotations[currentDir] : `rotations/${currentDir}.png`;
      stopCount++;
      if (stopCount % 3 === 0) {
        chatBubble.textContent = quotes[randomInt(0, quotes.length - 1)];
        chatBubble.style.opacity = 1;
      } else {
        chatBubble.style.opacity = 0;
      }
    } else {
      x = nextX;
      y = nextY;
      // Always face/move in the direction of movement
      currentDir = getDirection(dx, dy);
      // Update frame
      frame = (frame + 1) % totalFrames;
  npc.src = metadata ? metadata.frames.animations['walking-8-frames'][currentDir][frame] : `animations/walking-8-frames/${currentDir}/frame_00${frame}.png`;
      chatBubble.style.opacity = 0;
      // Randomly stop walking
      if (Math.random() < 0.005) { // ~0.5% chance per frame
        walking = false;
        idleTime = randomInt(120, 300); // 2s to 5s
        npc.src = metadata ? metadata.frames.rotations[currentDir] : `rotations/${currentDir}.png`;
        stopCount++;
        if (stopCount % 3 === 0) {
          chatBubble.textContent = quotes[randomInt(0, quotes.length - 1)];
          chatBubble.style.opacity = 1;
        } else {
          chatBubble.style.opacity = 0;
        }
      }
    }
  } else {
    idleTime--;
    if (idleTime <= 0) {
      walking = true;
      frame = 0;
  // Pick a new direction after idle
  randomDirection();
    }
    // Show standing still frame
    npc.src = `rotations/${currentDir}.png`;
    chatBubble.style.opacity = 1;
  }

  // Update position of container (moves both character and bubble)
  // Clamp position so bubble stays on screen
  const bubbleWidth = 220; // max-width of bubble
  const charWidth = metadata ? metadata.character.size.width : 128;
  const charHeight = metadata ? metadata.character.size.height : 128;
  let clampedX = Math.max(0, Math.min(x, window.innerWidth - charWidth));
  let clampedY = Math.max(0, Math.min(y, window.innerHeight - charHeight - 48)); // 48px for bubble above
  // If near left/right edge, shift container so bubble stays visible
  if (clampedX < bubbleWidth / 2) clampedX = bubbleWidth / 2;
  if (clampedX > window.innerWidth - charWidth - bubbleWidth / 2) clampedX = window.innerWidth - charWidth - bubbleWidth / 2;
  npcContainer.style.left = clampedX + 'px';
  npcContainer.style.top = clampedY + 'px';
}

// Run at 60 FPS
setInterval(moveNPC, 1000 / 60);
