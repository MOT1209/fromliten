import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ==================== CONFIGURATION ====================
const WORLD_SIZE = 200;
const TREE_COUNT = 50;
const ROCK_COUNT = 40;
const BUILD_DISTANCE = 5;
const INTERACT_DISTANCE = 3;

// ==================== STATE ====================
const inventory = {
    wood: 0,
    stone: 0,
    iron: 0
};

let buildMode = false;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let isCrouching = false;

const prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// ==================== SCENE SETUP ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.Fog(0x87ceeb, 0, 150);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.6; // Eye level

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);

// ==================== LIGHTING ====================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
scene.add(sunLight);

// ==================== WORLD GENERATION ====================
// Terrain
const groundGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 64, 64);
groundGeometry.rotateX(-Math.PI / 2);

// Add some hills
const vertices = groundGeometry.attributes.position.array;
for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    vertices[i + 1] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
}
groundGeometry.computeVertexNormals();

const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x348c31, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeometry, grassMaterial);
ground.receiveShadow = true;
scene.add(ground);

// Resources Array for Raycasting
const interactables = [];
const trees = [];
const rocks = [];

// Trees Generation
const treeTrunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
const treeLeavesGeometry = new THREE.ConeGeometry(1.2, 3, 8);
const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });

for (let i = 0; i < TREE_COUNT; i++) {
    const x = (Math.random() - 0.5) * (WORLD_SIZE - 20);
    const z = (Math.random() - 0.5) * (WORLD_SIZE - 20);
    const y = getTerrainHeight(x, z);

    const trunk = new THREE.Mesh(treeTrunkGeometry, woodMaterial);
    trunk.position.set(x, y + 1, z);
    trunk.castShadow = true;
    trunk.userData = { type: 'tree', health: 3 };

    const leaves = new THREE.Mesh(treeLeavesGeometry, leafMaterial);
    leaves.position.set(0, 2, 0);
    trunk.add(leaves);

    scene.add(trunk);
    interactables.push(trunk);
    trees.push(trunk);
}

// Rocks Generation
const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x757575 });

for (let i = 0; i < ROCK_COUNT; i++) {
    const x = (Math.random() - 0.5) * (WORLD_SIZE - 20);
    const z = (Math.random() - 0.5) * (WORLD_SIZE - 20);
    const y = getTerrainHeight(x, z);

    const rock = new THREE.Mesh(rockGeometry, stoneMaterial);
    rock.position.set(x, y + 0.5, z);
    rock.scale.set(Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5);
    rock.castShadow = true;
    rock.userData = { type: 'rock', health: 4 };

    scene.add(rock);
    interactables.push(rock);
    rocks.push(rock);
}

function getTerrainHeight(x, z) {
    return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
}

// ==================== BUILDING SYSTEM ====================
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const ghostMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
const ghostBlock = new THREE.Mesh(boxGeometry, ghostMaterial);
ghostBlock.visible = false;
scene.add(ghostBlock);

const blocks = [];

function updateGhostBlock() {
    if (!buildMode) {
        ghostBlock.visible = false;
        return;
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const intersects = raycaster.intersectObjects([ground, ...blocks]);

    if (intersects.length > 0 && intersects[0].distance < BUILD_DISTANCE) {
        const point = intersects[0].point;
        const face = intersects[0].face;

        // Snap to grid
        ghostBlock.position.set(
            Math.round(point.x + face.normal.x * 0.1),
            Math.round(point.y + face.normal.y * 0.1),
            Math.round(point.z + face.normal.z * 0.1)
        );
        ghostBlock.visible = true;

        // Check if we have resources
        if (inventory.wood < 5) {
            ghostBlock.material.color.setHex(0xff0000);
        } else {
            ghostBlock.material.color.setHex(0x00ff00);
        }
    } else {
        ghostBlock.visible = false;
    }
}

function placeBlock() {
    if (!buildMode || !ghostBlock.visible || inventory.wood < 5) return;

    const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const block = new THREE.Mesh(boxGeometry, blockMaterial);
    block.position.copy(ghostBlock.position);
    block.castShadow = true;
    block.receiveShadow = true;
    block.userData = { type: 'building_block' };

    scene.add(block);
    blocks.push(block);

    inventory.wood -= 5;
    updateHUD();

    // Simple particle effect
    createParticles(block.position, 0x8b4513);
}

// ==================== INTERACTION ====================
const raycaster = new THREE.Raycaster();
const interactionHint = document.getElementById('interaction-hint');

function checkInteractions() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(interactables);

    if (intersects.length > 0 && intersects[0].distance < INTERACT_DISTANCE) {
        interactionHint.style.display = 'block';
        return intersects[0].object;
    } else {
        interactionHint.style.display = 'none';
        return null;
    }
}

function interact() {
    if (buildMode) {
        placeBlock();
        return;
    }

    const object = checkInteractions();
    if (!object) return;

    object.userData.health -= 1;

    // Scale effect for "hit"
    object.scale.multiplyScalar(0.9);
    setTimeout(() => object.scale.divideScalar(0.9), 100);

    if (object.userData.type === 'tree') {
        inventory.wood += 10;
        createParticles(object.position, 0x5d4037);
    } else if (object.userData.type === 'rock') {
        inventory.stone += 8;
        if (Math.random() > 0.7) inventory.iron += 2;
        createParticles(object.position, 0x757575);
    }

    if (object.userData.health <= 0) {
        scene.remove(object);
        const idx = interactables.indexOf(object);
        if (idx > -1) interactables.splice(idx, 1);
        showToast("Object Harvested!");
    }

    updateHUD();
}

// ==================== PARTICLES ====================
function createParticles(position, color) {
    const particleCount = 8;
    const geometry = new THREE.SphereGeometry(0.05, 4, 4);
    const material = new THREE.MeshBasicMaterial({ color: color });

    for (let i = 0; i < particleCount; i++) {
        const p = new THREE.Mesh(geometry, material);
        p.position.copy(position);
        p.position.y += 0.5;
        scene.add(p);

        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.1,
            (Math.random() - 0.5) * 0.1
        );

        const animate = () => {
            p.position.add(vel);
            vel.y -= 0.005; // Gravity
            p.scale.multiplyScalar(0.95);
            if (p.scale.x > 0.01) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(p);
            }
        };
        animate();
    }
}

// ==================== UI & HUD ====================
function updateHUD() {
    document.getElementById('wood-count').textContent = inventory.wood;
    document.getElementById('stone-count').textContent = inventory.stone;
    document.getElementById('iron-count').textContent = inventory.iron;
}

function showToast(text) {
    const hint = document.getElementById('interaction-hint');
    hint.textContent = text;
    hint.style.display = 'block';
    setTimeout(() => {
        hint.textContent = "Press LMB to interact";
    }, 2000);
}

// ==================== CONTROLS ====================
const onKeyDown = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = true; break;
        case 'Space':
            if (canJump) velocity.y += 10;
            canJump = false;
            break;
        case 'ControlLeft':
            isCrouching = true;
            camera.position.y = 0.8;
            break;
        case 'KeyE':
            toggleInventory();
            break;
    }
};

const onKeyUp = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = false; break;
        case 'ControlLeft':
            isCrouching = false;
            camera.position.y = 1.6;
            break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

document.addEventListener('mousedown', (e) => {
    if (!controls.isLocked) return;

    if (e.button === 0) { // LMB
        interact();
    } else if (e.button === 2) { // RMB
        buildMode = !buildMode;
        document.getElementById('build-mode-hint').style.display = buildMode ? 'block' : 'none';
        showToast(buildMode ? "Build Mode Enabled" : "Build Mode Disabled");
    }
});

// Prevent context menu on RMB
document.addEventListener('contextmenu', (e) => e.preventDefault());

const startButton = document.getElementById('start-button');
startButton.addEventListener('click', () => {
    controls.lock();
    document.getElementById('instructions').style.display = 'none';
});

controls.addEventListener('lock', () => {
    document.getElementById('instructions').style.display = 'none';
});

controls.addEventListener('unlock', () => {
    document.getElementById('instructions').style.display = 'flex';
});

function toggleInventory() {
    const inv = document.getElementById('inventory');
    if (inv.style.display === 'block') {
        inv.style.display = 'none';
        controls.lock();
    } else {
        inv.style.display = 'block';
        controls.unlock();
        updateInventoryUI();
    }
}

function updateInventoryUI() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = `
        <div class="inventory-item">🪵 Wood: ${inventory.wood}</div>
        <div class="inventory-item">🪨 Stone: ${inventory.stone}</div>
        <div class="inventory-item">🧱 Iron: ${inventory.iron}</div>
    `;
}

// ==================== ANIMATION LOOP ====================
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - lastTime) / 1000;

    if (controls.isLocked) {
        // Friction/Damping
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 3.0 * delta; // Gravity

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const speed = isCrouching ? 20.0 : 40.0;

        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        camera.position.y += (velocity.y * delta);

        // Ground Collision
        const currentTerrainY = getTerrainHeight(camera.position.x, camera.position.z);
        const eyeHeight = isCrouching ? 0.8 : 1.6;

        if (camera.position.y < (currentTerrainY + eyeHeight)) {
            velocity.y = 0;
            camera.position.y = currentTerrainY + eyeHeight;
            canJump = true;
        }

        checkInteractions();
        updateGhostBlock();
    }

    renderer.render(scene, camera);
    lastTime = time;
}

// ==================== INIT ====================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Hide loading screen
setTimeout(() => {
    document.getElementById('loading-screen').style.display = 'none';
    animate();
}, 2000);
