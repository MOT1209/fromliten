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
    // Resources (Natural)
    'wood': { name: 'Wood', category: 'resources', icon: 'fa-tree', color: '#8d6e63', rarity: 'common', desc: 'Harvested from trees. Used for base building and Fuel.' },
    'stone': { name: 'Stone', category: 'resources', icon: 'fa-gem', color: '#b0bec5', rarity: 'common', desc: 'Raw stone for primitive tools and base stabilization.' },
    'iron': { name: 'Metal Ore', category: 'resources', icon: 'fa-mountain', color: '#90a4ae', rarity: 'common', desc: 'Raw iron ore. Smelt this to get metal fragments.' },
    'sulfur': { name: 'Sulfur Ore', category: 'resources', icon: 'fa-flask', color: '#fff176', rarity: 'common', desc: 'Volatile ore used in explosives and gunpowder.' },
    'hqm': { name: 'High Quality Metal', category: 'resources', icon: 'fa-diamond', color: '#eceff1', rarity: 'elite', desc: 'Rare refined metal for modular weapons and armor.' },

    // Processed Resources
    'frag': { name: 'Metal Fragments', category: 'resources', icon: 'fa-cube', color: '#ef5350', rarity: 'rare', desc: 'Refined iron used for most mid-tier items.' },
    'lgf': { name: 'Low Grade Fuel', category: 'resources', icon: 'fa-gas-pump', color: '#e53935', rarity: 'common', desc: 'Tallow and cloth mix. Powering your survival.' },
    'cloth': { name: 'Cloth', category: 'resources', icon: 'fa-scroll', color: '#f5f5f5', rarity: 'common', desc: 'Fibers from hemp plants. Used for clothing and meds.' },
    'leather': { name: 'Leather', category: 'resources', icon: 'fa-hide', color: '#795548', rarity: 'rare', desc: 'High-durability animal skin.' },

    // Components
    'scrap': { name: 'Scrap', category: 'items', icon: 'fa-nut-bolt', color: '#d1c4e9', rarity: 'rare', desc: 'Essential material for unlocking higher technology.' },
    'gear_comp': { name: 'Gears', category: 'items', icon: 'fa-gear', color: '#bdbdbd', rarity: 'rare', desc: 'Rusty mechanical parts for machinery.' },
    'pipe': { name: 'Metal Pipe', category: 'items', icon: 'fa-water', color: '#90a4ae', rarity: 'rare', desc: 'Sturdy pipe used for firearms barrels.' },
    'spring': { name: 'Spring', category: 'items', icon: 'fa-coil', color: '#cfd8dc', rarity: 'rare', desc: 'Tension spring for automatic weapons.' },
    'sewing': { name: 'Sewing Kit', category: 'items', icon: 'fa-needle', color: '#bdbdbd', rarity: 'common', desc: 'Required for advanced clothing.' },

    // Tools (Survival)
    'stone_hatchet': { name: 'Stone Hatchet', category: 'tools', icon: 'fa-axe', color: '#bcaae1', rarity: 'common', recipe: { wood: 200, stone: 100 }, desc: 'Primitive tool for wood harvesting.' },
    'stone_pickaxe': { name: 'Stone Pickaxe', category: 'tools', icon: 'fa-hammer-war', color: '#bcaae1', rarity: 'common', recipe: { wood: 200, stone: 100 }, desc: 'Slow but effective for basic mining.' },
    'hammer': { name: 'Building Hammer', category: 'tools', icon: 'fa-hammer', color: '#1e88e5', rarity: 'common', recipe: { wood: 100 }, desc: 'Construct and upgrade your base.' },
    'torch': { name: 'Torch', category: 'tools', icon: 'fa-fire', color: '#fb8c00', rarity: 'common', recipe: { wood: 50, lgf: 1 }, desc: 'Provides light and subtle heat.' },

    // Weapons (Defense)
    'spear': { name: 'Wooden Spear', category: 'weapons', icon: 'fa-pencil', color: '#8d6e63', rarity: 'common', recipe: { wood: 300 }, desc: 'Cheap long-range melee option.' },
    'machete': { name: 'Machete', category: 'weapons', icon: 'fa-knife', color: '#90a4ae', rarity: 'rare', recipe: { iron: 100 }, desc: 'Standard industrial blade.' },
    'bow': { name: 'Hunting Bow', category: 'weapons', icon: 'fa-bow-arrow', color: '#8d6e63', rarity: 'common', recipe: { wood: 200, cloth: 50 }, desc: 'Silent and deadly ranged tool.' },
    'pistol': { name: 'Semi-Pistol', category: 'weapons', icon: 'fa-gun', color: '#546e7a', rarity: 'rare', recipe: { iron: 150, pipe: 1 }, desc: 'P250 clone. Fast firing sidearm.' },
    'ak47': { name: 'Assault Rifle', category: 'weapons', icon: 'fa-jet-fighter', color: '#6d4c41', rarity: 'elite', recipe: { hqm: 50, wood: 200, spring: 2, pipe: 1 }, desc: 'The king of Rust weapons. High recoil, high reward.' },

    // Construction
    'foundation': { name: 'Foundation', category: 'construction', icon: 'fa-square', color: '#8d6e63', rarity: 'common', recipe: { wood: 200 }, desc: 'The heart of your sanctuary.' },
    'wall': { name: 'Wall', category: 'construction', icon: 'fa-border-all', color: '#8d6e63', rarity: 'common', recipe: { wood: 100 }, desc: 'Standard structural blockade.' },
    'door': { name: 'Wood Door', category: 'construction', icon: 'fa-door-closed', color: '#8d6e63', rarity: 'common', recipe: { wood: 300 }, desc: 'Access point with minimal security.' },
    'lock': { name: 'Key Lock', category: 'construction', icon: 'fa-lock', color: '#546e7a', rarity: 'common', recipe: { iron: 100 }, desc: 'Basic protection for your base.' },

    // Medical
    'bandage': { name: 'Bandage', category: 'medical', icon: 'fa-band-aid', color: '#e57373', rarity: 'common', recipe: { cloth: 2 }, desc: 'Stops bleeding immediately.' },
    'syringe': { name: 'Medical Syringe', category: 'medical', icon: 'fa-syringe', color: '#ef5350', rarity: 'rare', recipe: { iron: 20, scrap: 5, cloth: 10 }, desc: 'Instant adrenaline-boosted recovery.' }
};






let playerMesh;



const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// ==================== CORE FUNCTIONS ====================
function getTerrainHeight(x, z) {
    return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.5;
}

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

function updateHUD() {
    const woodSpan = document.getElementById('wood-count');
    const stoneSpan = document.getElementById('stone-count');
    const ironSpan = document.getElementById('iron-count');

    if (woodSpan) woodSpan.innerText = getItemCount('wood');
    if (stoneSpan) stoneSpan.innerText = getItemCount('stone');
    if (ironSpan) ironSpan.innerText = getItemCount('iron');

    const healthFill = document.getElementById('health-fill');
    const hungerFill = document.getElementById('hunger-fill');
    if (healthFill) healthFill.style.width = state.stats.health + '%';
    if (hungerFill) hungerFill.style.width = state.stats.hunger + '%';
}

function createPlayer(scene) {
    const group = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x8b322c }));
    torso.position.y = 1.25;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.85;
    head.castShadow = true;
    group.add(head);

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

// ==================== ENGINE START ====================
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
    playerMesh = createPlayer(scene);

    // Light
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    // World Detail
    const groundGeo = new THREE.PlaneGeometry(CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE, 60, 60);
    groundGeo.rotateX(-Math.PI / 2);
    const groundPos = groundGeo.attributes.position;
    for (let i = 0; i < groundPos.count; i++) {
        const x = groundPos.getX(i);
        const z = groundPos.getZ(i);
        groundPos.setY(i, getTerrainHeight(x, z));
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x3d5c2e, roughness: 1.0, metalness: 0.0 }));
    ground.receiveShadow = true;
    scene.add(ground);

    const interactables = [];
    const collisionObjects = [];

    // Realistic Procedural Trees
    for (let i = 0; i < CONFIG.TREE_COUNT; i++) {
        const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const y = getTerrainHeight(x, z);
        
        const tree = new THREE.Group();
        // Trunk
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.4, 3, 8),
            new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 })
        );
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        tree.add(trunk);

        // Leaves in clusters
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });
        for(let j=0; j<3; j++) {
            const cluster = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 - j*0.2, 1), leafMat);
            cluster.position.y = 2.5 + j*0.8;
            cluster.position.x = (Math.random()-0.5)*0.5;
            cluster.position.z = (Math.random()-0.5)*0.5;
            cluster.castShadow = true;
            tree.add(cluster);
        }

        tree.position.set(x, y, z);
        tree.userData = { type: 'tree', health: 4, radius: 0.5 };
        scene.add(tree);
        interactables.push(tree);
        collisionObjects.push(tree);
    }

    // Realistic Rocks
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x757575, roughness: 1.0 });
    const sulfurMat = new THREE.MeshStandardMaterial({ color: 0xfdd835, roughness: 0.9, emissive: 0x444400, emissiveIntensity: 0.1 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.4, roughness: 0.7 });

    for (let i = 0; i < CONFIG.ROCK_COUNT + CONFIG.SULFUR_COUNT; i++) {
        const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
        const isSulfur = i >= CONFIG.ROCK_COUNT;
        const isIron = !isSulfur && Math.random() > 0.7;
        
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(1.2, 0),
            isSulfur ? sulfurMat : (isIron ? ironMat : rockMat)
        );
        const y = getTerrainHeight(x, z);
        rock.position.set(x, y + 0.3, z);
        const scale = 0.6 + Math.random();
        rock.scale.set(scale, scale * 0.8, scale);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        rock.userData = { type: isSulfur ? 'sulfur' : (isIron ? 'iron' : 'rock'), health: 5, radius: scale };
        scene.add(rock);
        interactables.push(rock);
        collisionObjects.push(rock);
    }

    // Industrial Barrels
    const barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x0277bd, metalness: 0.6, roughness: 0.4 });
    for (let i = 0; i < CONFIG.BARREL_COUNT; i++) {
        const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 60);
        const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 60);
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(x, getTerrainHeight(x, z) + 0.6, z);
        barrel.castShadow = true;
        barrel.userData = { type: 'barrel', health: 3, radius: 0.5 };
        scene.add(barrel);
        interactables.push(barrel);
        collisionObjects.push(barrel);
    }

    // Ghost/Building
    const buildGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const ghost = new THREE.Mesh(buildGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.4 }));
    ghost.visible = false;
    scene.add(ghost);
    const builtObjects = [];


    // Animation & Logic Functions
    function updateGhost() {
        if (!state.buildMode) { ghost.visible = false; return; }
        const r = new THREE.Raycaster();
        r.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hit = r.intersectObjects([ground, ...builtObjects]);
        if (hit.length > 0 && hit[0].distance < CONFIG.BUILD_DISTANCE) {
            const p = hit[0].point; const n = hit[0].face.normal;
            ghost.position.set(Math.round(p.x + n.x * 0.5), Math.round(p.y + n.y * 0.5), Math.round(p.z + n.z * 0.5));
            ghost.visible = true;
            ghost.material.color.setHex(getItemCount('wood') >= 10 ? 0x00ff00 : 0xff0000);
        } else { ghost.visible = false; }
    }

    function checkCollisions(newPos) {
        for (let obj of [...collisionObjects, ...builtObjects]) {
            const dx = newPos.x - obj.position.x;
            const dz = newPos.z - obj.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            const minDistance = CONFIG.PLAYER_RADIUS + (obj.userData.radius || 0.5);
            if (distance < minDistance) {
                const angle = Math.atan2(dz, dx);
                newPos.x = obj.position.x + Math.cos(angle) * minDistance;
                newPos.z = obj.position.z + Math.sin(angle) * minDistance;
                return true;
            }
        }
        return false;
    }

    const raycaster = new THREE.Raycaster();
    function performAction() {
        if (state.buildMode) {
            if (ghost.visible && getItemCount('wood') >= 10) {
                const b = new THREE.Mesh(buildGeo, new THREE.MeshStandardMaterial({ color: 0x6e4b2e }));
                b.position.copy(ghost.position); b.castShadow = true; b.receiveShadow = true; scene.add(b); builtObjects.push(b);
                const wood = state.inventory.find(i => i.id === 'wood'); if (wood) wood.count -= 10;
                updateHUD();
            }
            return;
        }
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hits = raycaster.intersectObjects(interactables, true);
        if (hits.length > 0 && hits[0].distance < CONFIG.INTERACT_DISTANCE) {
            let obj = hits[0].object; while (obj.parent !== scene) obj = obj.parent;
            obj.userData.health -= 1; obj.position.x += 0.05; setTimeout(() => obj.position.x -= 0.05, 50);
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
            if (obj.userData.health <= 0) { scene.remove(obj); interactables.splice(interactables.indexOf(obj), 1); collisionObjects.splice(collisionObjects.indexOf(obj), 1); }
            updateHUD();
        }
    }

    // UI Logic
    function renderCraftingGrid() {
        const grid = document.getElementById('crafting-item-grid');
        const searchTerm = document.getElementById('item-search')?.value.toLowerCase() || "";
        if (!grid) return;
        grid.innerHTML = '';
        Object.keys(ITEMS_DATA).forEach(id => {
            const item = ITEMS_DATA[id];
            if (!item.recipe) return;
            const matchCat = state.selectedCategory === 'common' || item.category === state.selectedCategory;
            const matchSearch = item.name.toLowerCase().includes(searchTerm);
            if (matchCat && matchSearch) {
                const slot = document.createElement('div');
                slot.className = `craft-slot rarity-${item.rarity || 'common'}${state.selectedItem === id ? ' active' : ''}`;
                slot.innerHTML = `<i class="fas ${item.icon}" style="color:${item.color}"></i><span class="item-name-label">${item.name}</span>`;
                slot.onclick = () => { state.selectedItem = id; state.craftQty = 1; renderCraftingGrid(); showCraftingDetail(id); };
                grid.appendChild(slot);
            }
        });
    }

    function showCraftingDetail(id) {
        const panel = document.getElementById('crafting-detail-panel');
        const item = ITEMS_DATA[id];
        if (!panel || !item) return;
        let costHTML = ''; let canCraft = true;
        Object.entries(item.recipe).forEach(([res, amt]) => {
            const needed = amt * state.craftQty; const have = getItemCount(res); const missing = have < needed;
            if (missing) canCraft = false;
            costHTML += `<div class="cost-item ${missing ? 'missing' : ''}"><span>${needed}</span><span>${ITEMS_DATA[res]?.name || res}</span><span>${needed}</span><span>${have}</span></div>`;
        });
        panel.innerHTML = `
            <div class="detail-header"><div class="detail-title">${item.name}</div><div class="detail-subtitle">WORKBENCH REQUIRED</div></div>
            <div class="detail-desc">${item.desc}</div>
            <div class="cost-list"><div class="cost-header"><span>AMT</span><span>ITEM</span><span>TOTAL</span><span>HAVE</span></div>${costHTML}</div>
            <div class="action-row">
                <div class="qty-control"><div class="qty-btn" onclick="updateCraftQty(-1)">-</div><div class="qty-val">${state.craftQty}</div><div class="qty-btn" onclick="updateCraftQty(1)">+</div></div>
                <button class="craft-btn" ${canCraft ? '' : 'disabled'} onclick="performCraft('${id}')">CRAFT</button>
            </div>`;
    }

    function initInventoryTabs() {
        const tabs = document.querySelectorAll('.tab-item');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tab;
                const cPane = document.getElementById('crafting-pane');
                const iPane = document.getElementById('inventory-pane');
                if (cPane) cPane.classList.toggle('active', target === 'crafting');
                if (iPane) iPane.classList.toggle('active', target === 'inventory');
                if (target === 'inventory') renderInventoryGrid();
                else renderCraftingGrid();
                initPlayerPreview();
            };
        });

        const cats = document.querySelectorAll('.category-item');
        cats.forEach(c => {
            c.onclick = () => {
                cats.forEach(k => k.classList.remove('active'));
                c.classList.add('active');
                state.selectedCategory = c.dataset.category;
                renderCraftingGrid();
            };
        });

        const search = document.getElementById('item-search');
        if (search) search.oninput = () => renderCraftingGrid();
    }

    function renderInventoryGrid() {
        const grid = document.getElementById('player-inventory-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 0; i < 30; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-grid-slot';
            const item = state.inventory[i];
            if (item && item.count > 0) {
                const data = ITEMS_DATA[item.id];
                if (data) {
                    slot.classList.add(`rarity-${data.rarity || 'common'}`);
                    slot.innerHTML = `<i class="fas ${data.icon}" style="color:${data.color}; font-size: 1.2rem;"></i><span style="position:absolute;bottom:2px;right:4px;font-size:0.65rem;font-weight:900;color:#fff;">${item.count}</span>`;
                }
            }
            grid.appendChild(slot);
        }
    }

    window.updateCraftQty = (val) => { state.craftQty = Math.max(1, state.craftQty + val); if (state.selectedItem) showCraftingDetail(state.selectedItem); };
    window.performCraft = (id) => {
        const item = ITEMS_DATA[id];
        for (let [res, amt] of Object.entries(item.recipe)) {
            const needed = amt * state.craftQty;
            const invItem = state.inventory.find(i => i.id === res);
            if (invItem) invItem.count -= needed;
        }
        addItem(id, state.craftQty); updateHUD(); showCraftingDetail(id);
    };

    function renderBelt() {
        const beltGrid = document.getElementById('belt-inventory-grid');
        if (!beltGrid) return;
        beltGrid.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const slot = document.createElement('div'); slot.className = 'inv-slot';
            if (i === 0) slot.innerHTML = `<i class="fas fa-hand-fist"></i>`;
            if (i === 1) slot.innerHTML = `<i class="fas fa-axe"></i>`;
            beltGrid.appendChild(slot);
        }
    }


    // Input Listeners
    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT') return;
        if (e.code === 'KeyW') state.controls.forward = true;
        if (e.code === 'KeyS') state.controls.backward = true;
        if (e.code === 'KeyA') state.controls.left = true;
        if (e.code === 'KeyD') state.controls.right = true;
        if (e.code === 'Space' && state.controls.canJump) { velocity.y += CONFIG.JUMP_FORCE; state.controls.canJump = false; }
        if (e.code === 'KeyV') { state.viewMode = state.viewMode === 'first' ? 'third' : 'first'; if (playerMesh) playerMesh.visible = (state.viewMode === 'third'); }
        if (e.code === 'KeyE' || e.code === 'Escape') {
            const inv = document.getElementById('inventory');
            if (inv.style.display === 'flex') { inv.style.display = 'none'; pointerControls.lock(); }
            else {
                inv.style.display = 'flex';
                pointerControls.unlock();
                renderCraftingGrid();
                renderInventoryGrid();
                renderBelt();
                initPlayerPreview();
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
        if (e.button === 2) { state.buildMode = !state.buildMode; const hint = document.getElementById('build-mode-hint'); if (hint) hint.style.display = state.buildMode ? 'block' : 'none'; }
    });

    const startBtn = document.getElementById('start-button');
    if (startBtn) startBtn.onclick = () => pointerControls.lock();
    pointerControls.addEventListener('lock', () => {
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('inventory').style.display = 'none';
    });
    pointerControls.addEventListener('unlock', () => {
        if (document.getElementById('inventory').style.display !== 'flex') {
            document.getElementById('instructions').style.display = 'flex';
        }
    });

    // Main Loop
    let lastTime = performance.now();
    function animate() {
        requestAnimationFrame(animate);
        const time = performance.now();
        const delta = Math.min((time - lastTime) / 1000, 0.1); // Cap delta

        if (pointerControls.isLocked) {
            velocity.x -= velocity.x * CONFIG.FRICTION * delta;
            velocity.z -= velocity.z * CONFIG.FRICTION * delta;
            velocity.y -= CONFIG.GRAVITY * delta;
            direction.z = Number(state.controls.forward) - Number(state.controls.backward);
            direction.x = Number(state.controls.right) - Number(state.controls.left);
            direction.normalize();
            if (state.controls.forward || state.controls.backward) velocity.z -= direction.z * CONFIG.PLAYER_SPEED * delta;
            if (state.controls.left || state.controls.right) velocity.x -= direction.x * CONFIG.PLAYER_SPEED * delta;
            pointerControls.moveRight(-velocity.x * delta);
            pointerControls.moveForward(-velocity.z * delta);
            const collisionPoint = { x: camera.position.x, z: camera.position.z };
            checkCollisions(collisionPoint);
            camera.position.x = collisionPoint.x; camera.position.z = collisionPoint.z;
            camera.position.y += (velocity.y * delta);
            const groundY = getTerrainHeight(camera.position.x, camera.position.z) + 1.6;
            if (camera.position.y < groundY) { velocity.y = 0; camera.position.y = groundY; state.controls.canJump = true; }
            if (playerMesh) {
                playerMesh.position.set(camera.position.x, camera.position.y - 1.6, camera.position.z);
                const playerRot = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
                playerMesh.rotation.y = playerRot.y + Math.PI;
            }
            updateGhost();
        }
        const originalCamPos = camera.position.clone();
        if (state.viewMode === 'third') {
            const offset = new THREE.Vector3(0, 1.5, 4).applyQuaternion(camera.quaternion);
            camera.position.add(offset);
        }
        renderer.render(scene, camera);
        camera.position.copy(originalCamPos);
        lastTime = time;
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
    initInventoryTabs();
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if (loader) loader.style.display = 'none';
        updateHUD();
    }, 1500);

} catch (err) {
    console.error("Critical Failure:", err);
    const loader = document.getElementById('loading-screen');
    if (loader) loader.style.display = 'none';
    alert("Game Crash: " + err.message);
}

// ==================== INVENTORY 3D PREVIEW ====================
let previewRenderer, previewScene, previewCamera, previewPlayer;

function initPlayerPreview() {
    const container = document.getElementById('player-3d-preview');
    if (!container) return;
    container.innerHTML = '';
    previewScene = new THREE.Scene();
    previewCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    previewCamera.position.set(0, 1.2, 3.5);
    previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    previewRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(previewRenderer.domElement);
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    previewScene.add(ambient);
    previewPlayer = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x8b322c }));
    torso.position.y = 1.25; previewPlayer.add(torso);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.85; previewPlayer.add(head);
    previewScene.add(previewPlayer);
    function animatePreview() {
        if (document.getElementById('inventory').style.display === 'none') return;
        requestAnimationFrame(animatePreview);
        previewPlayer.rotation.y += 0.01;
        previewRenderer.render(previewScene, previewCamera);
    }
    animatePreview();
}



