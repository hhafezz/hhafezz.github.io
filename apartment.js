import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {PointerLockControls} from 'three/addons/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeae2);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.05, 100);
camera.position.set(10.8, 11.8, 13.2);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({antialias: true});
} catch (error) {
  document.getElementById('error').hidden = false;
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x777269, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 2.7);
sun.position.set(8, 14, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
scene.add(sun);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0.45, 0.55, 2.25);
orbit.minDistance = 4;
orbit.maxDistance = 30;
orbit.maxPolarAngle = Math.PI / 2.03;

const walk = new PointerLockControls(camera, document.body);
const keys = {};
let walking = false;
addEventListener('keydown', event => { keys[event.code] = true; });
addEventListener('keyup', event => { keys[event.code] = false; });
walk.addEventListener('lock', () => { document.getElementById('cross').style.display = 'block'; });
walk.addEventListener('unlock', () => {
  document.getElementById('cross').style.display = 'none';
  walking = false;
  orbit.enabled = true;
});

const apartment = new THREE.Group();
const floorGroup = new THREE.Group();
const wallGroup = new THREE.Group();
const openingGroup = new THREE.Group();
const furnitureGroup = new THREE.Group();
const dimensionGroup = new THREE.Group();
apartment.add(floorGroup, wallGroup, openingGroup, furnitureGroup, dimensionGroup);
scene.add(apartment);

const WALL_H = 2.75;
const WALL_T = 0.14;
const OUTER_T = 0.20;
const DOOR_H = 2.08;

// Coordinate system rebuilt from the supplied plan.
// Printed dimensions are exact; ≈ values are scaled from the image.
const P = Object.freeze({
  hallLeft: 0,
  hallRight: 1.08,
  upperBedroomLeft: -3.55,
  lowerBedroomLeft: -2.32,
  bathroomLeft: -1.15,
  right: 4.48,
  serviceTop: -2.20,
  serviceBottom: 0,
  upperBedroomBottom: 3.30,
  livingBottom: 5.00,
  balconyBottom: 6.05,
  lowerBedroomBottom: 6.80,
});

const M = {
  wall: new THREE.MeshStandardMaterial({color: 0xf3f0e8, roughness: 0.94}),
  outer: new THREE.MeshStandardMaterial({color: 0x4c4c48, roughness: 0.9}),
  floor: new THREE.MeshStandardMaterial({color: 0xd7b78e, roughness: 0.96}),
  hallFloor: new THREE.MeshStandardMaterial({color: 0xcbb08c, roughness: 0.96}),
  tile: new THREE.MeshStandardMaterial({color: 0xd8d6d0, roughness: 0.96}),
  balcony: new THREE.MeshStandardMaterial({color: 0xc9c6bd, roughness: 0.98}),
  wood: new THREE.MeshStandardMaterial({color: 0xaa7e52, roughness: 0.82}),
  white: new THREE.MeshStandardMaterial({color: 0xf7f5f0, roughness: 0.88}),
  dark: new THREE.MeshStandardMaterial({color: 0x4f4b46, roughness: 0.84}),
  green: new THREE.MeshStandardMaterial({color: 0x6f846d, roughness: 0.94}),
  glass: new THREE.MeshStandardMaterial({color: 0x8ec5da, transparent: true, opacity: 0.48, roughness: 0.15, metalness: 0.05}),
  metal: new THREE.MeshStandardMaterial({color: 0x8d8e8b, roughness: 0.48, metalness: 0.5}),
  line: new THREE.LineBasicMaterial({color: 0x41544b, transparent: true, opacity: 0.9}),
};

function box(group, name, x, z, width, depth, height, material, y = height / 2) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function floorRect(name, x1, x2, z1, z2, material = M.floor) {
  return box(floorGroup, name, (x1 + x2) / 2, (z1 + z2) / 2, x2 - x1, z2 - z1, 0.07, material, 0.035);
}

function wallX(z, x1, x2, material = M.wall, thickness = WALL_T, height = WALL_H, y = height / 2) {
  if (x2 <= x1) return null;
  return box(wallGroup, 'wall', (x1 + x2) / 2, z, x2 - x1, thickness, height, material, y);
}

function wallZ(x, z1, z2, material = M.wall, thickness = WALL_T, height = WALL_H, y = height / 2) {
  if (z2 <= z1) return null;
  return box(wallGroup, 'wall', x, (z1 + z2) / 2, thickness, z2 - z1, height, material, y);
}

function headerX(z, x1, x2, material = M.wall, bottom = DOOR_H) {
  const height = WALL_H - bottom;
  return wallX(z, x1, x2, material, WALL_T, height, bottom + height / 2);
}

function headerZ(x, z1, z2, material = M.wall, bottom = DOOR_H) {
  const height = WALL_H - bottom;
  return wallZ(x, z1, z2, material, WALL_T, height, bottom + height / 2);
}

function windowX(z, x1, x2, material = M.outer, sill = 0.88, height = 1.18, thickness = OUTER_T) {
  wallX(z, x1, x2, material, thickness, sill, sill / 2);
  const headerHeight = WALL_H - sill - height;
  wallX(z, x1, x2, material, thickness, headerHeight, sill + height + headerHeight / 2);
  box(openingGroup, 'window', (x1 + x2) / 2, z, x2 - x1 - 0.05, 0.045, height - 0.06, M.glass, sill + height / 2);
  box(openingGroup, 'window-frame', (x1 + x2) / 2, z, 0.035, 0.07, height, M.metal, sill + height / 2);
}

function windowZ(x, z1, z2, material = M.outer, sill = 0.88, height = 1.18, thickness = OUTER_T) {
  wallZ(x, z1, z2, material, thickness, sill, sill / 2);
  const headerHeight = WALL_H - sill - height;
  wallZ(x, z1, z2, material, thickness, headerHeight, sill + height + headerHeight / 2);
  box(openingGroup, 'window', x, (z1 + z2) / 2, 0.045, z2 - z1 - 0.05, height - 0.06, M.glass, sill + height / 2);
  box(openingGroup, 'window-frame', x, (z1 + z2) / 2, 0.07, 0.035, height, M.metal, sill + height / 2);
}

function doorX(z, x1, x2, opensToPositiveZ = true, hingeAtStart = true) {
  const width = x2 - x1;
  const angle = Math.PI * 0.34 * (opensToPositiveZ ? -1 : 1) * (hingeAtStart ? 1 : -1);
  const hingeX = hingeAtStart ? x1 : x2;
  const direction = hingeAtStart ? 1 : -1;
  const centerOffset = new THREE.Vector3(direction * width / 2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  const leaf = box(openingGroup, 'door', hingeX + centerOffset.x, z + centerOffset.z, width, 0.045, DOOR_H, M.wood, DOOR_H / 2);
  leaf.rotation.y = angle;
  headerX(z, x1, x2);
}

function doorZ(x, z1, z2, opensToPositiveX = true, hingeAtStart = true) {
  const width = z2 - z1;
  const angle = Math.PI * 0.34 * (opensToPositiveX ? 1 : -1) * (hingeAtStart ? 1 : -1);
  const hingeZ = hingeAtStart ? z1 : z2;
  const direction = hingeAtStart ? 1 : -1;
  const centerOffset = new THREE.Vector3(0, 0, direction * width / 2).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  const leaf = box(openingGroup, 'door', x + centerOffset.x, hingeZ + centerOffset.z, 0.045, width, DOOR_H, M.wood, DOOR_H / 2);
  leaf.rotation.y = angle;
  headerZ(x, z1, z2);
}

function column(x, z, width = 0.30, depth = 0.30) {
  return box(wallGroup, 'column', x, z, width, depth, WALL_H, M.outer, WALL_H / 2);
}

// Floors: these rectangles meet at their boundaries and do not overlap.
floorRect('bathroom-floor', P.bathroomLeft, P.hallRight, P.serviceTop, P.serviceBottom, M.tile);
floorRect('kitchen-floor', P.hallRight, P.right, P.serviceTop, P.serviceBottom, M.tile);
floorRect('upper-bedroom-floor', P.upperBedroomLeft, P.hallLeft, 0, P.upperBedroomBottom);
floorRect('hall-floor', P.hallLeft, P.hallRight, 0, P.upperBedroomBottom, M.hallFloor);
floorRect('living-floor', P.hallRight, P.right, 0, P.livingBottom);
floorRect('lower-bedroom-floor', P.lowerBedroomLeft, P.hallRight, P.upperBedroomBottom, P.lowerBedroomBottom);
floorRect('balcony-floor', P.hallRight, P.right, P.livingBottom, P.balconyBottom, M.balcony);

// Bathroom exterior and window.
wallZ(P.bathroomLeft, P.serviceTop, 0, M.outer, OUTER_T);
wallX(P.serviceTop, P.bathroomLeft, -0.68, M.outer, OUTER_T);
windowX(P.serviceTop, -0.68, 0.20);
wallX(P.serviceTop, 0.20, P.hallRight, M.outer, OUTER_T);

// Kitchen exterior and window over the counter.
wallX(P.serviceTop, P.hallRight, 1.52, M.outer, OUTER_T);
windowX(P.serviceTop, 1.52, 2.78);
wallX(P.serviceTop, 2.78, P.right, M.outer, OUTER_T);
wallZ(P.right, P.serviceTop, 0, M.outer, OUTER_T);

// Bathroom/kitchen divider.
wallZ(P.hallRight, P.serviceTop, 0);

// Service-room south wall: bathroom and kitchen doors are true openings.
wallX(0, P.upperBedroomLeft, P.bathroomLeft, M.outer, OUTER_T);
wallX(0, P.bathroomLeft, 0.14);
doorX(0, 0.14, 0.94, false, false);
wallX(0, 0.94, P.hallRight);
wallX(0, P.hallRight, 1.38);
doorX(0, 1.38, 2.28, false, true);
wallX(0, 2.28, P.right);

// Upper bedroom exterior and its corridor door.
wallZ(P.upperBedroomLeft, 0, P.upperBedroomBottom, M.outer, OUTER_T);
wallZ(P.hallLeft, 0, 0.18);
doorZ(P.hallLeft, 0.18, 1.08, false, true);
wallZ(P.hallLeft, 1.08, P.upperBedroomBottom);

// Boundary between upper and lower bedrooms, including an exterior window in the setback.
wallX(P.upperBedroomBottom, P.upperBedroomLeft, -3.25, M.outer, OUTER_T);
windowX(P.upperBedroomBottom, -3.25, -2.50);
wallX(P.upperBedroomBottom, -2.50, P.hallLeft);
wallX(P.upperBedroomBottom, P.hallLeft, 0.18);
doorX(P.upperBedroomBottom, 0.18, 1.00, true, false);
wallX(P.upperBedroomBottom, 1.00, P.hallRight);

// Hall/living wall with a wide opening at the lower end.
wallZ(P.hallRight, 0, 2.34);
headerZ(P.hallRight, 2.34, 3.16);
wallZ(P.hallRight, 3.16, P.upperBedroomBottom);

// Lower bedroom exterior and window.
wallZ(P.lowerBedroomLeft, P.upperBedroomBottom, P.lowerBedroomBottom, M.outer, OUTER_T);
wallX(P.lowerBedroomBottom, P.lowerBedroomLeft, -1.65, M.outer, OUTER_T);
windowX(P.lowerBedroomBottom, -1.65, 0.22);
wallX(P.lowerBedroomBottom, 0.22, P.hallRight, M.outer, OUTER_T);
wallZ(P.hallRight, P.upperBedroomBottom, P.lowerBedroomBottom);
column(P.lowerBedroomLeft + 0.12, P.lowerBedroomBottom - 0.12, 0.34, 0.34);
column(P.hallRight - 0.12, P.lowerBedroomBottom - 0.12, 0.34, 0.34);

// Living-room right wall: main entrance plus exterior window.
wallZ(P.right, 0, 0.16, M.outer, OUTER_T);
doorZ(P.right, 0.16, 1.16, false, false);
wallZ(P.right, 1.16, 2.08, M.outer, OUTER_T);
windowZ(P.right, 2.08, 3.18);
wallZ(P.right, 3.18, P.livingBottom, M.outer, OUTER_T);

// Living room to balcony: broad glazed opening.
wallX(P.livingBottom, P.hallRight, 2.40);
windowX(P.livingBottom, 2.40, 4.24, M.outer, 0.12, 2.28, OUTER_T);
wallX(P.livingBottom, 4.24, P.right, M.outer, OUTER_T);

// Balcony/loggia that was missing from the first model.
// Its left side is already formed by the lower bedroom's continuous right wall.
wallZ(P.right, P.livingBottom, P.balconyBottom, M.outer, OUTER_T);
wallX(P.balconyBottom, P.hallRight, P.right, M.outer, OUTER_T, 1.08, 0.54);

// Fixed kitchen and bathroom elements.
function counterX(x1, x2, z, depth = 0.58) {
  box(furnitureGroup, 'counter', (x1 + x2) / 2, z, x2 - x1, depth, 0.88, M.wood, 0.44);
  box(furnitureGroup, 'countertop', (x1 + x2) / 2, z, x2 - x1 + 0.03, depth + 0.03, 0.06, M.white, 0.91);
}
function counterZ(x, z1, z2, width = 0.58) {
  box(furnitureGroup, 'counter', x, (z1 + z2) / 2, width, z2 - z1, 0.88, M.wood, 0.44);
  box(furnitureGroup, 'countertop', x, (z1 + z2) / 2, width + 0.03, z2 - z1 + 0.03, 0.06, M.white, 0.91);
}
counterX(1.28, 3.52, -1.87);
counterZ(4.17, -1.72, -0.26);
box(furnitureGroup, 'sink', 2.18, -1.87, 0.66, 0.40, 0.05, M.metal, 0.95);
box(furnitureGroup, 'stove', 4.17, -1.42, 0.50, 0.56, 0.06, M.dark, 0.95);
box(furnitureGroup, 'fridge', 3.78, -0.35, 0.62, 0.66, 1.78, M.white, 0.89);

box(furnitureGroup, 'shower-base', -0.76, -1.68, 0.70, 0.72, 0.10, M.white, 0.05);
box(furnitureGroup, 'toilet', -0.62, -0.65, 0.42, 0.62, 0.48, M.white, 0.24);
box(furnitureGroup, 'basin', 0.46, -1.72, 0.54, 0.42, 0.82, M.white, 0.41);

// Loose furniture is intentionally simple and can be hidden.
function bed(x, z, rotation = 0) {
  const group = new THREE.Group();
  box(group, 'bed', 0, 0, 1.58, 2.00, 0.34, M.white, 0.20);
  box(group, 'headboard', 0, -0.94, 1.58, 0.10, 0.84, M.wood, 0.45);
  box(group, 'blanket', 0, 0.30, 1.48, 0.80, 0.08, M.green, 0.40);
  box(group, 'pillow', -0.35, -0.62, 0.56, 0.32, 0.12, M.white, 0.43);
  box(group, 'pillow', 0.35, -0.62, 0.56, 0.32, 0.12, M.white, 0.43);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  furnitureGroup.add(group);
}
function wardrobe(x, z, width = 1.80, depth = 0.44, rotation = 0) {
  const item = box(furnitureGroup, 'wardrobe', x, z, width, depth, 2.12, M.wood, 1.06);
  item.rotation.y = rotation;
}
function sofa(x, z, rotation = 0) {
  const group = new THREE.Group();
  box(group, 'sofa-seat', 0, 0, 1.95, 0.82, 0.44, M.white, 0.23);
  box(group, 'sofa-back', 0, -0.34, 1.95, 0.16, 0.86, M.white, 0.46);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  furnitureGroup.add(group);
}
function plant(x, z) {
  box(furnitureGroup, 'plant-pot', x, z, 0.28, 0.28, 0.24, M.dark, 0.12);
  box(furnitureGroup, 'plant', x, z, 0.48, 0.48, 0.34, M.green, 0.42);
}

bed(-1.78, 1.85);
wardrobe(-3.28, 1.70, 0.42, 1.65, Math.PI / 2);
bed(-0.62, 5.15);
wardrobe(-2.05, 5.00, 0.42, 1.72, Math.PI / 2);
sofa(2.36, 3.18);
box(furnitureGroup, 'coffee-table', 3.25, 3.18, 0.74, 0.56, 0.36, M.wood, 0.18);
box(furnitureGroup, 'tv', 4.27, 3.58, 0.08, 1.25, 0.92, M.dark, 0.70);
plant(3.92, 4.52);
plant(1.46, 4.50);

// Room and dimension labels.
function label(text, x, z, width = 2.7, color = '#252722') {
  const lines = text.split('\n');
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 224;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  lines.forEach((line, index) => {
    context.font = index === 0 ? '750 46px system-ui' : '650 38px system-ui';
    context.fillText(line, canvas.width / 2, 78 + index * 62);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, transparent: true, depthTest: false}));
  sprite.position.set(x, 0.13, z);
  sprite.scale.set(width, 0.82, 1);
  dimensionGroup.add(sprite);
}

label('Bedroom 1\n3.55 × 3.30 m', -1.78, 1.70, 2.75);
label('Bedroom 2\n3.40 × 3.50 m', -0.62, 5.15, 2.75);
label('Living room\n3.40 × 5.00 m', 2.78, 2.52, 2.85);
label('Hall\n1.08 m', 0.54, 1.72, 1.28);
label('Bathroom\n≈ 2.23 × 2.20 m', -0.04, -1.08, 2.30, '#555750');
label('Kitchen\n3.40 × ≈ 2.20 m', 2.78, -1.08, 2.50, '#555750');
label('Balcony\n≈ 1.05 m deep', 2.78, 5.54, 2.35, '#555750');

// Dimension guide lines for the four printed measurements.
function guideLine(points) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => new THREE.Vector3(x, 0.105, z)));
  dimensionGroup.add(new THREE.Line(geometry, M.line));
}
guideLine([[P.upperBedroomLeft + 0.12, 0.22], [P.hallLeft - 0.12, 0.22]]);
guideLine([[P.upperBedroomLeft + 0.18, 0.22], [P.upperBedroomLeft + 0.18, P.upperBedroomBottom - 0.16]]);
guideLine([[P.lowerBedroomLeft + 0.16, P.upperBedroomBottom + 0.20], [P.lowerBedroomLeft + 0.16, P.lowerBedroomBottom - 0.18]]);
guideLine([[P.hallRight + 0.18, 0.20], [P.hallRight + 0.18, P.livingBottom - 0.18]]);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({color: 0xe5e2dc, roughness: 1}),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.04;
ground.receiveShadow = true;
scene.add(ground);

function setView(position, target) {
  walking = false;
  if (walk.isLocked) walk.unlock();
  orbit.enabled = true;
  camera.up.set(0, 1, 0);
  camera.position.copy(position);
  orbit.target.copy(target);
  orbit.update();
}

const center = new THREE.Vector3(0.46, 0.55, 2.30);
document.getElementById('doll').onclick = () => setView(new THREE.Vector3(10.8, 11.8, 13.2), center);
document.getElementById('top').onclick = () => setView(new THREE.Vector3(0.46, 17.5, 2.31), new THREE.Vector3(0.46, 0, 2.30));
document.getElementById('reset').onclick = () => setView(new THREE.Vector3(10.8, 11.8, 13.2), center);
document.getElementById('walkBtn').onclick = () => {
  walking = true;
  orbit.enabled = false;
  camera.position.set(0.54, 1.65, 1.55);
  camera.lookAt(2.75, 1.60, 2.50);
  walk.lock();
};

function toggleGroup(buttonId, group) {
  const button = document.getElementById(buttonId);
  button.onclick = () => {
    group.visible = !group.visible;
    button.setAttribute('aria-pressed', String(group.visible));
  };
}
toggleGroup('dimensionsBtn', dimensionGroup);
toggleGroup('furnitureBtn', furnitureGroup);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  if (walking && walk.isLocked) {
    const speed = 2.0 * delta;
    if (keys.KeyW || keys.ArrowUp) walk.moveForward(speed);
    if (keys.KeyS || keys.ArrowDown) walk.moveForward(-speed);
    if (keys.KeyA || keys.ArrowLeft) walk.moveRight(-speed);
    if (keys.KeyD || keys.ArrowRight) walk.moveRight(speed);
    camera.position.y = 1.65;
  }
  orbit.update();
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
