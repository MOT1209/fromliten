import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

console.log("Rust Survival Engine v2.5: Initializing with Collision Physics...");

// ==================== CONFIGURATION ====================
const CONFIG = {
    WORLD_SIZE: 250,
    TREE_COUNT: 45,
    ROCK_COUNT: 25,
    SULFUR_COUNT: 15,
    BARREL_COUNT: 20,
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
    inventory: [
        { id: 'wood', count: 0 },
        { id: 'stone', count: 0 },
        { id: 'iron', count: 0 },
        { id: 'sulfur', count: 0 },
        { id: 'scrap', count: 0 }
    ],
    gear: { head: null, chest: null, legs: null, feet: null },
    belt: Array(6).fill(null),
    stats: { health: 100, hunger: 100, calories: 500, hydration: 500 },
    buildMode: false,
    viewMode: 'first',
    controls: { forward: false, backward: false, left: false, right: false, jump: false, canJump: false, crouch: false }
};

const ITEMS_DATA = {
    // Resources
    'wood': { name: 'Wood', icon: 'fa-tree', color: '#5d4037' },
    'stone': { name: 'Stone', icon: 'fa-gem', color: '#757575' },
    'iron': { name: 'Metal Ore', icon: 'fa-cube', color: '#90a4ae' },
    'sulfur': { name: 'Sulfur Ore', icon: 'fa-flask', color: '#ffeb3b' },
    'scrap': { name: 'Scrap', icon: 'fa-nut-bolt', color: '#bcaae1' },
    // Components
    'gear_comp': { name: 'Gears', icon: 'fa-gear', color: '#9e9e9e' },
    'pipe': { name: 'Metal Pipe', icon: 'fa-water', color: '#b0bec5' },
    'spring': { name: 'Spring', icon: 'fa-coil', color: '#cfd8dc' },
    // Tools
    'axe': { name: 'Hatchet', icon: 'fa-axe', recipe: { wood: 100, stone: 50 } },
    'pickaxe': { name: 'Pickaxe', icon: 'fa-hammer-war', recipe: { wood: 50, stone: 100 } },
    'hammer': { name: 'Hammer', icon: 'fa-hammer', recipe: { wood: 50, iron: 10 } },
    'torch': { name: 'Torch', icon: 'fa-fire', recipe: { wood: 50 } },
    // Weapons
    'spear': { name: 'Wood Spear', icon: 'fa-pencil', recipe: { wood: 300 } },
    'bow': { name: 'Hunting Bow', icon: 'fa-bow-arrow', recipe: { wood: 200 } },
    'pistol': { name: 'Semi Pistol', icon: 'fa-gun', recipe: { iron: 100, pipe: 1 } },
    'rifle': { name: 'Assault Rifle', icon: 'fa-jet-fighter', recipe: { iron: 250, spring: 2, pipe: 1 } },
    'smg': { name: 'Custom SMG', icon: 'fa-shield', recipe: { iron: 150, spring: 1 } },
    // Ammo
    'arrow': { name: 'Arrows', icon: 'fa-location-arrow', recipe: { wood: 10 } },
    'pistol_ammo': { name: 'Pistol Bullets', icon: 'fa-circle', recipe: { iron: 5, sulfur: 5 } },
    'rifle_ammo': { name: 'Rifle Bullets', icon: 'fa-circle-dot', recipe: { iron: 10, sulfur: 10 } },
    // Armor & Clothing
    'helmet': { name: 'Metal Helmet', icon: 'fa-hat-cowboy', recipe: { iron: 50 } },
    'armor': { name: 'Metal Chestplate', icon: 'fa-shirt', recipe: { iron: 100 } },
    'clothing': { name: 'Pants', icon: 'fa-socks', recipe: { wood: 50 } },
    'hazmat': { name: 'Hazmat Suit', icon: 'fa-user-ninja', recipe: { iron: 200, scrap: 50 } },
    // Buidling
    'foundation': { name: 'Foundation', icon: 'fa-square', recipe: { wood: 200 } },
    'wall': { name: 'Wall', icon: 'fa-border-all', recipe: { wood: 100 } },
    'door': { name: 'Wooden Door', icon: 'fa-door-closed', recipe: { wood: 300 } },
    'lock': { name: 'Key Lock', icon: 'fa-lock', recipe: { iron: 100 } },
    'ladder': { name: 'Wooden Ladder', icon: 'fa-ladder-water', recipe: { wood: 100 } },
    // Devices
    'workbench': { name: 'Workbench', icon: 'fa-table-list', recipe: { wood: 500, iron: 100 } },
    'furnace': { name: 'Furnace', icon: 'fa-fire-burner', recipe: { stone: 200, wood: 50 } },
    'generator': { name: 'Generator', icon: 'fa-bolt', recipe: { iron: 500, gear_comp: 2 } },
    'battery': { name: 'Large Battery', icon: 'fa-battery-full', recipe: { iron: 200, scrap: 100 } },
    // Food & Medical
    'meat': { name: 'Cooked Meat', icon: 'fa-drumstick-bite', recipe: { wood: 10 } },
    'water': { name: 'Water Jug', icon: 'fa-bottle-water', recipe: { iron: 10 } },
    'syringe': { name: 'Medical Syringe', icon: 'fa-syringe', recipe: { iron: 20, scrap: 5 } },
    'bandage': { name: 'Bandage', icon: 'fa-band-aid', recipe: { clothing: 1 } },
    // Transport
    'horse': { name: 'Horse Saddle', icon: 'fa-horse', recipe: { scrap: 100 } },
    'boat': { name: 'Rowboat', icon: 'fa-ship', recipe: { wood: 500, scrap: 50 } },
    'minicopter': { name: 'Minicopter', icon: 'fa-helicopter', recipe: { scrap: 750, iron: 500 } }
};


let playerMesh;



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

    // ==================== PLAYER MODEL ====================
    function createPlayer() {
        const group = new THREE.Group();

        // Body (Reddish Rust jacket)
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x8b322c }));
        torso.position.y = 1.25;
        torso.castShadow = true;
        group.add(torso);

        // Head (Beige/Hazmat skin)
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
        head.position.y = 1.85;
        head.castShadow = true;
        group.add(head);

        // Legs (Dark pants)
        const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const lLeg = new THREE.Mesh(legGeo, legMat);
        lLeg.position.set(-0.15, 0.4, 0);
        lLeg.castShadow = true;
        group.add(lLeg);

        const rLeg = new THREE.Mesh(legGeo, legMat);
        rLeg.position.set(0.15, 0.4, 0);
        rLeg.castShadow = true;
        group.add(rLeg);

        scene.add(group);
        return group;
    }
    playerMesh = createPlayer();

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

    // Rocks (Stone/Iron)
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 0);
    for (let i = 0; i < CONFIG.ROCK_COUNT; i++) {
        const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const y = getTerrainHeight(x, z);
        const isIron = Math.random() > 0.7;
        const rock = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({ color: isIron ? 0x90a4ae : 0x6e7072 }));
        rock.position.set(x, y + 0.5, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        const scale = 0.8 + Math.random();
        rock.scale.set(scale, scale, scale);
        rock.castShadow = true;
        rock.userData = { type: isIron ? 'iron' : 'rock', health: 5, radius: scale };
        scene.add(rock);
        interactables.push(rock);
        collisionObjects.push(rock);
    }

    // Sulfur Rocks (Yellow)
    const sulfurMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, emissive: 0x444400, emissiveIntensity: 0.2 });
    for (let i = 0; i < CONFIG.SULFUR_COUNT; i++) {
        const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const rock = new THREE.Mesh(rockGeo, sulfurMat);
        rock.position.set(x, getTerrainHeight(x, z) + 0.4, z);
        rock.scale.set(0.7, 0.6, 0.7);
        rock.userData = { type: 'sulfur', health: 5, radius: 0.6 };
        scene.add(rock);
        interactables.push(rock);
        collisionObjects.push(rock);
    }

    // Barrels (Blue Cylinders)
    const barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1e88e5 });
    for (let i = 0; i < CONFIG.BARREL_COUNT; i++) {
        const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 60);
        const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 60);
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(x, getTerrainHeight(x, z) + 0.6, z);
        barrel.userData = { type: 'barrel', health: 3, radius: 0.5 };
        scene.add(barrel);
        interactables.push(barrel);
        collisionObjects.push(barrel);
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

    function getItemCount(id) {
        const item = state.inventory.find(i => i.id === id);
        return item ? item.count : 0;
    }

    function addItem(id, count) {
        let item = state.inventory.find(i => i.id === id);
        if (item) item.count += count;
        else state.inventory.push({ id, count });
        updateHUD();
    }

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
            ghost.material.color.setHex(getItemCount('wood') >= 10 ? 0x00ff00 : 0xff0000);
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
        // Find counts from inventory array
        const wood = getItemCount('wood');
        const stone = getItemCount('stone');
        const iron = getItemCount('iron');
        const scrap = getItemCount('scrap');

        document.getElementById('wood-count').innerText = wood;
        document.getElementById('stone-count').innerText = stone;
        document.getElementById('iron-count').innerText = iron;
        // Optionally show scrap if needed, or just let inventory handle it

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
            if (ghost.visible && getItemCount('wood') >= 10) {
                const b = new THREE.Mesh(buildGeo, new THREE.MeshStandardMaterial({ color: 0x6e4b2e }));
                b.position.copy(ghost.position);
                b.castShadow = true;
                b.receiveShadow = true;
                scene.add(b);
                builtObjects.push(b);

                // Subtract wood
                const wood = state.inventory.find(i => i.id === 'wood');
                if (wood) wood.count -= 10;

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
            obj.position.x += 0.05;
            setTimeout(() => obj.position.x -= 0.05, 50);

            // Collect Resources
            const type = obj.userData.type;
            if (type === 'tree') addItem('wood', 7);
            else if (type === 'rock') addItem('stone', 5);
            else if (type === 'iron') addItem('iron', 5);
            else if (type === 'sulfur') addItem('sulfur', 5);
            else if (type === 'barrel') {
                addItem('scrap', 2);
                if (Math.random() > 0.7) addItem('gear_comp', 1);
                if (Math.random() > 0.7) addItem('pipe', 1);
                if (Math.random() > 0.7) addItem('spring', 1);
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
        if (e.code === 'KeyV') {
            state.viewMode = state.viewMode === 'first' ? 'third' : 'first';
            playerMesh.visible = (state.viewMode === 'third');
        }
        if (e.code === 'KeyE' || e.code === 'Escape') {

            const inv = document.getElementById('inventory');
            if (inv.style.display === 'block') {
                inv.style.display = 'none';
                pointerControls.lock();
            } else {
                inv.style.display = 'block';
                pointerControls.unlock();

                initPlayerPreview();

                // Populate Main Inventory (24 slots)
                const mainGrid = document.getElementById('main-inventory-grid');
                mainGrid.innerHTML = '';
                const itemsToDisplay = state.inventory.filter(i => i.count > 0);

                for (let i = 0; i < 24; i++) {
                    const slot = document.createElement('div');
                    slot.className = 'inv-slot';
                    if (itemsToDisplay[i]) {
                        const itemData = ITEMS_DATA[itemsToDisplay[i].id];
                        if (itemData) {
                            slot.innerHTML = `<i class="fas ${itemData.icon}"></i><span class="slot-count">${itemsToDisplay[i].count}</span>`;
                            slot.title = itemData.name;
                        }
                    }
                    mainGrid.appendChild(slot);
                }

                // Populate Belt (6 slots)
                const beltGrid = document.getElementById('belt-inventory-grid');
                beltGrid.innerHTML = '';
                for (let i = 0; i < 6; i++) {
                    const slot = document.createElement('div');
                    slot.className = 'inv-slot';
                    if (i === 0) slot.innerHTML = `<i class="fas fa-hand-fist"></i>`;
                    if (i === 1) slot.innerHTML = `<i class="fas fa-hammer"></i>`;
                    beltGrid.appendChild(slot);
                }

                // Populate Crafting List
                const craftList = document.querySelector('.crafting-list');
                craftList.innerHTML = '';
                Object.keys(ITEMS_DATA).forEach(id => {
                    const item = ITEMS_DATA[id];
                    if (item.recipe) {
                        const div = document.createElement('div');
                        div.className = 'craft-item';
                        div.innerHTML = `<span>${item.name}</span><small>${Object.entries(item.recipe).map(([res, amt]) => `${amt} ${res}`).join(', ')}</small>`;
                        div.onclick = () => craftItem(id);
                        craftList.appendChild(div);
                    }
                });
            }
        }
    });

    function craftItem(id) {
        const item = ITEMS_DATA[id];
        let canCraft = true;
        for (let [res, amt] of Object.entries(item.recipe)) {
            if (getItemCount(res) < amt) {
                canCraft = false;
                break;
            }
        }

        if (canCraft) {
            for (let [res, amt] of Object.entries(item.recipe)) {
                const inventoryItem = state.inventory.find(i => i.id === res);
                if (inventoryItem) inventoryItem.count -= amt;
            }
            addItem(id, 1);
            console.log("Crafted: " + item.name);
            // Re-render inventory
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
        } else {
            alert("Not enough resources to craft " + item.name);
        }
    }



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

            // Use built-in methods for correct direction math
            pointerControls.moveRight(-velocity.x * delta);
            pointerControls.moveForward(-velocity.z * delta);

            // Apply Collision Correction to the new position
            const collisionPoint = { x: camera.position.x, z: camera.position.z };
            checkCollisions(collisionPoint);
            camera.position.x = collisionPoint.x;
            camera.position.z = collisionPoint.z;

            // Apply Physics / Gravity
            camera.position.y += (velocity.y * delta);
            const groundY = getTerrainHeight(camera.position.x, camera.position.z) + 1.6;
            if (camera.position.y < groundY) {
                velocity.y = 0;
                camera.position.y = groundY;
                state.controls.canJump = true;
            }

            // Sync Player Mesh with Camera 
            // Position it at the "feet" (camera - 1.6)
            playerMesh.position.set(camera.position.x, camera.position.y - 1.6, camera.position.z);

            // Rotate player to match look direction (only Y axis)
            const playerRot = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
            playerMesh.rotation.y = playerRot.y + Math.PI;

            updateGhost();
        }

        // Handle 3rd Person View Offset for Rendering
        const originalCamPos = camera.position.clone();
        if (state.viewMode === 'third') {
            const offset = new THREE.Vector3(0, 1.5, 4).applyQuaternion(camera.quaternion);
            camera.position.add(offset);
        }

        renderer.render(scene, camera);

        // Reset camera position for next frame's control logic
        camera.position.copy(originalCamPos);
        lastTime = time;

    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
    setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 1000);

    // ==================== INVENTORY 3D PREVIEW ====================
    let previewRenderer, previewScene, previewCamera, previewPlayer;

    function initPlayerPreview() {
        const container = document.getElementById('player-3d-preview');
        if (!container) return;

        // Clear previous
        container.innerHTML = '';

        previewScene = new THREE.Scene();
        previewCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
        previewCamera.position.set(0, 1.2, 3.5);

        previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        previewRenderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(previewRenderer.domElement);

        const light = new THREE.AmbientLight(0xffffff, 1);
        previewScene.add(light);

        // Create a copy of player
        previewPlayer = new THREE.Group();
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x8b322c }));
        torso.position.y = 1.25;
        previewPlayer.add(torso);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
        head.position.y = 1.85;
        previewPlayer.add(head);

        previewScene.add(previewPlayer);

        function animatePreview() {
            if (document.getElementById('inventory').style.display === 'none') return;
            requestAnimationFrame(animatePreview);
            previewPlayer.rotation.y += 0.01;
            previewRenderer.render(previewScene, previewCamera);
        }
        animatePreview();
    }

} catch (err) {
    console.error("Critical Failure:", err);
    alert("Error: " + err.message);
}
