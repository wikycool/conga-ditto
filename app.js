/**
 * Customizable Conga Ditto Clone - Core Engine
 * Powered by HTML5 Canvas & Web Audio API
 */

// Track audio sources
const TRACKS = {
  conga: "https://matias.me/nsfw/konga.92cb31af.mp3",
  caramelldansen: "https://ia800905.us.archive.org/21/items/caramelldansen-swedish-original-official/Caramelldansen%20(Swedish%20Original%20Official).mp3",
  rickroll: "https://ia801602.us.archive.org/11/items/Rick_Astley_Never_Gonna_Give_You_Up/Rick_Astley_Never_Gonna_Give_You_Up.mp3"
};

// Default Ditto Spritesheet (4 frames, 33x29 each)
const DEFAULT_SPRITESHEET = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAAAdAgMAAAAWQyy/AAAADFBMVEX///+4YOA4ODj4+PhASPNeAAAAAXRSTlMAQObYZgAAAStJREFUeF6l08FqhEAMBuBhbk6fYyj6Pgmul3pZEN9hWV8i9FgvC3X6PELpe2zP9Y/pyCLLFprLoP83STzo/lv+/ZEoGGwMw10RacmePmML4PfOjyqev6WGKDs/Kth40QiEXInxLPzxle+WHUS8kgoi6vU8zzaobIQB31R4QrU4T9RVKl5ngpheaBP1KlmWLlU4z0iCJioORKxCmzm5nDSJAOx0jxthdEBwzOLIkJyFIEGgQpvVqxSMhVRxQKCiEYhozQtbPV/Fmx6iJE5ErYkWgi8mlOYkEiVZxQRpglUojSZB9wJUTDoxkTeMN4J3ot0JT79CTMifRUmUEtV5803EJcD3+5ScS+MmML+feHBhCcKSWOVvw9s07H+LTdwvL/1Fp9yvaggJUx/WD0e0wREEScedAAAAAElFTkSuQmCC";

// Application State
const state = {
  isPlaying: false,
  speed: 1.0,
  bgTheme: "original",
  spawnRate: 0.6, // delay factor
  mainSizePercent: 80,
  bgOpacityPercent: 40,
  sprite: {
    image: null,
    framesCount: 4,
    frameWidth: 33,
    frameHeight: 29
  },
  customAudioUrl: null,
  customSpriteUrl: null,
  backgroundColor: "#00ff00",
  containerColor: "#ff00ff",
  timeSinceLastSpawn: 0,
  timeSinceLastColorChange: 0,
  hue: 0 // for rainbow theme
};

// DOM Elements
const splashScreen = document.getElementById("splashScreen");
const loadingIndicator = document.getElementById("loadingIndicator");
const trustBtn = document.getElementById("trustBtn");
const canvas = document.getElementById("congaCanvas");
const ctx = canvas.getContext("2d");
const audio = document.getElementById("bgAudio");



// Canvas Entity Arrays
let entities = [];
let protagonist = null;
let lastTime = 0;

// Helper to generate a random hex color
function randomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

// Draw a rounded rectangle on a 2D Canvas context
function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  return ctx;
}

// Load default sprite
function loadDefaultSprite(callback) {
  const img = new Image();
  img.onload = () => {
    state.sprite.image = img;
    state.sprite.framesCount = 4;
    state.sprite.frameWidth = 33;
    state.sprite.frameHeight = 29;
    if (callback) callback();
  };
  img.src = DEFAULT_SPRITESHEET;
}

// Rebuild or resize center protagonist dancer
function rebuildProtagonist() {
  const w = canvas.width;
  const h = canvas.height;
  const maxDim = Math.min(w * 0.8, 600) * (state.mainSizePercent / 100);
  
  const spriteW = state.sprite.frameWidth;
  const spriteH = state.sprite.frameHeight;
  const scale = Math.min(maxDim / spriteW, maxDim / spriteH);
  
  const displayW = spriteW * scale;
  const displayH = spriteH * scale;

  const currentFrame = protagonist ? protagonist.animationFrame : 0;
  const currentTime = protagonist ? protagonist.time : 0;

  protagonist = {
    animationFrame: currentFrame,
    time: currentTime,
    origin: {
      x: Math.round((w - displayW) / 2),
      y: Math.round((h - displayH) / 2)
    },
    size: {
      width: displayW,
      height: displayH
    },
    speed: { x: 0, y: 0 },
    opacity: 1
  };
}

// Create a new scrolling background dancer
function createBackgroundDancer() {
  const isFromLeft = Math.random() > 0.5;
  // Size factor between 4x and 15x scale
  const sizeFactor = Math.floor(Math.random() * 12) + 4;
  const opacity = (Math.random() * 0.8 + 0.2) * (state.bgOpacityPercent / 100);
  
  // Speed varies between 300px/s and 1000px/s, scaled with the overall party tempo speed
  const speedX = (Math.floor(Math.random() * 600) + 400) * (isFromLeft ? 1 : -1) * state.speed;
  
  const spriteW = state.sprite.frameWidth;
  const spriteH = state.sprite.frameHeight;
  const displayW = spriteW * sizeFactor;
  const displayH = spriteH * sizeFactor;

  return {
    animationFrame: Math.floor(Math.random() * state.sprite.framesCount),
    time: 0,
    origin: {
      x: isFromLeft ? -displayW : canvas.width,
      y: Math.floor(Math.random() * (canvas.height - displayH))
    },
    size: {
      width: displayW,
      height: displayH
    },
    speed: { x: speedX, y: 0 },
    opacity: opacity
  };
}

// Load audio track and start play
function startPlayback() {
  loadingIndicator.classList.add("visible");
  
  let source = TRACKS.conga;

  audio.src = source;
  audio.load();
  
  audio.play()
    .then(() => {
      loadingIndicator.classList.remove("visible");
      splashScreen.style.opacity = "0";
      splashScreen.style.visibility = "hidden";
      canvas.classList.add("active");
      
      state.isPlaying = true;
      updateAudioSpeed();
      
      // Start main canvas animation loop
      lastTime = Date.now();
      requestAnimationFrame(updateLoop);
    })
    .catch(err => {
      console.error("Audio playback error: ", err);
      alert("Could not load or play the selected soundtrack.");
      loadingIndicator.classList.remove("visible");
    });
}

// Update the audio playback speed & pitch sync
function updateAudioSpeed() {
  if (audio) {
    audio.playbackRate = state.speed;
  }
}

// Main Frame Update & Canvas Rendering Loop
function updateLoop() {
  if (!state.isPlaying) return;

  const now = Date.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  update(dt);
  render();

  requestAnimationFrame(updateLoop);
}

// Update State
function update(dt) {
  // 1. Spawning background dancers
  state.timeSinceLastSpawn += dt;
  // Delay calculation: standard spawn delay is 0.4 seconds divided by density factor
  // Higher spawnRate slider = more density = lower spawn delay threshold
  const spawnThreshold = (0.5 / state.spawnRate) / state.speed;
  if (state.timeSinceLastSpawn >= spawnThreshold) {
    state.timeSinceLastSpawn = 0;
    // Spawn 1 to 2 background dancers
    const num = Math.random() > 0.7 ? 2 : 1;
    for (let i = 0; i < num; i++) {
      entities.push(createBackgroundDancer());
    }
  }

  // 2. Original flashing color shifting
  state.timeSinceLastColorChange += dt;
  if (state.bgTheme === "original") {
    // Original speed of flashing color shifts is 0.4 seconds, scaled with the party tempo speed
    const flashThreshold = 0.4 / state.speed;
    if (state.timeSinceLastColorChange >= flashThreshold) {
      state.timeSinceLastColorChange = 0;
      state.backgroundColor = randomColor();
      state.containerColor = randomColor();
    }
  } else if (state.bgTheme === "gradient") {
    // Rainbow cycling hue
    state.hue = (state.hue + dt * 100 * state.speed) % 360;
  }

  // 3. Update protagonist animation frame
  if (protagonist) {
    protagonist.time += dt;
    // Standard frame duration is 0.085s, scaled down for faster dance speeds
    const frameDuration = 0.085 / state.speed;
    if (protagonist.time >= frameDuration) {
      protagonist.time = 0;
      protagonist.animationFrame = (protagonist.animationFrame + 1) % state.sprite.framesCount;
    }
    // Update size in case canvas was resized
    rebuildProtagonist();
  }

  // 4. Update background entities
  const activeEntities = [];
  const frameDuration = 0.085 / state.speed;

  for (let i = 0; i < entities.length; i++) {
    const ent = entities[i];
    
    // Animation frame timing
    ent.time += dt;
    if (ent.time >= frameDuration) {
      ent.time = 0;
      ent.animationFrame = (ent.animationFrame + 1) % state.sprite.framesCount;
    }

    // Scroll movement
    ent.origin.x += ent.speed.x * dt;

    // Check bounds: Keep if still within screen boundary (with padding)
    const padding = ent.size.width;
    if (ent.speed.x > 0 && ent.origin.x < canvas.width + padding) {
      activeEntities.push(ent);
    } else if (ent.speed.x < 0 && ent.origin.x > -padding) {
      activeEntities.push(ent);
    }
  }
  entities = activeEntities;
}

// Render to Canvas
function render() {
  const w = canvas.width;
  const h = canvas.height;
  
  // Disable image smoothing for beautiful retro pixel-art crispness
  ctx.imageSmoothingEnabled = false;

  // 1. Draw Background
  if (state.bgTheme === "original") {
    ctx.fillStyle = state.backgroundColor;
    ctx.fillRect(0, 0, w, h);
    
    if (w > 24 && h > 24) {
      drawRoundedRect(ctx, 32, 32, w - 64, h - 64, 12);
      ctx.fillStyle = state.containerColor;
      ctx.fill();
    }
  } else if (state.bgTheme === "gradient") {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, `hsl(${state.hue}, 80%, 50%)`);
    grad.addColorStop(1, `hsl(${(state.hue + 120) % 360}, 80%, 50%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    if (w > 24 && h > 24) {
      drawRoundedRect(ctx, 32, 32, w - 64, h - 64, 12);
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fill();
    }
  } else {
    // Preset themes
    let bgGrad = ctx.createLinearGradient(0, 0, w, h);
    let borderGrad = "rgba(0,0,0,0.4)";
    
    switch (state.bgTheme) {
      case "sunset":
        bgGrad.addColorStop(0, "#ff5e62");
        bgGrad.addColorStop(1, "#ff9966");
        borderGrad = "rgba(0, 0, 0, 0.25)";
        break;
      case "neon":
        bgGrad.addColorStop(0, "#f72585");
        bgGrad.addColorStop(1, "#7209b7");
        borderGrad = "rgba(255, 255, 255, 0.05)";
        break;
      case "ocean":
        bgGrad.addColorStop(0, "#03001e");
        bgGrad.addColorStop(0.5, "#7303c0");
        bgGrad.addColorStop(1, "#ec38bc");
        borderGrad = "rgba(0, 0, 0, 0.5)";
        break;
      case "solid":
        bgGrad = state.backgroundColor;
        borderGrad = "rgba(0, 0, 0, 0.15)";
        break;
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    
    if (w > 24 && h > 24) {
      drawRoundedRect(ctx, 32, 32, w - 64, h - 64, 12);
      ctx.fillStyle = borderGrad;
      ctx.fill();
    }
  }

  // 2. Draw Background Dancers
  for (let i = 0; i < entities.length; i++) {
    const ent = entities[i];
    ctx.globalAlpha = ent.opacity;
    
    const sx = ent.animationFrame * state.sprite.frameWidth;
    ctx.drawImage(
      state.sprite.image,
      sx, 0, state.sprite.frameWidth, state.sprite.frameHeight,
      ent.origin.x, ent.origin.y, ent.size.width, ent.size.height
    );
  }

  // 3. Draw Main Protagonist Dancer
  if (protagonist) {
    ctx.globalAlpha = 1;
    const sx = protagonist.animationFrame * state.sprite.frameWidth;
    ctx.drawImage(
      state.sprite.image,
      sx, 0, state.sprite.frameWidth, state.sprite.frameHeight,
      protagonist.origin.x, protagonist.origin.y, protagonist.size.width, protagonist.size.height
    );
  }
  
  ctx.globalAlpha = 1; // Reset opacity
}

// Window sizing
function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (state.isPlaying) {
    rebuildProtagonist();
  }
}

// Complete initialization on DOM load
document.addEventListener("DOMContentLoaded", () => {
  // Set dimensions
  handleResize();
  window.addEventListener("resize", handleResize);

  // Load Ditto sprite assets
  loadDefaultSprite(() => {
    rebuildProtagonist();
  });

  // "Trust me" Action
  trustBtn.addEventListener("click", () => {
    startPlayback();
  });
});
