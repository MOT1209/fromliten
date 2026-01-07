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
    controls: { forward: false, backward: false, left: false, right: false, jump: false, canJump: false, crouch: false },
    selectedCategory: 'common',
    selectedItem: null,
    craftQty: 1
};

const ITEMS_DATA = {
    // Resources
    'wood': { name: 'Wood', category: 'resources', icon: 'fa-tree', color: '#5d4037', desc: 'Basic building material harvested from trees.' },
    'stone': { name: 'Stone', category: 'resources', icon: 'fa-gem', color: '#757575', desc: 'Solid rock used for primitive tools and stone walls.' },
    'iron': { name: 'Metal Ore', category: 'resources', icon: 'fa-cube', color: '#90a4ae', desc: 'Raw ore that can be smelted into high-quality metal.' },
    'sulfur': { name: 'Sulfur Ore', category: 'resources', icon: 'fa-flask', color: '#ffeb3b', desc: 'Yellow crystalline substance used for gunpowder.' },
    'scrap': { name: 'Scrap', category: 'resources', icon: 'fa-nut-bolt', color: '#bcaae1', desc: 'Essential currency for tech progression.' },
    'hqm': { name: 'High Quality Metal', category: 'resources', icon: 'fa-diamond', color: '#fff', desc: 'Ultra-pure refined metal for advanced weapons.' },
    'cloth': { name: 'Cloth', category: 'resources', icon: 'fa-scroll', color: '#eee', desc: 'Fiber used for medical and clothing items.' },
    'fat': { name: 'Animal Fat', category: 'resources', icon: 'fa-oil-well', color: '#fef', desc: 'Raw fat used to make low grade fuel.' },
    'lgf': { name: 'Low Grade Fuel', category: 'resources', icon: 'fa-gas-pump', color: '#f00', desc: 'Highly flammable fuel for machines and torches.' },
    
    // Components
    'gear_comp': { name: 'Gears', category: 'items', icon: 'fa-gear', color: '#9e9e9e', desc: 'Mechanical parts for complex machines.' },
    'pipe': { name: 'Metal Pipe', category: 'items', icon: 'fa-water', color: '#b0bec5', desc: 'High grade metal pipe for weapons.' },
    'spring': { name: 'Spring', category: 'items', icon: 'fa-coil', color: '#cfd8dc', desc: 'Tension spring used in automatic weapons.' },
    
    // Tools
    'stone_hatchet': { name: 'Stone Hatchet', category: 'tools', icon: 'fa-axe', recipe: { wood: 200, stone: 100 }, desc: 'Crude tool for harvesting wood.' },
    'stone_pickaxe': { name: 'Stone Pickaxe', category: 'tools', icon: 'fa-hammer-war', recipe: { wood: 200, stone: 100 }, desc: 'Crude tool for mining stone.' },
    'axe': { name: 'Hatchet', category: 'tools', icon: 'fa-axe', recipe: { wood: 100, stone: 50 }, desc: 'A sharp tool for efficient wood harvesting.' },
    'pickaxe': { name: 'Pickaxe', category: 'tools', icon: 'fa-hammer-war', recipe: { wood: 50, stone: 100 }, desc: 'Heavy duty tool for mining rocks and minerals.' },
    'hammer': { name: 'Hammer', category: 'tools', icon: 'fa-hammer', recipe: { wood: 50, iron: 10 }, desc: 'Used for building and upgrading structures.' },
    'torch': { name: 'Torch', category: 'tools', icon: 'fa-fire', recipe: { wood: 50, lgf: 1 }, desc: 'Provides light in the dark. Can be used as a weapon.' },
    
    // Weapons
    'spear': { name: 'Wood Spear', category: 'weapons', icon: 'fa-pencil', recipe: { wood: 300 }, desc: 'Long range primitive melee weapon.' },
    'machete': { name: 'Machete', category: 'weapons', icon: 'fa-knife', recipe: { iron: 100 }, desc: 'Fast attacking melee weapon with high damage.' },
    'bow': { name: 'Hunting Bow', category: 'weapons', icon: 'fa-bow-arrow', recipe: { wood: 200, cloth: 50 }, desc: 'Silent ranged weapon for hunting and combat.' },
    'pistol': { name: 'Semi Pistol', category: 'weapons', icon: 'fa-gun', recipe: { iron: 100, pipe: 1 }, desc: 'A reliable handmade 9mm sidearm.' },
    'python': { name: 'Python Revolver', category: 'weapons', icon: 'fa-gun', recipe: { hqm: 10, pipe: 1, spring: 1 }, desc: 'Powerful .44 magnum revolver.' },
    'ak47': { name: 'Assault Rifle', category: 'weapons', icon: 'fa-jet-fighter', recipe: { hqm: 50, wood: 200, spring: 2, pipe: 1 }, desc: 'The most powerful automatic weapon.' },
    'smg': { name: 'Custom SMG', category: 'weapons', icon: 'fa-shield', recipe: { iron: 150, spring: 1 }, desc: 'Fast firing rate, great for close quarters.' },
    
    // Ammo
    'arrow': { name: 'Arrows', category: 'ammo', icon: 'fa-location-arrow', recipe: { wood: 10 }, desc: 'Ammo for the hunting bow.' },
    'pistol_ammo': { name: 'Pistol Bullets', category: 'ammo', icon: 'fa-circle', recipe: { iron: 5, sulfur: 5 }, desc: '9mm rounds for the semi-automatic pistol.' },
    'rifle_ammo': { name: 'Rifle Bullets', category: 'ammo', icon: 'fa-circle-dot', recipe: { iron: 10, sulfur: 10 }, desc: 'High velocity 5.56mm rounds.' },
    
    // Armor & Clothing
    'helmet': { name: 'Metal Helmet', category: 'clothing', icon: 'fa-hat-cowboy', recipe: { hqm: 15, sewing: 2 }, desc: 'Protects the head from projectile damage.' },
    'armor': { name: 'Metal Chestplate', category: 'clothing', icon: 'fa-shirt', recipe: { hqm: 25, leather: 10 }, desc: 'Heavy metal plate armor for maximum protection.' },
    'clothing': { name: 'Pants', category: 'clothing', icon: 'fa-socks', recipe: { cloth: 20 }, desc: 'Basic leg covering for warmth.' },
    'hazmat': { name: 'Hazmat Suit', category: 'clothing', icon: 'fa-user-ninja', recipe: { iron: 200, scrap: 50 }, desc: 'Full body protection from deadly radiation.' },
    
    // Building
    'foundation': { name: 'Foundation', category: 'construction', icon: 'fa-square', recipe: { wood: 200 }, desc: 'The starting point for any structure.' },
    'wall': { name: 'Wall', category: 'construction', icon: 'fa-border-all', recipe: { wood: 100 }, desc: 'Provides vertical protection and privacy.' },
    'door': { name: 'Wooden Door', category: 'construction', icon: 'fa-door-closed', recipe: { wood: 300 }, desc: 'Allows access while keeping others out.' },
    'lock': { name: 'Key Lock', category: 'construction', icon: 'fa-lock', recipe: { iron: 100 }, desc: 'Secure your doors from unwanted guests.' },
    'sleeping_bag': { name: 'Sleeping Bag', category: 'construction', icon: 'fa-bed', recipe: { cloth: 30 }, desc: 'Set your respawn point here.' },
    
    // Devices
    't1_wb': { name: 'Workbench T1', category: 'electrical', icon: 'fa-table', recipe: { wood: 500, iron: 100, scrap: 50 }, desc: 'Essential for crafting basic blueprints.' },
    'furnace': { name: 'Furnace', category: 'electrical', icon: 'fa-fire-burner', recipe: { stone: 200, wood: 50, lgf: 10 }, desc: 'Used for smelting raw ores into metals.' },
    'box': { name: 'Large Wood Box', category: 'items', icon: 'fa-box-open', recipe: { wood: 250 }, desc: 'Large capacity storage container.' },
    
    // Medical
    'syringe': { name: 'Medical Syringe', category: 'medical', icon: 'fa-syringe', recipe: { iron: 20, scrap: 5, cloth: 10 }, desc: 'Instant health restoration for emergencies.' },
    'bandage': { name: 'Bandage', category: 'medical', icon: 'fa-band-aid', recipe: { cloth: 2 }, desc: 'Stops bleeding and slowly restores health.' }
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
            if (inv.style.display === 'flex') {
                inv.style.display = 'none';
                pointerControls.lock();
            } else {
                inv.style.display = 'flex';
                pointerControls.unlock();
                initPlayerPreview();
                initCraftingUI();
            }
        }
    });

    function initCraftingUI() {
        // Categories
        const cats = document.querySelectorAll('.category-item');
        cats.forEach(c => {
            c.onclick = () => {
                cats.forEach(k => k.classList.remove('active'));
                c.classList.add('active');
                state.selectedCategory = c.dataset.category;
                renderCraftingGrid();
            };
        });

        // Search
        const search = document.getElementById('item-search');
        search.oninput = () => renderCraftingGrid();

        renderCraftingGrid();
        renderBelt();
    }

    function renderCraftingGrid() {
        const grid = document.getElementById('crafting-item-grid');
        const searchTerm = document.getElementById('item-search').value.toLowerCase();
        grid.innerHTML = '';

        Object.keys(ITEMS_DATA).forEach(id => {
            const item = ITEMS_DATA[id];
            if (!item.recipe) return; // Only show craftable items

            const matchCat = state.selectedCategory === 'common' || item.category === state.selectedCategory;
            const matchSearch = item.name.toLowerCase().includes(searchTerm);

            if (matchCat && matchSearch) {
                const slot = document.createElement('div');
                slot.className = 'craft-slot' + (state.selectedItem === id ? ' active' : '');
                slot.innerHTML = `
                    <i class="fas ${item.icon}"></i>
                    <span class="item-name-label">${item.name}</span>
                `;
                slot.onclick = () => {

                    state.selectedItem = id;
                    state.craftQty = 1;
                    renderCraftingGrid();
                    showCraftingDetail(id);
                };
                grid.appendChild(slot);
            }
        });
    }

    function showCraftingDetail(id) {
        const panel = document.getElementById('crafting-detail-panel');
        const item = ITEMS_DATA[id];

        let costHTML = '';
        let canCraft = true;

        Object.entries(item.recipe).forEach(([res, amt]) => {
            const needed = amt * state.craftQty;
            const have = getItemCount(res);
            const missing = have < needed;
            if (missing) canCraft = false;

            costHTML += `
                <div class="cost-item ${missing ? 'missing' : ''}">
                    <span>${needed}</span>
                    <span>${ITEMS_DATA[res].name}</span>
                    <span>${needed}</span>
                    <span>${have}</span>
                </div>
            `;
        });

        panel.innerHTML = `
            <div class="detail-header">
                <div class="detail-title">${item.name}</div>
                <div class="detail-subtitle">WORKBENCH LEVEL 1 REQUIRED</div>
            </div>
            <div class="detail-desc">${item.desc}</div>
            <div class="cost-list">
                <div class="cost-header">
                    <span>AMOUNT</span>
                    <span>ITEM TYPE</span>
                    <span>TOTAL</span>
                    <span>HAVE</span>
                </div>
                ${costHTML}
            </div>
            <div class="action-row">
                <div class="qty-control">
                    <div class="qty-btn" onclick="updateCraftQty(-1)">-</div>
                    <div class="qty-val">${state.craftQty}</div>
                    <div class="qty-btn" onclick="updateCraftQty(1)">+</div>
                </div>
                <button class="craft-btn" ${canCraft ? '' : 'disabled'} onclick="performCraft('${id}')">CRAFT</button>
            </div>
        `;
    }

    // Global exposed for onclick
    window.updateCraftQty = (val) => {
        state.craftQty = Math.max(1, state.craftQty + val);
        if (state.selectedItem) showCraftingDetail(state.selectedItem);
    };

    window.performCraft = (id) => {
        const item = ITEMS_DATA[id];
        for (let [res, amt] of Object.entries(item.recipe)) {
            const needed = amt * state.craftQty;
            const inventoryItem = state.inventory.find(i => i.id === res);
            if (inventoryItem) inventoryItem.count -= needed;
        }
        addItem(id, state.craftQty);
        updateHUD();
        showCraftingDetail(id); // Refresh view
    };

    function renderBelt() {
        const beltGrid = document.getElementById('belt-inventory-grid');
        beltGrid.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            // Placeholder logic for belt
            if (i === 0) slot.innerHTML = `<i class="fas fa-hand-fist"></i>`;
            if (i === 1) slot.innerHTML = `<i class="fas fa-axe"></i>`;
            beltGrid.appendChild(slot);
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
    pointerControls.addEventListener('lock', () => {
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('inventory').style.display = 'none';
    });

    pointerControls.addEventListener('unlock', () => {
        if (document.getElementById('inventory').style.display !== 'flex') {
            document.getElementById('instructions').style.display = 'flex';
        }
    });


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
