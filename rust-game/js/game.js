import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

console.log("Rust Survival Engine v2.5: Initializing with Collision Physics...");

// ==================== CONFIGURATION ====================
const CONFIG = {
    WORLD_SIZE: 250,
    TREE_COUNT: 45,
    ROCK_COUNT: 35,
    BUILD_DISTANCE: 6,
    INTERACT_DISTANCE: 3.5,
    PLAYER_SPEED: 80,
    FRICTION: 10.0,
    GRAVITY: 22.0,
    JUMP_FORCE: 8.5,
    PLAYER_RADIUS: 0.8 // Radius for collision
};

// ==================== STATE ====================
const state = {
    inventory: { wood: 0, stone: 0, iron: 0 },
    stats: { health: 100, hunger: 100 },
    buildMode: false,
    controls: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        canJump: false,
        crouch: false
    }
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// ==================== SCENE SETUP ====================
try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa3d1ff);
    scene.fog = new THREE.FogExp2(0xa3d1ff, 0.008);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const pointerControls = new PointerLockControls(camera, document.body);

    // ==================== LIGHTING ====================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    // ==================== WORLD OBJECTS ====================
    const groundGeo = new THREE.PlaneGeometry(CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE, 40, 40);
    groundGeo.rotateX(-Math.PI / 2);

    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getZ(i);
        pos.setY(i, Math.sin(x * 0.05) * Math.cos(y * 0.05) * 2.5);
    }
    groundGeo.computeVertexNormals();

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x477033, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, grassMat);
    ground.receiveShadow = true;
    scene.add(ground);

    const interactables = [];
    const collisionObjects = []; // Strictly for player-to-world collision

    // Forest Generation
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.5, 8);
    const leavesGeo = new THREE.DodecahedronGeometry(1.5, 1);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x244a26 });

    for (let i = 0; i < CONFIG.TREE_COUNT; i++) {
        const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const y = getTerrainHeight(x, z);

        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeo, woodMat);
        trunk.position.y = 1.25;
        trunk.castShadow = true;
        tree.add(trunk);

        const leaves = new THREE.Mesh(leavesGeo, leafMat);
        leaves.position.y = 3;
        leaves.castShadow = true;
        tree.add(leaves);

        tree.position.set(x, y, z);
        tree.userData = { type: 'tree', health: 4, radius: 0.5 };
        scene.add(tree);
        interactables.push(tree);
        collisionObjects.push(tree);
    }

    // Rocks
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6e7072 });
    for (let i = 0; i < CONFIG.ROCK_COUNT; i++) {
        const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const y = getTerrainHeight(x, z);
        const rock = new THREE.Mesh(rockGeo, stoneMat);
        rock.position.set(x, y + 0.5, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        const scale = 0.8 + Math.random();
        rock.scale.set(scale, scale, scale);
        rock.castShadow = true;
        rock.userData = { type: 'rock', health: 5, radius: scale };
        scene.add(rock);
        interactables.push(rock);
        collisionObjects.push(rock);
    }

    function getTerrainHeight(x, z) {
        return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.5;
    }

    // ==================== BUILDING ====================
    const buildGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.4 });
    const ghost = new THREE.Mesh(buildGeo, ghostMat);
    ghost.visible = false;
    scene.add(ghost);

    const builtObjects = [];

    function updateGhost() {
        if (!state.buildMode) { ghost.visible = false; return; }
        const r = new THREE.Raycaster();
        r.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hit = r.intersectObjects([ground, ...builtObjects]);
        if (hit.length > 0 && hit[0].distance < CONFIG.BUILD_DISTANCE) {
            const p = hit[0].point;
            const n = hit[0].face.normal;
            ghost.position.set(
                Math.round(p.x + n.x * 0.5),
                Math.round(p.y + n.y * 0.5),
                Math.round(p.z + n.z * 0.5)
            );
            ghost.visible = true;
            ghost.material.color.setHex(state.inventory.wood >= 10 ? 0x00ff00 : 0xff0000);
        } else { ghost.visible = false; }
    }

    // ==================== COLLISION DETECTION ====================
    function checkCollisions(newPos) {
        for (let obj of collisionObjects) {
            const dx = newPos.x - obj.position.x;
            const dz = newPos.z - obj.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            const minDistance = CONFIG.PLAYER_RADIUS + (obj.userData.radius || 0.5);

            if (distance < minDistance) {
                // Collision detected! Push back.
                const angle = Math.atan2(dz, dx);
                newPos.x = obj.position.x + Math.cos(angle) * minDistance;
                newPos.z = obj.position.z + Math.sin(angle) * minDistance;
                return true;
            }
        }
        for (let obj of builtObjects) {
            const dx = newPos.x - obj.position.x;
            const dz = newPos.z - obj.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            const minDistance = CONFIG.PLAYER_RADIUS + 0.75;
            if (distance < minDistance) {
                const angle = Math.atan2(dz, dx);
                newPos.x = obj.position.x + Math.cos(angle) * minDistance;
                newPos.z = obj.position.z + Math.sin(angle) * minDistance;
                return true;
            }
        }
        return false;
    }

    // ==================== HUD & SYSTEMS ====================
    function updateHUD() {
        document.getElementById('wood-count').innerText = state.inventory.wood;
        document.getElementById('stone-count').innerText = state.inventory.stone;
        document.getElementById('iron-count').innerText = state.inventory.iron;
        document.getElementById('health-fill').style.width = state.stats.health + '%';
        document.getElementById('hunger-fill').style.width = state.stats.hunger + '%';
    }

    setInterval(() => {
        if (pointerControls.isLocked) {
            state.stats.hunger = Math.max(0, state.stats.hunger - 0.2);
            if (state.stats.hunger <= 0) state.stats.health = Math.max(0, state.stats.health - 1);
            updateHUD();
        }
    }, 3000);

    const raycaster = new THREE.Raycaster();
    function performAction() {
        if (state.buildMode) {
            if (ghost.visible && state.inventory.wood >= 10) {
                const b = new THREE.Mesh(buildGeo, new THREE.MeshStandardMaterial({ color: 0x6e4b2e }));
                b.position.copy(ghost.position);
                b.castShadow = true;
                b.receiveShadow = true;
                scene.add(b);
                builtObjects.push(b);
                state.inventory.wood -= 10;
                updateHUD();
            }
            return;
        }

        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hits = raycaster.intersectObjects(interactables, true);
        if (hits.length > 0 && hits[0].distance < CONFIG.INTERACT_DISTANCE) {
            let obj = hits[0].object;
            while (obj.parent !== scene) obj = obj.parent;
            obj.userData.health -= 1;
            obj.position.x += 0.1;
            setTimeout(() => obj.position.x -= 0.1, 50);
            if (obj.userData.type === 'tree') state.inventory.wood += 5;
            else {
                state.inventory.stone += 3;
                if (Math.random() > 0.8) state.inventory.iron += 1;
            }
            if (obj.userData.health <= 0) {
                scene.remove(obj);
                interactables.splice(interactables.indexOf(obj), 1);
                collisionObjects.splice(collisionObjects.indexOf(obj), 1);
            }
            updateHUD();
        }
    }

    // ==================== CONTROLS ====================
    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') state.controls.forward = true;
        if (e.code === 'KeyS') state.controls.backward = true;
        if (e.code === 'KeyA') state.controls.left = true;
        if (e.code === 'KeyD') state.controls.right = true;
        if (e.code === 'Space' && state.controls.canJump) {
            velocity.y += CONFIG.JUMP_FORCE;
            state.controls.canJump = false;
        }
        if (e.code === 'KeyE') {
            const inv = document.getElementById('inventory');
            if (inv.style.display === 'block') {
                inv.style.display = 'none';
                pointerControls.lock();
            } else {
                inv.style.display = 'block';
                pointerControls.unlock();
                document.getElementById('inventory-grid').innerHTML = `
                    <div class="inventory-item">🪵 الخشب: ${state.inventory.wood}</div>
                    <div class="inventory-item">🪨 الحجر: ${state.inventory.stone}</div>
                    <div class="inventory-item">⚙️ الحديد: ${state.inventory.iron}</div>
                `;
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW') state.controls.forward = false;
        if (e.code === 'KeyS') state.controls.backward = false;
        if (e.code === 'KeyA') state.controls.left = false;
        if (e.code === 'KeyD') state.controls.right = false;
    });

    window.addEventListener('mousedown', (e) => {
        if (!pointerControls.isLocked) return;
        if (e.button === 0) performAction();
        if (e.button === 2) {
            state.buildMode = !state.buildMode;
            document.getElementById('build-mode-hint').style.display = state.buildMode ? 'block' : 'none';
        }
    });

    document.getElementById('start-button').onclick = () => pointerControls.lock();
    pointerControls.addEventListener('lock', () => document.getElementById('instructions').style.display = 'none');
    pointerControls.addEventListener('unlock', () => document.getElementById('instructions').style.display = 'flex');

    // ==================== ANIMATION LOOP ====================
    let lastTime = performance.now();
    function animate() {
        requestAnimationFrame(animate);
        const time = performance.now();
        const delta = (time - lastTime) / 1000;

        if (pointerControls.isLocked) {
            velocity.x -= velocity.x * CONFIG.FRICTION * delta;
            velocity.z -= velocity.z * CONFIG.FRICTION * delta;
            velocity.y -= CONFIG.GRAVITY * delta;

            direction.z = Number(state.controls.forward) - Number(state.controls.backward);
            direction.x = Number(state.controls.right) - Number(state.controls.left);
            direction.normalize();

            if (state.controls.forward || state.controls.backward) velocity.z -= direction.z * CONFIG.PLAYER_SPEED * delta;
            if (state.controls.left || state.controls.right) velocity.x -= direction.x * CONFIG.PLAYER_SPEED * delta;

            const moveStepX = -velocity.x * delta;
            const moveStepZ = -velocity.z * delta;

            // Apply movement to a temporary vector to check for collisions
            const nextX = camera.position.x + (Math.sin(camera.rotation.y) * moveStepZ + Math.cos(camera.rotation.y) * moveStepX);
            const nextZ = camera.position.z + (Math.cos(camera.rotation.y) * moveStepZ - Math.sin(camera.rotation.y) * moveStepX);

            const collisionPoint = { x: nextX, z: nextZ };
            checkCollisions(collisionPoint);

            camera.position.x = collisionPoint.x;
            camera.position.z = collisionPoint.z;
            camera.position.y += (velocity.y * delta);

            const groundY = getTerrainHeight(camera.position.x, camera.position.z) + 1.6;
            if (camera.position.y < groundY) {
                velocity.y = 0;
                camera.position.y = groundY;
                state.controls.canJump = true;
            }
            updateGhost();
        }

        renderer.render(scene, camera);
        lastTime = time;
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
    setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 1000);

} catch (err) {
    console.error("Critical Failure:", err);
    alert("Error: " + err.message);
}
