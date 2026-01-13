import './style.css'
import * as THREE from 'three'
import { createWorld, trait, type Entity, type World } from 'koota'
import { Schedule } from 'directed';

export type System = (ctx: { game: Game }) => void;

// "primative" traits
export const Transform = trait(() => ({
  position: new THREE.Vector3(0.0, 0.0, 0.0),
  rotation: new THREE.Euler(0.0, 0.0, 0.0),
  scale: new THREE.Vector3(1.0, 1.0, 1.0)
}))
export const Mesh = trait(() => new THREE.Mesh())

// three systems
const syncTransformToMesh: System = ({ game }) => {
  game.world.query(Transform, Mesh).updateEach(([transform, mesh]) => {
    mesh.position.set(transform.position.x, transform.position.y, transform.position.z)
    mesh.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z)
    mesh.scale.set(transform.scale.x, transform.scale.y, transform.scale.z)
  })
}

export class Game {
  public readonly renderer: THREE.WebGLRenderer;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly scene: THREE.Scene;
  public readonly world: World;
  public readonly schedule: Schedule<{ game: Game }>;
  public deltaTime: number; /** Time Between Frames in Seconds */
  private lastFrameAt: number; /** The Time in MS that the last frame renderer at */

  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.scene = new THREE.Scene()
    this.world = createWorld()
    this.schedule = new Schedule<{ game: Game }>()
    this.schedule.createTag('update')
    this.deltaTime = 0;
    this.lastFrameAt = 0;
    this.init()
  }

  protected init(): void {
    // init renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // init resize handler
    window.addEventListener('resize', this.onWindowResize.bind(this))

    // init koota-three integration
    this.world.onAdd(Mesh, this.onMeshAdded.bind(this))
    this.world.onRemove(Mesh, this.onMeshRemoved.bind(this))
    this.schedule.add(syncTransformToMesh, { after: 'update' })
  }

  protected onMeshAdded(entity: Entity) {
    const mesh = entity.get(Mesh);
    if (!mesh) return
    mesh.userData.entity = entity;
    this.scene.add(mesh)
  }

  protected onMeshRemoved(entity: Entity) {
    const mesh = this.scene.children.find(obj => obj.userData.entity = entity)
    if (!mesh) return
    this.scene.remove(mesh)
  }

  protected onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  protected loop() {
    this.deltaTime = (Date.now() - this.lastFrameAt) / 1000;
    this.schedule.run({ game: this })
    this.render()
    this.lastFrameAt = Date.now();
    requestAnimationFrame(this.loop.bind(this))
  }

  protected render() {
    this.renderer.render(this.scene, this.camera)
  }

  start(): void {
    this.lastFrameAt = Date.now()
    this.schedule.build()
    requestAnimationFrame(this.loop.bind(this))
  }
}