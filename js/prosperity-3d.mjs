import * as THREE from './vendor/three.module.min.mjs';
import * as CANNON from './vendor/cannon-es.mjs';

export const EARTH_GRAVITY = Object.freeze({ x: 0, y: -9.82, z: 0 });

const METALS = Object.freeze([
    { name: 'gold', color: 0xffc83d, edge: 0xffe9a6, roughness: 0.2, density: 1.0 },
    { name: 'silver', color: 0xdde6ee, edge: 0xffffff, roughness: 0.16, density: 0.82 },
    { name: 'copper', color: 0xc66b38, edge: 0xffbd83, roughness: 0.24, density: 0.9 },
    { name: 'platinum', color: 0xc8d2dc, edge: 0xf6fbff, roughness: 0.12, density: 1.12 },
]);

const GEMS = Object.freeze([
    { name: 'diamond', color: 0xf4fbff, attenuation: 0xdff7ff, ior: 2.42 },
    { name: 'ruby', color: 0xff164f, attenuation: 0x98001e, ior: 1.77 },
    { name: 'emerald', color: 0x18d783, attenuation: 0x006c43, ior: 1.58 },
    { name: 'sapphire', color: 0x2374ff, attenuation: 0x052c91, ior: 1.77 },
    { name: 'amethyst', color: 0xa85cff, attenuation: 0x57228f, ior: 1.54 },
    { name: 'topaz', color: 0xffa52e, attenuation: 0xa84a00, ior: 1.62 },
]);

const EXPERIENCE_BY_CONTAINER = new WeakMap();
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function getResponsiveProsperityConfig(width, height, pixelRatio = 1) {
    const shortestSide = Math.max(280, Math.min(width, height));
    const targetPiecePixels = clamp(shortestSide * 0.064, 24, 54);
    const performanceTier = shortestSide < 520 ? 'mobile' : shortestSide < 900 ? 'tablet' : 'desktop';
    const maxBodies = performanceTier === 'mobile' ? 36 : performanceTier === 'tablet' ? 48 : 64;
    const showerSize = performanceTier === 'mobile' ? 22 : performanceTier === 'tablet' ? 27 : 32;

    return Object.freeze({
        width,
        height,
        pixelRatio: Math.min(pixelRatio, performanceTier === 'mobile' ? 1.5 : 2),
        targetPiecePixels,
        maxBodies,
        showerSize,
        performanceTier,
    });
}

export function getShowerPieceCount(dayCount, responsiveConfig) {
    const celebrationScale = Math.round(Math.log2(Math.max(2, dayCount + 1)) * 2.5);
    return clamp(celebrationScale, 16, responsiveConfig.showerSize);
}

function createEnvironment(renderer) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#16273b');
    gradient.addColorStop(0.28, '#fff7df');
    gradient.addColorStop(0.52, '#6e91b7');
    gradient.addColorStop(0.76, '#ffe3a1');
    gradient.addColorStop(1, '#152438');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(255,255,255,0.92)';
    context.fillRect(90, 35, 44, 430);
    context.fillRect(710, 65, 110, 365);
    context.fillStyle = 'rgba(255,205,115,0.7)';
    context.fillRect(415, 25, 30, 460);

    const source = new THREE.CanvasTexture(canvas);
    source.mapping = THREE.EquirectangularReflectionMapping;
    source.colorSpace = THREE.SRGBColorSpace;
    const generator = new THREE.PMREMGenerator(renderer);
    const environment = generator.fromEquirectangular(source).texture;
    generator.dispose();
    source.dispose();
    return environment;
}

function createCoinFaceTextures(baseColor, highlightColor) {
    const canvas = document.createElement('canvas');
    const reliefCanvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    reliefCanvas.width = 256;
    reliefCanvas.height = 256;
    const context = canvas.getContext('2d');
    const relief = reliefCanvas.getContext('2d');
    const gradient = context.createRadialGradient(92, 72, 12, 128, 128, 126);
    gradient.addColorStop(0, highlightColor);
    gradient.addColorStop(0.38, baseColor);
    gradient.addColorStop(0.72, baseColor);
    gradient.addColorStop(1, '#5a421d');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    context.strokeStyle = 'rgba(255,255,255,0.55)';
    context.lineWidth = 8;
    context.beginPath();
    context.arc(128, 128, 104, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = 'rgba(45,30,12,0.72)';
    context.font = 'bold 112px Georgia, serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('₹', 128, 135);

    relief.fillStyle = '#181818';
    relief.fillRect(0, 0, 256, 256);
    relief.strokeStyle = '#f2f2f2';
    relief.lineWidth = 10;
    relief.beginPath();
    relief.arc(128, 128, 104, 0, Math.PI * 2);
    relief.stroke();
    relief.fillStyle = '#ededed';
    relief.font = 'bold 112px Georgia, serif';
    relief.textAlign = 'center';
    relief.textBaseline = 'middle';
    relief.fillText('₹', 128, 135);

    const colorTexture = new THREE.CanvasTexture(canvas);
    colorTexture.colorSpace = THREE.SRGBColorSpace;
    colorTexture.anisotropy = 4;
    const bumpTexture = new THREE.CanvasTexture(reliefCanvas);
    bumpTexture.anisotropy = 4;
    return { colorTexture, bumpTexture };
}

function createDiamondGeometry(radius) {
    const positions = [];
    const indices = [];
    const segments = 8;
    const tableY = radius * 0.62;
    const upperY = radius * 0.16;
    const lowerY = radius * 0.02;
    const tableRadius = radius * 0.34;
    const girdleRadius = radius * 0.72;

    for (let ring = 0; ring < 3; ring += 1) {
        const ringRadius = ring === 0 ? tableRadius : girdleRadius;
        const y = ring === 0 ? tableY : ring === 1 ? upperY : lowerY;
        for (let index = 0; index < segments; index += 1) {
            const angle = (index / segments) * Math.PI * 2 + Math.PI / 8;
            positions.push(Math.cos(angle) * ringRadius, y, Math.sin(angle) * ringRadius);
        }
    }

    const bottomIndex = positions.length / 3;
    positions.push(0, -radius * 0.86, 0);
    const topIndex = positions.length / 3;
    positions.push(0, tableY, 0);

    for (let index = 0; index < segments; index += 1) {
        const next = (index + 1) % segments;
        const table = index;
        const tableNext = next;
        const upper = segments + index;
        const upperNext = segments + next;
        const lower = segments * 2 + index;
        const lowerNext = segments * 2 + next;
        indices.push(topIndex, tableNext, table);
        indices.push(table, tableNext, upperNext, table, upperNext, upper);
        indices.push(upper, upperNext, lowerNext, upper, lowerNext, lower);
        indices.push(bottomIndex, lower, lowerNext);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

class ProsperityExperience {
    constructor(container) {
        this.container = container;
        this.entries = [];
        this.pieceSequence = 0;
        this.coinSequence = 0;
        this.gemSequence = 0;
        this.boundaryBodies = [];
        this.frameId = null;
        this.lastFrameTime = 0;
        this.settleDeadline = 0;
        this.spawnTimers = new Set();
        this.config = getResponsiveProsperityConfig(
            window.innerWidth,
            window.innerHeight,
            window.devicePixelRatio || 1,
        );

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: this.config.performanceTier !== 'mobile' });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setPixelRatio(this.config.pixelRatio);
        this.renderer.setSize(this.config.width, this.config.height, false);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.18;
        this.renderer.shadowMap.enabled = this.config.performanceTier !== 'mobile';
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.domElement.className = 'prosperity-canvas';
        this.renderer.domElement.setAttribute('aria-hidden', 'true');
        this.renderer.domElement.dataset.physics = 'earth-gravity';
        this.container.replaceChildren(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.environment = createEnvironment(this.renderer);
        this.camera = new THREE.PerspectiveCamera(42, this.config.width / this.config.height, 0.1, 80);
        this.camera.position.set(0, 1.35, 18);
        this.camera.lookAt(0, -1.15, 0);

        this.scene.add(new THREE.HemisphereLight(0xfff7e5, 0x18324d, 2.1));
        const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
        keyLight.position.set(-6, 10, 9);
        keyLight.castShadow = this.config.performanceTier !== 'mobile';
        this.scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(0xffc767, 3.0);
        rimLight.position.set(7, 5, -4);
        this.scene.add(rimLight);
        const sparkleLight = new THREE.PointLight(0xb9ddff, 18, 28, 2);
        sparkleLight.position.set(0, 4, 7);
        this.scene.add(sparkleLight);

        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(EARTH_GRAVITY.x, EARTH_GRAVITY.y, EARTH_GRAVITY.z),
            allowSleep: true,
        });
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 12;
        this.pieceMaterial = new CANNON.Material('prosperity-piece');
        this.boundaryMaterial = new CANNON.Material('prosperity-boundary');
        this.rampMaterial = new CANNON.Material('prosperity-ramp');
        this.world.addContactMaterial(new CANNON.ContactMaterial(this.pieceMaterial, this.boundaryMaterial, {
            friction: 0.58,
            restitution: 0.16,
        }));
        this.world.addContactMaterial(new CANNON.ContactMaterial(this.pieceMaterial, this.pieceMaterial, {
            friction: 0.48,
            restitution: 0.12,
        }));
        this.world.addContactMaterial(new CANNON.ContactMaterial(this.pieceMaterial, this.rampMaterial, {
            friction: 0.07,
            restitution: 0.08,
        }));

        this.coinResources = new Map();
        this.gemResources = new Map();
        this.updateViewport(true);
        this.resizeHandler = () => this.updateViewport(false);
        window.addEventListener('resize', this.resizeHandler, { passive: true });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAnimation();
            } else if (this.entries.some(({ body }) => body.sleepState !== CANNON.Body.SLEEPING)) {
                this.startAnimation();
            }
        });
    }

    updateViewport(initial) {
        const previous = this.config;
        this.config = getResponsiveProsperityConfig(
            window.innerWidth,
            window.innerHeight,
            window.devicePixelRatio || 1,
        );
        this.renderer.setPixelRatio(this.config.pixelRatio);
        this.renderer.setSize(this.config.width, this.config.height, false);
        this.camera.aspect = this.config.width / this.config.height;
        this.camera.updateProjectionMatrix();

        const cameraDistance = this.camera.position.z;
        this.visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * cameraDistance;
        this.visibleWidth = this.visibleHeight * this.camera.aspect;
        this.worldUnitsPerPixel = this.visibleHeight / this.config.height;
        this.pieceRadius = this.config.targetPiecePixels * this.worldUnitsPerPixel;
        this.floorY = -this.visibleHeight * 0.5 + this.pieceRadius * 0.45;
        this.depthLimit = clamp(this.visibleWidth * 0.12, 1.7, 3.2);
        this.renderer.domElement.dataset.performanceTier = this.config.performanceTier;
        this.renderer.domElement.dataset.targetPiecePixels = this.config.targetPiecePixels.toFixed(2);
        this.renderer.domElement.dataset.maxBodies = String(this.config.maxBodies);
        this.createBoundaries();

        const meaningfulResize = !initial && (
            Math.abs(previous.width - this.config.width) / Math.max(previous.width, 1) > 0.15
            || Math.abs(previous.height - this.config.height) / Math.max(previous.height, 1) > 0.15
        );
        if (meaningfulResize) {
            this.clearPieces();
            this.disposePieceResources();
        }
        this.render();
    }

    createBoundaries() {
        this.boundaryBodies.forEach((body) => this.world.removeBody(body));
        this.boundaryBodies = [];

        const addBox = (halfExtents, position, rotationZ = 0, material = this.boundaryMaterial) => {
            const body = new CANNON.Body({ mass: 0, material });
            body.addShape(new CANNON.Box(new CANNON.Vec3(...halfExtents)));
            body.position.set(...position);
            body.quaternion.setFromEuler(0, 0, rotationZ);
            this.world.addBody(body);
            this.boundaryBodies.push(body);
        };

        addBox([this.visibleWidth, 0.12, this.depthLimit * 2], [0, this.floorY - 0.12, 0]);
        addBox([0.12, this.visibleHeight, this.depthLimit * 2], [-this.visibleWidth * 0.5 - 0.12, 0, 0]);
        addBox([0.12, this.visibleHeight, this.depthLimit * 2], [this.visibleWidth * 0.5 + 0.12, 0, 0]);
        addBox([this.visibleWidth, this.visibleHeight, 0.12], [0, 0, -this.depthLimit - 0.12]);
        addBox([this.visibleWidth, this.visibleHeight, 0.12], [0, 0, this.depthLimit + 0.12]);

        const basinHalfWidth = Math.min(this.visibleWidth * 0.16, 3.4);
        const rampHalfLength = Math.max((this.visibleWidth * 0.5 - basinHalfWidth) * 0.5, 0.2);
        const rampAngle = 0.27;
        const rampY = this.floorY + Math.sin(rampAngle) * rampHalfLength;
        addBox(
            [rampHalfLength, 0.1, this.depthLimit * 1.05],
            [-basinHalfWidth - rampHalfLength, rampY, 0],
            -rampAngle,
            this.rampMaterial,
        );
        addBox(
            [rampHalfLength, 0.1, this.depthLimit * 1.05],
            [basinHalfWidth + rampHalfLength, rampY, 0],
            rampAngle,
            this.rampMaterial,
        );

        if (this.shadowFloor) {
            this.scene.remove(this.shadowFloor);
            this.shadowFloor.geometry.dispose();
            this.shadowFloor.material.dispose();
        }
        this.shadowFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(this.visibleWidth * 1.2, this.depthLimit * 2.4),
            new THREE.ShadowMaterial({ color: 0x3b2a12, opacity: 0.18, transparent: true }),
        );
        this.shadowFloor.rotation.x = -Math.PI / 2;
        this.shadowFloor.position.y = this.floorY;
        this.shadowFloor.receiveShadow = true;
        this.scene.add(this.shadowFloor);
    }

    getCoinResources(metal) {
        if (this.coinResources.has(metal.name)) {
            return this.coinResources.get(metal.name);
        }
        const radius = this.pieceRadius;
        const thickness = radius * 0.24;
        const { colorTexture, bumpTexture } = createCoinFaceTextures(
            `#${metal.color.toString(16).padStart(6, '0')}`,
            `#${metal.edge.toString(16).padStart(6, '0')}`,
        );
        const sideMaterial = new THREE.MeshPhysicalMaterial({
            color: metal.color,
            metalness: 1,
            roughness: metal.roughness + 0.08,
            envMapIntensity: 1.5,
        });
        const faceMaterial = new THREE.MeshPhysicalMaterial({
            color: metal.color,
            map: colorTexture,
            bumpMap: bumpTexture,
            bumpScale: radius * 0.045,
            metalness: 0.88,
            roughness: metal.roughness,
            clearcoat: 0.35,
            clearcoatRoughness: 0.12,
            envMapIntensity: 1.75,
        });
        const rimMaterial = new THREE.MeshPhysicalMaterial({
            color: metal.edge,
            metalness: 1,
            roughness: 0.13,
            envMapIntensity: 2,
        });
        const resources = {
            radius,
            thickness,
            geometry: new THREE.CylinderGeometry(radius, radius, thickness, 36, 2),
            rimGeometry: new THREE.TorusGeometry(radius * 0.86, radius * 0.055, 8, 36),
            materials: [sideMaterial, faceMaterial, faceMaterial],
            rimMaterial,
        };
        this.coinResources.set(metal.name, resources);
        return resources;
    }

    createCoin(index) {
        const metal = METALS[index % METALS.length];
        const resources = this.getCoinResources(metal);
        const group = new THREE.Group();
        const coin = new THREE.Mesh(resources.geometry, resources.materials);
        coin.castShadow = true;
        group.add(coin);
        [-1, 1].forEach((direction) => {
            const rim = new THREE.Mesh(resources.rimGeometry, resources.rimMaterial);
            rim.rotation.x = Math.PI / 2;
            rim.position.y = direction * resources.thickness * 0.5;
            group.add(rim);
        });
        group.userData.kind = metal.name;

        const body = new CANNON.Body({
            mass: 1.4 * metal.density,
            material: this.pieceMaterial,
            shape: new CANNON.Cylinder(resources.radius, resources.radius, resources.thickness, 20),
            linearDamping: 0.24,
            angularDamping: 0.52,
            allowSleep: true,
            sleepSpeedLimit: 0.62,
            sleepTimeLimit: 0.45,
        });
        return { mesh: group, body };
    }

    getGemResources(gem) {
        if (this.gemResources.has(gem.name)) {
            return this.gemResources.get(gem.name);
        }
        const radius = this.pieceRadius * 1.08;
        const resources = {
            radius,
            geometry: createDiamondGeometry(radius),
            material: new THREE.MeshPhysicalMaterial({
                color: gem.color,
                metalness: 0,
                roughness: gem.name === 'diamond' ? 0.035 : 0.08,
                transmission: gem.name === 'diamond' ? 0.92 : 0.72,
                transparent: true,
                opacity: gem.name === 'diamond' ? 0.82 : 0.88,
                thickness: radius * 2.2,
                ior: gem.ior,
                attenuationColor: gem.attenuation,
                attenuationDistance: radius * 3,
                clearcoat: 1,
                clearcoatRoughness: 0.03,
                envMapIntensity: 2.1,
                flatShading: true,
                side: THREE.DoubleSide,
            }),
        };
        this.gemResources.set(gem.name, resources);
        return resources;
    }

    createGem(index) {
        const gem = GEMS[index % GEMS.length];
        const resources = this.getGemResources(gem);
        const mesh = new THREE.Mesh(resources.geometry, resources.material);
        mesh.castShadow = true;
        mesh.userData.kind = gem.name;
        const body = new CANNON.Body({
            mass: gem.name === 'diamond' ? 0.72 : 0.64,
            material: this.pieceMaterial,
            shape: new CANNON.Sphere(resources.radius * 0.58),
            linearDamping: 0.28,
            angularDamping: 0.64,
            allowSleep: true,
            sleepSpeedLimit: 0.65,
            sleepTimeLimit: 0.4,
        });
        return { mesh, body };
    }

    addPiece(index) {
        while (this.entries.length >= this.config.maxBodies) {
            this.removeEntry(this.entries[0]);
        }

        const isGem = index % 3 === 1;
        const entry = isGem ? this.createGem(this.gemSequence) : this.createCoin(this.coinSequence);
        if (isGem) {
            this.gemSequence += 1;
        } else {
            this.coinSequence += 1;
        }
        const horizontalMargin = this.pieceRadius * 1.4;
        const releaseHalfWidth = Math.min(
            this.visibleWidth * 0.32,
            Math.max(this.pieceRadius * 5, 6.8),
        );
        entry.body.position.set(
            THREE.MathUtils.randFloat(-releaseHalfWidth + horizontalMargin, releaseHalfWidth - horizontalMargin),
            this.visibleHeight * 0.52 + THREE.MathUtils.randFloat(0.3, 2.4),
            THREE.MathUtils.randFloat(-this.depthLimit * 0.72, this.depthLimit * 0.72),
        );
        entry.body.velocity.set(
            THREE.MathUtils.randFloat(-0.12, 0.12),
            THREE.MathUtils.randFloat(-0.12, 0),
            THREE.MathUtils.randFloat(-0.08, 0.08),
        );
        entry.body.quaternion.setFromEuler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
        );
        entry.body.angularVelocity.set(
            THREE.MathUtils.randFloat(-7, 7),
            THREE.MathUtils.randFloat(-7, 7),
            THREE.MathUtils.randFloat(-7, 7),
        );
        entry.mesh.position.copy(entry.body.position);
        entry.mesh.quaternion.copy(entry.body.quaternion);
        this.scene.add(entry.mesh);
        this.world.addBody(entry.body);
        this.entries.push(entry);
        this.renderer.domElement.dataset.bodyCount = String(this.entries.length);
        this.renderer.domElement.dataset.kinds = [...new Set(this.entries.map(({ mesh }) => mesh.userData.kind))].sort().join(',');
        this.startAnimation();
    }

    shower(dayCount) {
        const pieceCount = getShowerPieceCount(dayCount, this.config);
        this.settleDeadline = performance.now() + 14000;
        this.renderer.domElement.dataset.showerSize = String(pieceCount);
        for (let index = 0; index < pieceCount; index += 1) {
            const pieceIndex = this.pieceSequence;
            this.pieceSequence += 1;
            const timer = window.setTimeout(() => {
                this.spawnTimers.delete(timer);
                this.renderer.domElement.dataset.spawnPending = String(this.spawnTimers.size);
                this.addPiece(pieceIndex);
            }, index * 72);
            this.spawnTimers.add(timer);
        }
        this.renderer.domElement.dataset.spawnPending = String(this.spawnTimers.size);
    }

    removeEntry(entry) {
        this.world.removeBody(entry.body);
        this.scene.remove(entry.mesh);
        const index = this.entries.indexOf(entry);
        if (index >= 0) {
            this.entries.splice(index, 1);
        }
        this.renderer.domElement.dataset.bodyCount = String(this.entries.length);
    }

    clearPieces() {
        [...this.entries].forEach((entry) => this.removeEntry(entry));
        this.spawnTimers.forEach((timer) => window.clearTimeout(timer));
        this.spawnTimers.clear();
    }

    disposePieceResources() {
        this.coinResources.forEach((resources) => {
            resources.geometry.dispose();
            resources.rimGeometry.dispose();
            resources.materials.forEach((material) => {
                material.map?.dispose();
                material.bumpMap?.dispose();
                material.dispose();
            });
            resources.rimMaterial.dispose();
        });
        this.gemResources.forEach((resources) => {
            resources.geometry.dispose();
            resources.material.dispose();
        });
        this.coinResources.clear();
        this.gemResources.clear();
    }

    startAnimation() {
        if (this.frameId || document.hidden) {
            return;
        }
        this.lastFrameTime = performance.now();
        this.frameId = requestAnimationFrame((time) => this.animate(time));
    }

    stopAnimation() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    animate(time) {
        const delta = Math.min((time - this.lastFrameTime) / 1000, 0.05);
        this.lastFrameTime = time;
        this.world.step(1 / 60, delta, 3);
        let awakeBodies = 0;
        let maximumHorizontalRatio = 0;
        const horizontalRatios = [];
        for (const entry of this.entries) {
            const { mesh, body } = entry;
            if (
                time >= this.settleDeadline
                && body.position.y < this.floorY + this.pieceRadius * 4
                && Math.abs(body.velocity.y) < 0.6
            ) {
                body.sleep();
            }
            mesh.position.copy(body.interpolatedPosition);
            mesh.quaternion.copy(body.interpolatedQuaternion);
            if (body.sleepState !== CANNON.Body.SLEEPING) {
                awakeBodies += 1;
            }
            maximumHorizontalRatio = Math.max(
                maximumHorizontalRatio,
                Math.abs(body.position.x) / (this.visibleWidth * 0.5),
            );
            horizontalRatios.push(Math.abs(body.position.x) / (this.visibleWidth * 0.5));
        }
        horizontalRatios.sort((first, second) => first - second);
        const percentileIndex = Math.max(0, Math.ceil(horizontalRatios.length * 0.9) - 1);
        this.renderer.domElement.dataset.awakeBodies = String(awakeBodies);
        this.renderer.domElement.dataset.maximumHorizontalRatio = maximumHorizontalRatio.toFixed(3);
        this.renderer.domElement.dataset.pile90HorizontalRatio = (horizontalRatios[percentileIndex] || 0).toFixed(3);
        this.render();

        if (awakeBodies > 0 || this.spawnTimers.size > 0) {
            this.frameId = requestAnimationFrame((nextTime) => this.animate(nextTime));
        } else {
            this.frameId = null;
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

export function startProsperityShower(container, dayCount) {
    let experience = EXPERIENCE_BY_CONTAINER.get(container);
    if (!experience) {
        experience = new ProsperityExperience(container);
        EXPERIENCE_BY_CONTAINER.set(container, experience);
    }
    experience.shower(dayCount);
    return experience;
}
