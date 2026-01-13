import { trait } from 'koota'
import { Game, Mesh, Transform, type System } from './game'
import * as THREE from 'three'
import './style.css'

const RotationalVelocity = trait(() => new THREE.Vector3())

const ApplyRotVelocitySystem: System = ({ game }) => {
  game.world.query(Transform, RotationalVelocity).updateEach(([transform, rotVel]) => {
    transform.rotation.set(
      transform.rotation.x + rotVel.x * game.deltaTime,
      transform.rotation.y + rotVel.y * game.deltaTime,
      transform.rotation.z + rotVel.z * game.deltaTime
    )
  })
}

const game = new Game()
game.schedule.add(ApplyRotVelocitySystem, { tag: 'update' })
game.start()

// set initial camera position
game.camera.position.set(0, 5, -5)
game.camera.lookAt(0, 0, 0)

// spawn cube
game.world.spawn(
  Transform,
  RotationalVelocity(new THREE.Vector3(0.5, 0.5, 0.5)),
  Mesh(new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      color: "blue"
    })
  ))
)

