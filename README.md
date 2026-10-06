<!DOCTYPE html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
    <title>Car Rush 3D</title>
    <style>
      :root {
        --bg1: #071320;
        --bg2: #0d1d2d;
        --panel: rgba(12, 22, 35, 0.72);
        --accent: #7dd3fc;
        --accent2: #8b5cf6;
        --text: #f3f9ff;
        --danger: #ff6b6b;
        --gold: #ffd166;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html, body {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: linear-gradient(180deg, var(--bg2), var(--bg1));
        font-family: Tahoma, sans-serif;
        color: var(--text);
        touch-action: none;
      }

      body {
        user-select: none;
      }

      #game-shell {
        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
      }

      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }

      #hud {
        position: absolute;
        top: max(12px, env(safe-area-inset-top));
        left: 0;
        right: 0;
        padding: 0 16px;
        display: flex;
        justify-content: space-between;
        z-index: 30;
        pointer-events: none;
      }

      .panel {
        min-width: 110px;
        border: 1px solid rgba(125, 211, 252, 0.35);
        background: var(--panel);
        border-radius: 18px;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
        backdrop-filter: blur(8px);
        padding: 10px 14px;
        text-align: center;
      }

      .panel-label {
        font-size: 10px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--accent);
      }

      .panel-value {
        font-size: clamp(1.2rem, 4vw, 2rem);
        font-weight: 900;
      }

      .overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 40;
        background: rgba(5, 14, 25, 0.8);
        backdrop-filter: blur(10px);
      }

      .overlay.hidden {
        display: none;
      }

      .card {
        width: min(88vw, 440px);
        background: rgba(8, 17, 29, 0.92);
        border: 1px solid rgba(125, 211, 252, 0.4);
        border-radius: 26px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
        padding: 26px 20px;
        text-align: center;
      }

      .eyebrow {
        font-size: 11px;
        letter-spacing: 0.2em;
        color: var(--accent);
        text-transform: uppercase;
        margin-bottom: 10px;
      }

      .card h1,
      .card h2 {
        margin-bottom: 12px;
        background: linear-gradient(135deg, var(--accent), var(--accent2));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: clamp(2.1rem, 8vw, 3.1rem);
      }

      .card p {
        line-height: 1.8;
        color: #dfeeff;
      }

      .start-btn,
      .restart-btn {
        appearance: none;
        border: none;
        border-radius: 14px;
        padding: 15px 28px;
        margin-top: 18px;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: 800;
        color: white;
        background: linear-gradient(135deg, var(--accent2), var(--accent));
        box-shadow: 0 14px 30px rgba(139, 92, 246, 0.35);
      }

      #controls {
        position: absolute;
        left: 50%;
        bottom: max(14px, env(safe-area-inset-bottom));
        transform: translateX(-50%);
        display: flex;
        gap: 22px;
        z-index: 35;
        pointer-events: none;
      }

      .touch-btn {
        width: 74px;
        height: 74px;
        border: 2px solid rgba(125, 211, 252, 0.35);
        border-radius: 50%;
        background: rgba(20, 36, 52, 0.82);
        color: white;
        font-size: 2rem;
        cursor: pointer;
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
        pointer-events: auto;
      }

      .touch-btn:active {
        transform: scale(0.96);
      }
    </style>
  </head>
  <body>
    <div id="game-shell">
      <div id="hud">
        <div class="panel">
          <div class="panel-label">امتیاز</div>
          <div class="panel-value" id="score">0</div>
        </div>
        <div class="panel">
          <div class="panel-label">رکورد</div>
          <div class="panel-value" id="best-score">0</div>
        </div>
      </div>

      <div id="start-screen" class="overlay">
        <div class="card">
          <div class="eyebrow">Car Rush 3D</div>
          <h1>ماشین‌برانی</h1>
          <p>ماشین خود را روی جاده هدایت کن، مانع‌ها را دور بزن و سکه‌ها را جمع کن تا رکورد جدید ثبت شود.</p>
          <button class="start-btn" id="start-btn">شروع بازی</button>
        </div>
      </div>

      <div id="game-over-screen" class="overlay hidden">
        <div class="card">
          <div class="eyebrow">بازی تمام شد</div>
          <h2>امتیاز: <span id="final-score">0</span></h2>
          <p id="result-text">دوباره تلاش کن!</p>
          <button class="restart-btn" id="restart-btn">دوباره</button>
        </div>
      </div>

      <div id="controls">
        <button class="touch-btn" id="left-btn" aria-label="چپ">◀</button>
        <button class="touch-btn" id="right-btn" aria-label="راست">▶</button>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js"></script>
    <script>
      const scoreEl = document.getElementById('score');
      const bestScoreEl = document.getElementById('best-score');
      const finalScoreEl = document.getElementById('final-score');
      const resultTextEl = document.getElementById('result-text');
      const startScreen = document.getElementById('start-screen');
      const gameOverScreen = document.getElementById('game-over-screen');
      const startBtn = document.getElementById('start-btn');
      const restartBtn = document.getElementById('restart-btn');
      const leftBtn = document.getElementById('left-btn');
      const rightBtn = document.getElementById('right-btn');

      const lanePositions = [-5.4, 0, 5.4];
      const storageKey = 'car-rush-best-score';
      let bestScore = Number(localStorage.getItem(storageKey) || 0);
      bestScoreEl.textContent = String(bestScore);

      let scene, camera, renderer;
      let world = {
        running: false,
        score: 0,
        elapsed: 0,
        speed: 24,
        roadSegments: [],
        obstacles: [],
        coins: [],
        leftBuildings: [],
        rightBuildings: [],
        lastObstacleSpawn: 0,
        lastCoinSpawn: 0,
      };

      let player = null;
      let targetLane = 1;
      let playerX = 0;
      let playerZ = 16;

      function initScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x071320);
        scene.fog = new THREE.Fog(0x071320, 32, 110);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 220);
        camera.position.set(0, 6.5, 22);

        const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x091420, 1.4);
        scene.add(hemi);

        const dir = new THREE.DirectionalLight(0xffffff, 1.2);
        dir.position.set(8, 16, 14);
        dir.castShadow = true;
        dir.shadow.mapSize.set(1024, 1024);
        scene.add(dir);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-shell').appendChild(renderer.domElement);

        createRoad();
        createCity();
        createCar();
        animate();
      }

      function createRoad() {
        const roadMat = new THREE.MeshStandardMaterial({
          color: 0x1a2e48,
          roughness: 0.92,
          metalness: 0.18,
        });

        for (let i = 0; i < 16; i++) {
          const segment = new THREE.Mesh(new THREE.BoxGeometry(22, 0.8, 24), roadMat);
          segment.position.set(0, -0.6, -i * 24);
          segment.receiveShadow = true;
          scene.add(segment);
          world.roadSegments.push(segment);
        }

        for (let i = 0; i < 10; i++) {
          const line = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.08, 5.5),
            new THREE.MeshStandardMaterial({ color: 0xfbe29d, emissive: 0x3d3100 })
          );
          line.position.set(0, 0.1, -i * 15);
          scene.add(line);
        }
      }

      function createCity() {
        const mat = new THREE.MeshStandardMaterial({
          color: 0x203a53,
          emissive: 0x0b1724,
          roughness: 0.8,
          metalness: 0.12,
        });

        for (let i = 0; i < 24; i++) {
          const left = new THREE.Mesh(new THREE.BoxGeometry(2.2 + Math.random() * 2.2, 5 + Math.random() * 18, 2.25 + Math.random() * 2.25), mat);
          const right = new THREE.Mesh(new THREE.BoxGeometry(2.2 + Math.random() * 2.2, 5 + Math.random() * 18, 2.25 + Math.random() * 2.25), mat);

          left.position.set(-18 - Math.random() * 2.5, left.geometry.parameters.height / 2, -i * 12 - 10);
          right.position.set(18 + Math.random() * 2.5, right.geometry.parameters.height / 2, -i * 12 - 10);

          left.castShadow = true;
          left.receiveShadow = true;
          right.castShadow = true;
          right.receiveShadow = true;

          scene.add(left, right);
          world.leftBuildings.push(left);
          world.rightBuildings.push(right);
        }
      }

      function createCar() {
        const car = new THREE.Group();

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(3.2, 1.1, 5.7),
          new THREE.MeshStandardMaterial({
            color: 0x2dd4bf,
            metalness: 0.72,
            roughness: 0.35,
            emissive: 0x073d3f,
          })
        );
        body.position.y = 1.05;
        body.castShadow = true;
        body.receiveShadow = true;
        car.add(body);

        const cabin = new THREE.Mesh(
          new THREE.BoxGeometry(2.3, 1.15, 2.7),
          new THREE.MeshStandardMaterial({
            color: 0xdfeeff,
            transparent: true,
            opacity: 0.88,
            metalness: 0.35,
            roughness: 0.25,
          })
        );
        cabin.position.set(0, 1.8, -0.2);
        cabin.castShadow = true;
        car.add(cabin);

        const wheelGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.6, 20);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85, metalness: 0.2 });
        const wheelPositions = [
          [-1.5, 0.55, 1.7], [1.5, 0.55, 1.7],
          [-1.5, 0.55, -1.7], [1.5, 0.55, -1.7],
        ];

        wheelPositions.forEach(([x, y, z]) => {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(x, y, z);
          wheel.castShadow = true;
          wheel.receiveShadow = true;
          car.add(wheel);
        });

        car.position.set(0, 0.45, playerZ);
        scene.add(car);
        player = car;
      }

      function createObstacle() {
        const lane = Math.floor(Math.random() * lanePositions.length);
        const group = new THREE.Group();

        const base = new THREE.Mesh(
          new THREE.BoxGeometry(2.3, 1.8, 2.3),
          new THREE.MeshStandardMaterial({
            color: 0xff6b6b,
            emissive: 0x5a1010,
            roughness: 0.45,
            metalness: 0.3,
          })
        );
        base.castShadow = true;
        base.position.y = 0.9;
        group.add(base);

        const light = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.7, 1.2),
          new THREE.MeshStandardMaterial({ color: 0xffd0d0, emissive: 0x4d1d1d })
        );
        light.position.y = 1.7;
        group.add(light);

        group.position.set(lanePositions[lane], 0, -42 - Math.random() * 45);
        scene.add(group);
        world.obstacles.push(group);
      }

      function createCoin() {
        const lane = Math.floor(Math.random() * lanePositions.length);
        const coin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.75, 0.75, 0.18, 18),
          new THREE.MeshStandardMaterial({
            color: 0xffd166,
            emissive: 0x5a4200,
            metalness: 0.85,
            roughness: 0.22,
          })
        );
        coin.rotation.z = Math.PI / 2;
        coin.position.set(lanePositions[lane], 1.7, -28 - Math.random() * 60);
        coin.castShadow = true;
        coin.receiveShadow = true;
        scene.add(coin);
        world.coins.push(coin);
      }

      function setLane(index) {
        targetLane = Math.max(0, Math.min(lanePositions.length - 1, index));
      }

      function moveLeft() {
        if (world.running) setLane(targetLane - 1);
      }

      function moveRight() {
        if (world.running) setLane(targetLane + 1);
      }

      function resetGame() {
        world.running = true;
        world.score = 0;
        world.elapsed = 0;
        world.speed = 24;
        world.lastObstacleSpawn = 0;
        world.lastCoinSpawn = 0;
        targetLane = 1;
        playerX = lanePositions[targetLane];
        player.position.x = playerX;

        world.obstacles.forEach((o) => scene.remove(o));
        world.coins.forEach((c) => scene.remove(c));
        world.obstacles = [];
        world.coins = [];
        scoreEl.textContent = '0';
      }

      function startGame() {
        resetGame();
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
      }

      function endGame() {
        world.running = false;
        finalScoreEl.textContent = String(world.score);

        if (world.score > bestScore) {
          bestScore = world.score;
          localStorage.setItem(storageKey, String(bestScore));
          bestScoreEl.textContent = String(bestScore);
          resultTextEl.textContent = '🎉 رکورد جدید!';
        } else {
          resultTextEl.textContent = 'دوباره تلاش کن!';
        }

        gameOverScreen.classList.remove('hidden');
      }

      function updateWorld(delta) {
        if (!world.running) return;

        world.elapsed += delta;
        world.speed = 24 + Math.min(world.score * 0.08, 26);
        world.score = Math.floor(world.elapsed * 22);
        scoreEl.textContent = String(world.score);

        playerX = THREE.MathUtils.lerp(playerX, lanePositions[targetLane], 0.12);
        player.position.x = playerX;
        player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, (playerX - player.position.x) * 0.12, 0.1);

        world.roadSegments.forEach((segment) => {
          segment.position.z += world.speed * delta;
          if (segment.position.z > 20) segment.position.z -= 24 * world.roadSegments.length;
        });

        world.leftBuildings.forEach((b) => {
          b.position.z += world.speed * delta;
          if (b.position.z > 28) b.position.z -= 24 * 12;
        });

        world.rightBuildings.forEach((b) => {
          b.position.z += world.speed * delta;
          if (b.position.z > 28) b.position.z -= 24 * 12;
        });

        if (world.elapsed - world.lastObstacleSpawn > 1.2) {
          createObstacle();
          world.lastObstacleSpawn = world.elapsed;
        }

        if (world.elapsed - world.lastCoinSpawn > 1.6) {
          createCoin();
          world.lastCoinSpawn = world.elapsed;
        }

        for (let i = world.obstacles.length - 1; i >= 0; i--) {
          const obstacle = world.obstacles[i];
          obstacle.position.z += world.speed * delta;

          if (Math.abs(obstacle.position.x - player.position.x) < 2.8 && Math.abs(obstacle.position.z - player.position.z) < 2.8) {
            endGame();
            return;
          }

          if (obstacle.position.z > 26) {
            scene.remove(obstacle);
            world.obstacles.splice(i, 1);
          }
        }

        for (let i = world.coins.length - 1; i >= 0; i--) {
          const coin = world.coins[i];
          coin.position.z += world.speed * delta;
          coin.rotation.y += 0.08;

          if (Math.abs(coin.position.x - player.position.x) < 2 && Math.abs(coin.position.z - player.position.z) < 2.2) {
            scene.remove(coin);
            world.coins.splice(i, 1);
            world.score += 30;
            scoreEl.textContent = String(world.score);
            continue;
          }

          if (coin.position.z > 28) {
            scene.remove(coin);
            world.coins.splice(i, 1);
          }
        }
      }

      function animate() {
        requestAnimationFrame(animate);

        const delta = Math.min(0.033, 1 / 60);
        updateWorld(delta);

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x * 0.8, 0.08);
        camera.position.y = 6.5;
        camera.position.z = 23;
        camera.lookAt(player.position.x * 0.8, 1.3, -8);

        renderer.render(scene, camera);
      }

      startBtn.addEventListener('click', startGame);
      restartBtn.addEventListener('click', startGame);
      leftBtn.addEventListener('pointerdown', moveLeft);
      rightBtn.addEventListener('pointerdown', moveRight);

      window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') moveLeft();
        if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') moveRight();
      });

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      initScene();
      scoreEl.textContent = '0';
    </script>
  </body>
</html>
