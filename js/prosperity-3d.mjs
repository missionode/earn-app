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
const ELEMENT_OBSTACLE_SELECTOR = [
    '.action-buttons.into .responsive-image',
    '.header-logo-section .footer-faq-link',
    '.summary-item:not([hidden])',
    '#walletfilter',
    '.adsSpace',
    '.ux-actions .button:not([hidden])',
    '.transactions h2',
    '.table_wrap',
    '.namaste',
    '.footer_arranged .bodymass',
    '.footer_arranged .faqlink',
].join(',');

export function getResponsiveProsperityConfig(width, height, pixelRatio = 1) {
    const shortestSide = Math.max(280, Math.min(width, height));
    const targetPiecePixels = clamp(shortestSide * 0.028, 10, 22);
    const performanceTier = shortestSide < 520 ? 'mobile' : shortestSide < 900 ? 'tablet' : 'desktop';
    const maxBodies = performanceTier === 'mobile' ? 28 : performanceTier === 'tablet' ? 36 : 44;

    return Object.freeze({
        width,
        height,
        pixelRatio: Math.min(pixelRatio, performanceTier === 'mobile' ? 1.5 : 2),
        targetPiecePixels,
        maxBodies,
        performanceTier,
    });
}

export function getShowerPieceCount(remainingCount, showerExponent) {
    const safeRemainingCount = Math.max(0, Math.floor(Number(remainingCount) || 0));
    const safeExponent = clamp(Math.floor(Number(showerExponent) || 1), 1, 30);
    return Math.min(safeRemainingCount, 2 ** safeExponent);
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
    const segments = 16;
    const tablePercentage = 0.57;
    const crownAngle = THREE.MathUtils.degToRad(34);
    const pavilionAngle = THREE.MathUtils.degToRad(41);
    const girdleRadius = radius;
    const tableRadius = girdleRadius * tablePercentage;
    const crownHeight = (girdleRadius - tableRadius) * Math.tan(crownAngle);
    const girdleHalfThickness = radius * 0.025;
    const pavilionDepth = girdleRadius * Math.tan(pavilionAngle);

    for (let ring = 0; ring < 3; ring += 1) {
        const ringRadius = ring === 0 ? tableRadius : girdleRadius;
        const y = ring === 0 ? crownHeight : ring === 1 ? girdleHalfThickness : -girdleHalfThickness;
        for (let index = 0; index < segments; index += 1) {
            const angle = (index / segments) * Math.PI * 2 + Math.PI / 8;
            positions.push(Math.cos(angle) * ringRadius, y, Math.sin(angle) * ringRadius);
        }
    }

    const bottomIndex = positions.length / 3;
    positions.push(0, -pavilionDepth, 0);
    const topIndex = positions.length / 3;
    positions.push(0, crownHeight, 0);

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
    geometry.userData.cut = {
        style: '58-facet-inspired round brilliant',
        tablePercentage: 57,
        crownAngle: 34,
        pavilionAngle: 41,
    };
    return geometry;
}

class ProsperityExperience {
    constructor(container) {
        this.container = container;
        this.entries = [];
        this.pieceSequence = 0;
        this.coinSequence = 0;
        this.gemSequence = 0;
        this.showerExponent = 1;
        this.lastShowerExponent = 0;
        this.boundaryBodies = [];
        this.elementObstacleBodies = [];
        this.elementObstacleBodyIds = new Set();
        this.elementCollisionCount = 0;
        this.obstacleUpdateFrame = null;
        this.frameId = null;
        this.lastFrameTime = 0;
        this.settleDeadline = 0;
        this.hardSettleDeadline = 0;
        this.spawnTimers = new Set();
        this.batchBodies = new Set();
        this.batchActive = false;
        this.onSettled = null;
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
        this.elementObstacleMaterial = new CANNON.Material('prosperity-element-obstacle');
        this.world.addContactMaterial(new CANNON.ContactMaterial(this.pieceMaterial, this.boundaryMaterial, {
            friction: 0.26,
            restitution: 0.42,
        }));
        this.world.addContactMaterial(new CANNON.ContactMaterial(this.pieceMaterial, this.pieceMaterial, {
            friction: 0.22,
            restitution: 0.3,
        }));
        this.world.addContactMaterial(new CANNON.ContactMaterial(this.pieceMaterial, this.elementObstacleMaterial, {
            friction: 0.035,
            restitution: 0.48,
        }));

        this.coinResources = new Map();
        this.gemResources = new Map();
        this.updateViewport(true);
        this.resizeHandler = () => this.updateViewport(false);
        this.scrollHandler = () => this.scheduleElementObstacleUpdate();
        window.addEventListener('resize', this.resizeHandler, { passive: true });
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAnimation();
            } else if (this.entries.some(({ body }) => body.sleepState !== CANNON.Body.SLEEPING)) {
                this.startAnimation();
            }
        });
    }

    updateViewport(initial) {
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
        const floorLift = Math.max(this.pieceRadius * 0.8, this.visibleHeight * 0.06);
        this.floorY = -this.visibleHeight * 0.5 + floorLift;
        this.depthLimit = clamp(this.visibleWidth * 0.12, 1.7, 3.2);
        this.renderer.domElement.dataset.performanceTier = this.config.performanceTier;
        this.renderer.domElement.dataset.targetPiecePixels = this.config.targetPiecePixels.toFixed(2);
        this.renderer.domElement.dataset.maxBodies = String(this.config.maxBodies);
        this.renderer.domElement.dataset.floorLiftPixels = (floorLift / this.worldUnitsPerPixel).toFixed(2);
        this.renderer.domElement.dataset.containerShape = 'flat-bottom-viewport';
        this.renderer.domElement.dataset.releaseOrigin = 'full-width-top';
        this.renderer.domElement.dataset.bounceProfile = 'lively-contained';
        this.renderer.domElement.dataset.obstacleModel = 'dom-elements';
        this.createBoundaries();
        this.createElementObstacles();

        this.render();
    }

    screenPointToWorld(screenX, screenY, worldZ = 0) {
        this.camera.updateMatrixWorld(true);
        const point = new THREE.Vector3(
            (screenX / this.config.width) * 2 - 1,
            -(screenY / this.config.height) * 2 + 1,
            0.5,
        ).unproject(this.camera);
        const direction = point.sub(this.camera.position).normalize();
        const distance = (worldZ - this.camera.position.z) / direction.z;
        return this.camera.position.clone().add(direction.multiplyScalar(distance));
    }

    scheduleElementObstacleUpdate() {
        if (this.obstacleUpdateFrame) {
            return;
        }
        this.obstacleUpdateFrame = requestAnimationFrame(() => {
            this.obstacleUpdateFrame = null;
            this.createElementObstacles();
        });
    }

    createElementObstacles() {
        this.elementObstacleBodies.forEach((body) => this.world.removeBody(body));
        this.elementObstacleBodies = [];
        this.elementObstacleBodyIds.clear();

        const viewportRect = {
            left: 0,
            top: 0,
            right: this.config.width,
            bottom: this.config.height,
        };
        const horizontalLimit = this.visibleWidth * 0.5 - this.pieceRadius * 1.15;
        const obstacleHalfDepth = Math.min(
            this.depthLimit * 0.34,
            Math.max(this.pieceRadius * 2.2, this.depthLimit * 0.22),
        );

        document.querySelectorAll(ELEMENT_OBSTACLE_SELECTOR).forEach((element, obstacleIndex) => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0
                || rect.width < 6 || rect.height < 6
                || rect.right <= viewportRect.left || rect.left >= viewportRect.right
                || rect.bottom <= viewportRect.top || rect.top >= viewportRect.bottom) {
                return;
            }

            const clippedLeft = clamp(rect.left, viewportRect.left, viewportRect.right);
            const clippedRight = clamp(rect.right, viewportRect.left, viewportRect.right);
            const clippedTop = clamp(rect.top, viewportRect.top, viewportRect.bottom);
            const clippedBottom = clamp(rect.bottom, viewportRect.top, viewportRect.bottom);
            const topLeft = this.screenPointToWorld(clippedLeft, clippedTop);
            const bottomRight = this.screenPointToWorld(clippedRight, clippedBottom);
            const left = clamp(Math.min(topLeft.x, bottomRight.x), -horizontalLimit, horizontalLimit);
            const right = clamp(Math.max(topLeft.x, bottomRight.x), -horizontalLimit, horizontalLimit);
            const top = Math.max(topLeft.y, bottomRight.y);
            const bottom = Math.max(this.floorY + this.pieceRadius * 1.15, Math.min(topLeft.y, bottomRight.y));
            const halfWidth = (right - left) * 0.5;
            const halfHeight = (top - bottom) * 0.5;
            if (halfWidth < this.worldUnitsPerPixel * 3 || halfHeight < this.worldUnitsPerPixel * 3) {
                return;
            }

            const body = new CANNON.Body({ mass: 0, material: this.elementObstacleMaterial });
            body.addShape(new CANNON.Box(new CANNON.Vec3(halfWidth, halfHeight, obstacleHalfDepth)));
            body.position.set((left + right) * 0.5, (top + bottom) * 0.5, 0);
            body.quaternion.setFromEuler(obstacleIndex % 2 ? 0.065 : -0.065, 0, 0);
            this.world.addBody(body);
            this.elementObstacleBodies.push(body);
            this.elementObstacleBodyIds.add(body.id);
        });

        this.renderer.domElement.dataset.elementObstacleCount = String(this.elementObstacleBodies.length);
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

        if (this.containerVisuals) {
            this.scene.remove(this.containerVisuals);
            this.containerVisuals.traverse((object) => {
                object.geometry?.dispose();
                object.material?.dispose();
            });
        }
        this.containerVisuals = new THREE.Group();
        const glassFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(this.visibleWidth, this.depthLimit * 2),
            new THREE.MeshPhysicalMaterial({
                color: 0xd9f5ff,
                transparent: true,
                opacity: 0.055,
                transmission: 0.8,
                roughness: 0.08,
                clearcoat: 1,
                depthWrite: false,
                side: THREE.DoubleSide,
            }),
        );
        glassFloor.rotation.x = -Math.PI / 2;
        glassFloor.position.y = this.floorY + 0.006;
        this.containerVisuals.add(glassFloor);

        const edgeInset = this.pieceRadius * 0.35;
        const left = -this.visibleWidth * 0.5 + edgeInset;
        const right = this.visibleWidth * 0.5 - edgeInset;
        const top = this.visibleHeight * 0.5;
        const front = this.depthLimit * 0.96;
        const edgeGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(left, this.floorY, front), new THREE.Vector3(right, this.floorY, front),
            new THREE.Vector3(left, this.floorY, front), new THREE.Vector3(left, top, front),
            new THREE.Vector3(right, this.floorY, front), new THREE.Vector3(right, top, front),
        ]);
        const edges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({
            color: 0xc9efff,
            transparent: true,
            opacity: 0.13,
            depthWrite: false,
        }));
        this.containerVisuals.add(edges);
        this.scene.add(this.containerVisuals);
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
            linearDamping: 0.08,
            angularDamping: 0.24,
            allowSleep: true,
            sleepSpeedLimit: 0.2,
            sleepTimeLimit: 0.8,
        });
        return { mesh: group, body };
    }

    getGemResources(gem) {
        if (this.gemResources.has(gem.name)) {
            return this.gemResources.get(gem.name);
        }
        const radius = this.pieceRadius * 0.98;
        const resources = {
            radius,
            geometry: createDiamondGeometry(radius),
            material: new THREE.MeshPhysicalMaterial({
                color: gem.color,
                metalness: 0,
                roughness: gem.name === 'diamond' ? 0.012 : 0.055,
                transmission: gem.name === 'diamond' ? 0.97 : 0.8,
                transparent: true,
                opacity: gem.name === 'diamond' ? 0.72 : 0.84,
                thickness: radius * 2.2,
                ior: gem.ior,
                attenuationColor: gem.attenuation,
                attenuationDistance: radius * 3,
                clearcoat: 1,
                clearcoatRoughness: 0.03,
                envMapIntensity: gem.name === 'diamond' ? 3.2 : 2.5,
                iridescence: gem.name === 'diamond' ? 0.72 : 0.18,
                iridescenceIOR: 1.3,
                iridescenceThicknessRange: gem.name === 'diamond' ? [180, 620] : [100, 280],
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
            linearDamping: 0.1,
            angularDamping: 0.3,
            allowSleep: true,
            sleepSpeedLimit: 0.2,
            sleepTimeLimit: 0.8,
        });
        return { mesh, body };
    }

    handleElementCollision(body, otherBody) {
        if (!this.elementObstacleBodyIds.has(otherBody.id)) {
            return;
        }
        const now = performance.now();
        if (now - (body.prosperityLastElementBounce || 0) < 140) {
            return;
        }
        body.prosperityLastElementBounce = now;
        const depthDirection = Math.abs(body.position.z) > 0.08
            ? Math.sign(body.position.z)
            : (Math.random() < 0.5 ? -1 : 1);
        body.velocity.z += depthDirection * Math.min(this.depthLimit * 0.82, 2.35);
        body.velocity.y = Math.max(body.velocity.y, THREE.MathUtils.randFloat(0.38, 0.82));
        body.angularVelocity.x += THREE.MathUtils.randFloat(-2.4, 2.4);
        body.angularVelocity.z += THREE.MathUtils.randFloat(-2.4, 2.4);
        body.wakeUp();
        this.elementCollisionCount += 1;
        this.renderer.domElement.dataset.elementCollisionCount = String(this.elementCollisionCount);
    }

    isSupportedByElement(body) {
        return this.elementObstacleBodies.some((obstacle) => {
            obstacle.updateAABB();
            const { lowerBound, upperBound } = obstacle.aabb;
            return body.position.x > lowerBound.x - this.pieceRadius
                && body.position.x < upperBound.x + this.pieceRadius
                && body.position.z > lowerBound.z - this.pieceRadius
                && body.position.z < upperBound.z + this.pieceRadius
                && Math.abs(body.position.y - upperBound.y) < this.pieceRadius * 2.2;
        });
    }

    keepRollingOffElement(body, time) {
        if (time < (body.prosperityNextRollOffAt || 0) || body.velocity.length() >= 0.42) {
            return;
        }
        body.prosperityNextRollOffAt = time + 520;
        const depthDirection = Math.abs(body.position.z) > 0.08
            ? Math.sign(body.position.z)
            : (Math.random() < 0.5 ? -1 : 1);
        body.velocity.z += depthDirection * Math.min(this.depthLimit * 0.72, 2.1);
        body.velocity.y = Math.max(body.velocity.y, 0.34);
        body.angularVelocity.y += THREE.MathUtils.randFloat(-2, 2);
        body.wakeUp();
    }

    addPiece(index) {
        const isGem = index % 3 === 1;
        const entry = isGem ? this.createGem(this.gemSequence) : this.createCoin(this.coinSequence);
        if (isGem) {
            this.gemSequence += 1;
        } else {
            this.coinSequence += 1;
        }
        const releaseHalfWidth = Math.max(this.pieceRadius, this.visibleWidth * 0.5 - this.pieceRadius * 1.8);
        const releaseHalfDepth = Math.min(this.depthLimit * 0.22, this.pieceRadius * 3);
        entry.body.position.set(
            THREE.MathUtils.randFloat(-releaseHalfWidth, releaseHalfWidth),
            this.visibleHeight * 0.52 + THREE.MathUtils.randFloat(0.25, 1.8),
            THREE.MathUtils.randFloat(-releaseHalfDepth, releaseHalfDepth),
        );
        const horizontalSpeed = Math.min(this.visibleWidth * 0.075, 1.8);
        const depthSpeed = Math.min(this.depthLimit * 0.55, 1.6);
        entry.body.velocity.set(
            THREE.MathUtils.randFloat(-horizontalSpeed, horizontalSpeed),
            THREE.MathUtils.randFloat(-0.18, -0.04),
            THREE.MathUtils.randFloat(-depthSpeed, depthSpeed),
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
        entry.body.addEventListener('collide', ({ body: otherBody }) => {
            this.handleElementCollision(entry.body, otherBody);
        });
        entry.mesh.position.copy(entry.body.position);
        entry.mesh.quaternion.copy(entry.body.quaternion);
        this.scene.add(entry.mesh);
        this.world.addBody(entry.body);
        this.entries.push(entry);
        this.batchBodies.add(entry.body);
        this.renderer.domElement.dataset.bodyCount = String(this.entries.length);
        this.renderer.domElement.dataset.kinds = [...new Set(this.entries.map(({ mesh }) => mesh.userData.kind))].sort().join(',');
        this.startAnimation();
    }

    shower(availableCount, onSettled) {
        this.createElementObstacles();
        const committedCount = this.entries.length + this.spawnTimers.size;
        const remainingCount = Math.max(0, availableCount - committedCount);
        const exponent = this.showerExponent;
        const pieceCount = getShowerPieceCount(remainingCount, exponent);
        if (!pieceCount) {
            return 0;
        }
        this.lastShowerExponent = exponent;
        this.showerExponent += 1;
        if (!this.batchActive) {
            this.batchActive = true;
            this.batchBodies.clear();
        }
        this.onSettled = onSettled;
        const now = performance.now();
        const spawnDuration = Math.max(0, pieceCount - 1) * 72;
        this.settleDeadline = Math.max(this.settleDeadline, now + spawnDuration + 16000);
        this.hardSettleDeadline = Math.max(this.hardSettleDeadline, now + spawnDuration + 24000);
        this.renderer.domElement.dataset.showerSize = String(pieceCount);
        this.renderer.domElement.dataset.showerExponent = String(exponent);
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
        this.renderer.domElement.dataset.availableCount = String(availableCount);
        return pieceCount;
    }

    finishBatch() {
        this.batchActive = false;
        this.batchBodies.clear();
        this.updateCountDiagnostics();
        const callback = this.onSettled;
        this.onSettled = null;
        callback?.(this.entries.length);
    }

    updateCountDiagnostics() {
        this.renderer.domElement.dataset.collectedCount = String(this.entries.length);
        this.renderer.domElement.dataset.visiblePieceCount = String(this.entries.length);
    }

    removeEntry(entry) {
        this.world.removeBody(entry.body);
        this.scene.remove(entry.mesh);
        const index = this.entries.indexOf(entry);
        if (index >= 0) {
            this.entries.splice(index, 1);
        }
        this.renderer.domElement.dataset.bodyCount = String(this.entries.length);
        this.updateCountDiagnostics();
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
        let elementRestingBodies = 0;
        let maximumHorizontalRatio = 0;
        const horizontalRatios = [];
        for (const entry of this.entries) {
            const { mesh, body } = entry;
            const isCurrentBatch = this.batchBodies.has(body);
            const isOnElement = this.isSupportedByElement(body);
            if (isOnElement) {
                elementRestingBodies += 1;
                this.keepRollingOffElement(body, time);
            }
            const isNearFloor = body.position.y < this.floorY + this.pieceRadius * 6;
            const isRestingNearPile = body.position.y < this.floorY + this.pieceRadius * 8
                && body.velocity.length() < 0.65
                && body.angularVelocity.length() < 0.8;
            if ((isCurrentBatch && time >= this.settleDeadline && isRestingNearPile)
                || (time >= this.hardSettleDeadline && isNearFloor)) {
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
        this.renderer.domElement.dataset.elementRestingBodies = String(elementRestingBodies);
        this.renderer.domElement.dataset.maximumHorizontalRatio = maximumHorizontalRatio.toFixed(3);
        this.renderer.domElement.dataset.pile90HorizontalRatio = (horizontalRatios[percentileIndex] || 0).toFixed(3);
        this.render();

        if (awakeBodies > 0 || this.spawnTimers.size > 0) {
            this.frameId = requestAnimationFrame((nextTime) => this.animate(nextTime));
        } else {
            this.frameId = null;
            this.finishBatch();
            this.render();
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

export function startProsperityShower(container, { availableCount, onSettled } = {}) {
    let experience = EXPERIENCE_BY_CONTAINER.get(container);
    if (!experience) {
        experience = new ProsperityExperience(container);
        EXPERIENCE_BY_CONTAINER.set(container, experience);
    }
    const releasedCount = experience.shower(availableCount, onSettled);
    return {
        experience,
        releasedCount,
        collectedCount: experience.entries.length,
        committedCount: experience.entries.length + experience.spawnTimers.size,
        showerExponent: experience.lastShowerExponent,
    };
}
