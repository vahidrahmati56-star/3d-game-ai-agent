import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const gameShell = document.getElementById('game-shell');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const finalScoreEl = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const jumpBtn = document.getElementById('jump-btn');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
gameShell.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x081120, 14, 60);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4.5, 10);

const ambientLight = new THREE.HemisphereLight(0xcfe8ff, 0x0d1325, 1.3);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 12, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x1d243a,
  roughness: 0.82,
  metalness: 0.15,
});

const lanePositions = [-3, 0, 3];

const world = {
  speed: 18,
  gameRunning: false,
  score: 0,
  bestScore: Number(localStorage.getItem('voxel-rush-best')) || 0,
  elapsed: 0,
  obstacles: [],
  crystals: [],
  groundSegments: [],
  lastSpawn: 0,
  lastCrystalSpawn: 0,
};

bestScoreEl.textContent = String(world.bestScore);

const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.1, 1.2, 1.1),
  new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x163d63, metalness: 0.4, roughness: 0.3 })
);
body.castShadow = true;
player.add(body);

const head = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.8, 0.8),
  new THREE.MeshStandardMaterial({ color: 0xf5f7ff, emissive: 0x2f4f8a, metalness: 0.2, roughness: 0.25 })
);
head.position.y = 1.15;
head.castShadow = true;
player.add(head);

const trail = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.22, 1.4, 12),
  new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x124d3d, transparent: true, opacity: 0.85 })
);
trail.rotation.x = Math.PI / 2;
trail.position.set(0, -0.8, 0.5);
player.add(trail);

player.position.set(0, 1.6, 4.5);
scene.add(player);

const playerState = {
  laneIndex: 1,
  targetX: 0,
  x: 0,
  velocityY: 0,
  jumpStrength: 8.5,
  onGround: true,
  bob: 0,
};

function createGroundSegment(z) {
  const segment = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.8, 12),
    roadMaterial
  );
  segment.position.set(0, -0.6, z);
  segment.receiveShadow = true;
  scene.add(segment);
  world.groundSegments.push(segment);
}

for (let i = 0; i < 10; i++) {
  createGroundSegment(-i * 12);
}

function makeLaneMarkers() {
  const group = new THREE.Group();

  for (let i = 0; i < 20; i++) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.02, 2.4),
      new THREE.MeshStandardMaterial({ color: 0xf5d76e, emissive: 0x5d4e1c })
    );
    marker.position.set(0, 0.06, -i * 3);
    group.add(marker);
  }

  group.position.y = 0.02;
  scene.add(group);
  return group;
}

const markers = makeLaneMarkers();

function createObstacle(z, laneIndex) {
  const obstacle = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.8, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xfb7185, emissive: 0x5d0d1b, roughness: 0.4, metalness: 0.25 })
  );
  base.castShadow = true;
  base.receiveShadow = true;
  obstacle.add(base);

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.9, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xfca5a5, emissive: 0x463d37, roughness: 0.55 })
  );
  top.position.y = 1.2;
  top.castShadow = true;
  obstacle.add(top);

  obstacle.position.set(lanePositions[laneIndex], 1.2, z);
  scene.add(obstacle);
  world.obstacles.push(obstacle);
}

function createCrystal(z, laneIndex) {
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.7, 0),
    new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x3b2b65,
      metalness: 0.45,
      roughness: 0.2,
    })
  );

  crystal.position.set(lanePositions[laneIndex], 1.4, z);
  crystal.castShadow = true;
  scene.add(crystal);
  world.crystals.push(crystal);
}

function setLane(index) {
  playerState.laneIndex = THREE.MathUtils.clamp(index, 0, lanePositions.length - 1);
  playerState.targetX = lanePositions[playerState.laneIndex];
}

function jump() {
  if (!world.gameRunning || !playerState.onGround) return;
  playerState.onGround = false;
  playerState.velocityY = playerState.jumpStrength;
}

function resetPlayer() {
  playerState.x = 0;
  playerState.targetX = 0;
  playerState.laneIndex = 1;
  player.position.x = 0;
  player.position.y = 1.6;
  playerState.onGround = true;
  playerState.velocityY = 0;
}

function resetGame() {
  world.score = 0;
  world.elapsed = 0;
  world.lastSpawn = 0;
  world.lastCrystalSpawn = 0;
  scoreEl.textContent = '0';
  for (const obstacle of world.obstacles) scene.remove(obstacle);
  for (const crystal of world.crystals) scene.remove(crystal);
  world.obstacles = [];
  world.crystals = [];
  resetPlayer();
}

function startGame() {
  resetGame();
  world.gameRunning = true;
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
}

function endGame() {
  world.gameRunning = false;
  world.bestScore = Math.max(world.bestScore, world.score);
  localStorage.setItem('voxel-rush-best', String(world.bestScore));
  bestScoreEl.textContent = String(world.bestScore);
  finalScoreEl.textContent = String(world.score);
  gameOverScreen.classList.remove('hidden');
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * lanePositions.length);
  const z = -20 - Math.random() * 25;
  createObstacle(z, lane);
}

function spawnCrystal() {
  const lane = Math.floor(Math.random() * lanePositions.length);
  const z = -22 - Math.random() * 28;
  createCrystal(z, lane);
}

function updatePlayer(delta) {
  playerState.x = THREE.MathUtils.lerp(playerState.x, playerState.targetX, 0.12);
  player.position.x = playerState.x;

  if (!playerState.onGround) {
    playerState.velocityY -= 24 * delta;
    player.position.y += playerState.velocityY * delta;

    if (player.position.y <= 1.6) {
      player.position.y = 1.6;
      playerState.velocityY = 0;
      playerState.onGround = true;
    }
  }

  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, (playerState.targetX - player.position.x) * 0.18, 0.12);
  player.rotation.x = Math.sin((performance.now() * 0.012) + playerState.laneIndex) * 0.08;
}

function updateWorld(delta) {
  if (!world.gameRunning) return;

  world.elapsed += delta;
  world.speed = 18 + Math.min(world.score * 0.05, 12);
  world.score = Math.floor(world.elapsed * 12);
  scoreEl.textContent = String(world.score);

  for (const segment of world.groundSegments) {
    segment.position.z += world.speed * delta;
    if (segment.position.z > 12) {
      segment.position.z -= 12 * world.groundSegments.length;
    }
  }

  markers.position.z += world.speed * delta;
  if (markers.position.z > 3) {
    markers.position.z -= 60;
  }

  for (const obstacle of world.obstacles) {
    obstacle.position.z += world.speed * delta;

    if (obstacle.position.z > 8) {
      scene.remove(obstacle);
      world.obstacles = world.obstacles.filter((item) => item !== obstacle);
      continue;
    }

    const hitX = Math.abs(obstacle.position.x - player.position.x) < 1.2;
    const hitZ = Math.abs(obstacle.position.z - player.position.z) < 1.2;
    const hitY = player.position.y < 2.8;

    if (hitX && hitZ && hitY) {
      endGame();
      return;
    }
  }

  for (const crystal of world.crystals) {
    crystal.position.z += world.speed * delta;
    crystal.rotation.y += delta * 3;
    crystal.position.y = 1.4 + Math.sin((world.elapsed + crystal.position.z) * 5) * 0.2;

    if (crystal.position.z > 8) {
      scene.remove(crystal);
      world.crystals = world.crystals.filter((item) => item !== crystal);
      continue;
    }

    const collectX = Math.abs(crystal.position.x - player.position.x) < 1.2;
    const collectZ = Math.abs(crystal.position.z - player.position.z) < 1.2;
    const collectY = Math.abs(crystal.position.y - player.position.y) < 1.6;

    if (collectX && collectZ && collectY) {
      scene.remove(crystal);
      world.crystals = world.crystals.filter((item) => item !== crystal);
      world.score += 25;
      scoreEl.textContent = String(world.score);
    }
  }

  if (world.elapsed - world.lastSpawn > 1.3) {
    spawnObstacle();
    world.lastSpawn = world.elapsed;
  }

  if (world.elapsed - world.lastCrystalSpawn > 2) {
    spawnCrystal();
    world.lastCrystalSpawn = world.elapsed;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(0.033, clock.getDelta());

  updatePlayer(delta);
  updateWorld(delta);

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x * 0.7, 0.12);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.8 + player.position.y * 0.1, 0.12);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 10 + (player.position.z - 4.5) * 0.1, 0.12);
  camera.lookAt(player.position.x * 0.8, 0.8, player.position.z - 10);

  renderer.render(scene, camera);
}

const clock = new THREE.Clock();

function bindControls() {
  const moveLeft = () => setLane(playerState.laneIndex - 1);
  const moveRight = () => setLane(playerState.laneIndex + 1);

  leftBtn.addEventListener('pointerdown', moveLeft);
  rightBtn.addEventListener('pointerdown', moveRight);
  jumpBtn.addEventListener('pointerdown', jump);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') moveLeft();
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') moveRight();
    if (event.key === 'ArrowUp' || event.key === ' ' || event.key.toLowerCase() === 'w') jump();
  });

  window.addEventListener('touchstart', (event) => {
    if (event.target === leftBtn) moveLeft();
    if (event.target === rightBtn) moveRight();
    if (event.target === jumpBtn) jump();
  }, { passive: true });
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

bindControls();
resetGame();
animate();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
