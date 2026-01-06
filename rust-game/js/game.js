import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

console.log("Game Engine: Initializing...");

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

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// ==================== SCENE SETUP ====================
try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 0, 150);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6;

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
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // ==================== WORLD GENERATION ====================
    const groundGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 32, 32);
    groundGeometry.rotateX(-Math.PI / 2);

    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x348c31, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeometry, grassMaterial);
    ground.receiveShadow = true;
    scene.add(ground);

    const interactables = [];
    const trees = [];
    const rocks = [];

    // Tree/Rock logic
    const treeTrunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const treeLeavesGeometry = new THREE.ConeGeometry(1.2, 3, 8);
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x757575 });

    function generateEnvironment() {
        for (let i = 0; i < TREE_COUNT; i++) {
            const x = (Math.random() - 0.5) * (WORLD_SIZE - 20);
            const z = (Math.random() - 0.5) * (WORLD_SIZE - 20);
            const trunk = new THREE.Mesh(treeTrunkGeometry, woodMaterial);
            trunk.position.set(x, 1, z);
            trunk.castShadow = true;
            trunk.userData = { type: 'tree', health: 3 };
            const leaves = new THREE.Mesh(treeLeavesGeometry, leafMaterial);
            leaves.position.set(0, 2, 0);
            trunk.add(leaves);
            scene.add(trunk);
            interactables.push(trunk);
        }

        for (let i = 0; i < ROCK_COUNT; i++) {
            const x = (Math.random() - 0.5) * (WORLD_SIZE - 20);
            const z = (Math.random() - 0.5) * (WORLD_SIZE - 20);
            const rock = new THREE.Mesh(rockGeometry, stoneMaterial);
            rock.position.set(x, 0.5, z);
            rock.scale.set(Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5);
            rock.castShadow = true;
            rock.userData = { type: 'rock', health: 4 };
            scene.add(rock);
            interactables.push(rock);
        }
    }

    generateEnvironment();

    // ==================== BUILDING ====================
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const ghostMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
    const ghostBlock = new THREE.Mesh(boxGeometry, ghostMaterial);
    ghostBlock.visible = false;
    scene.add(ghostBlock);

    const blocks = [];

    function updateGhostBlock() {
        if (!buildMode) { ghostBlock.visible = false; return; }
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects([ground, ...blocks]);
        if (intersects.length > 0 && intersects[0].distance < BUILD_DISTANCE) {
            const point = intersects[0].point;
            const face = intersects[0].face;
            ghostBlock.position.set(
                Math.round(point.x + face.normal.x * 0.1),
                Math.round(point.y + face.normal.y * 0.1),
                Math.round(point.z + face.normal.z * 0.1)
            );
            ghostBlock.visible = true;
        } else {
            ghostBlock.visible = false;
        }
    }

    function placeBlock() {
        if (!buildMode || !ghostBlock.visible || inventory.wood < 5) return;
        const block = new THREE.Mesh(boxGeometry, new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
        block.position.copy(ghostBlock.position);
        block.castShadow = true;
        scene.add(block);
        blocks.push(block);
        inventory.wood -= 5;
        updateHUD();
    }

    // ==================== INTERACTION ====================
    const raycaster = new THREE.Raycaster();
    const interactionHint = document.getElementById('interaction-hint');

    function interact() {
        if (buildMode) { placeBlock(); return; }
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(interactables);
        if (intersects.length > 0 && intersects[0].distance < INTERACT_DISTANCE) {
            const obj = intersects[0].object;
            obj.userData.health -= 1;
            if (obj.userData.type === 'tree') inventory.wood += 5;
            else inventory.stone += 5;

            if (obj.userData.health <= 0) {
                scene.remove(obj);
                interactables.splice(interactables.indexOf(obj), 1);
            }
            updateHUD();
        }
    }

    function updateHUD() {
        document.getElementById('wood-count').textContent = inventory.wood;
        document.getElementById('stone-count').textContent = inventory.stone;
        document.getElementById('iron-count').textContent = inventory.iron;
    }

    // ==================== CONTROLS ====================
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') moveForward = true;
        if (e.code === 'KeyS') moveBackward = true;
        if (e.code === 'KeyA') moveLeft = true;
        if (e.code === 'KeyD') moveRight = true;
        if (e.code === 'Space' && canJump) { velocity.y += 5; canJump = false; }
        if (e.code === 'KeyE') toggleInventory();
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW') moveForward = false;
        if (e.code === 'KeyS') moveBackward = false;
        if (e.code === 'KeyA') moveLeft = false;
        if (e.code === 'KeyD') moveRight = false;
    });

    document.addEventListener('mousedown', (e) => {
        if (!controls.isLocked) return;
        if (e.button === 0) interact();
        if (e.button === 2) {
            buildMode = !buildMode;
            document.getElementById('build-mode-hint').style.display = buildMode ? 'block' : 'none';
        }
    });

    document.addEventListener('contextmenu', e => e.preventDefault());

    document.getElementById('start-button').onclick = () => controls.lock();
    controls.addEventListener('lock', () => document.getElementById('instructions').style.display = 'none');
    controls.addEventListener('unlock', () => document.getElementById('instructions').style.display = 'flex');

    function toggleInventory() {
        const inv = document.getElementById('inventory');
        if (inv.style.display === 'block') {
            inv.style.display = 'none';
            controls.lock();
        } else {
            inv.style.display = 'block';
            controls.unlock();
            const grid = document.getElementById('inventory-grid');
            grid.innerHTML = `<div>Wood: ${inventory.wood}</div><div>Stone: ${inventory.stone}</div>`;
        }
    }

    // ==================== LOOP ====================
    let lastTime = performance.now();
    function animate() {
        requestAnimationFrame(animate);
        const time = performance.now();
        const delta = (time - lastTime) / 1000;

        if (controls.isLocked) {
            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;
            velocity.y -= 9.8 * 2.0 * delta;

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();

            if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
            if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

            controls.moveRight(-velocity.x * delta);
            controls.moveForward(-velocity.z * delta);
            camera.position.y += (velocity.y * delta);

            if (camera.position.y < 1.6) {
                velocity.y = 0;
                camera.position.y = 1.6;
                canJump = true;
            }
            updateGhostBlock();
        }
        renderer.render(scene, camera);
        lastTime = time;
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // START
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        animate();
        console.log("Game Engine: Started Successfully");
    }, 1000);

} catch (err) {
    console.error("Game Initialization Failed:", err);
    alert("Full Error: " + err.message);
}
