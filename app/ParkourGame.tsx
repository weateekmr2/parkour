'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, Sky } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

interface Platform {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  type?: 'normal' | 'jump' | 'slide' | 'grind' | 'building' | 'wall'
  rotation?: [number, number, number]
}

const platforms: Platform[] = [
  // Ground area
  { position: [0, -0.5, 0], size: [40, 1, 40], color: '#4a5568', type: 'normal' },
  
  // Building 1 - Left side complex
  { position: [-20, 5, 0], size: [15, 10, 20], color: '#34495e', type: 'building' },
  { position: [-20, 10.5, 0], size: [15, 1, 20], color: '#2c3e50', type: 'normal' },
  { position: [-27.5, 5, 0], size: [1, 10, 20], color: '#2c3e50', type: 'wall' },
  { position: [-12.5, 5, 0], size: [1, 10, 20], color: '#2c3e50', type: 'wall' },
  
  // Building 2 - Right side complex
  { position: [20, 8, 0], size: [18, 16, 22], color: '#2d3436', type: 'building' },
  { position: [20, 16.5, 0], size: [18, 1, 22], color: '#2c3e50', type: 'normal' },
  { position: [29, 8, 0], size: [1, 16, 22], color: '#2c3e50', type: 'wall' },
  { position: [11, 8, 0], size: [1, 16, 22], color: '#2c3e50', type: 'wall' },
  
  // Central tower
  { position: [0, 15, -30], size: [12, 30, 12], color: '#34495e', type: 'building' },
  { position: [0, 30.5, -30], size: [12, 1, 12], color: '#e74c3c', type: 'jump' },
  { position: [-6, 15, -30], size: [1, 30, 12], color: '#2c3e50', type: 'wall' },
  { position: [6, 15, -30], size: [1, 30, 12], color: '#2c3e50', type: 'wall' },
  
  // Connection platforms
  { position: [10, 12, -15], size: [8, 1, 8], color: '#2c3e50', type: 'normal' },
  { position: [-10, 14, -15], size: [8, 1, 8], color: '#2c3e50', type: 'normal' },
  
  // Building 3 - Back complex
  { position: [25, 18, -40], size: [16, 36, 18], color: '#2d3436', type: 'building' },
  { position: [25, 36.5, -40], size: [16, 1, 18], color: '#27ae60', type: 'jump' },
  { position: [33, 18, -40], size: [1, 36, 18], color: '#2c3e50', type: 'wall' },
  { position: [17, 18, -40], size: [1, 36, 18], color: '#2c3e50', type: 'wall' },
  
  // Building 4 - Left back
  { position: [-25, 22, -40], size: [14, 44, 16], color: '#34495e', type: 'building' },
  { position: [-25, 44.5, -40], size: [14, 1, 16], color: '#27ae60', type: 'jump' },
  { position: [-32, 22, -40], size: [1, 44, 16], color: '#2c3e50', type: 'wall' },
  { position: [-18, 22, -40], size: [1, 44, 16], color: '#2c3e50', type: 'wall' },
  
  // Parkour course platforms
  { position: [15, 20, -20], size: [6, 1, 6], color: '#e74c3c', type: 'jump' },
  { position: [-15, 24, -25], size: [6, 1, 6], color: '#e74c3c', type: 'jump' },
  { position: [0, 38, -45], size: [8, 1, 8], color: '#27ae60', type: 'jump' },
  
  // Standalone walls for wallrunning
  { position: [0, 10, 15], size: [25, 20, 1], color: '#2c3e50', type: 'wall' },
  { position: [30, 12, -10], size: [1, 24, 20], color: '#2c3e50', type: 'wall' },
  { position: [-30, 15, -10], size: [1, 30, 20], color: '#2c3e50', type: 'wall' },
  
  // High platforms for advanced parkour
  { position: [0, 50, -55], size: [10, 1, 10], color: '#f39c12', type: 'normal' },
  { position: [15, 55, -60], size: [8, 1, 8], color: '#f39c12', type: 'normal' },
  { position: [-15, 60, -60], size: [8, 1, 8], color: '#f39c12', type: 'normal' },
]

interface TrickInfo {
  name: string
  points: number
  timestamp: number
}

function AdvancedFirstPersonCamera({ 
  speed
}: { 
  speed: number
}) {
  const targetFov = useRef(80)
  const currentFov = useRef(80)
  const bobTime = useRef(0)
  
  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera
    
    targetFov.current = 80 + Math.min(speed * 0.4, 25)
    currentFov.current += (targetFov.current - currentFov.current) * delta * 5
    cam.fov = currentFov.current
    cam.updateProjectionMatrix()
    
    if (speed > 2) {
      bobTime.current += delta * speed * 0.12
      const bobY = Math.sin(bobTime.current) * 0.01
      cam.position.y += bobY
    }
  })
  
  return null
}

function FirstPersonHands({ 
  speed, 
  isGrounded, 
  isWallrunning, 
  isGrappling,
  wallrunSide 
}: { 
  speed: number
  isGrounded: boolean
  isWallrunning: boolean
  isGrappling: boolean
  wallrunSide: 'left' | 'right' | null
}) {
  const leftHandRef = useRef<THREE.Group>(null)
  const rightHandRef = useRef<THREE.Group>(null)
  const bobTime = useRef(0)
  
  useFrame((state, delta) => {
    if (!leftHandRef.current || !rightHandRef.current) return
    
    // Running animation
    if (isGrounded && speed > 1) {
      bobTime.current += delta * speed * 0.3
      
      const leftBob = Math.sin(bobTime.current) * 0.08
      const rightBob = Math.sin(bobTime.current + Math.PI) * 0.08
      const swingX = Math.cos(bobTime.current) * 0.1
      
      leftHandRef.current.position.set(-0.35 + swingX, -0.45 + leftBob, -0.8)
      leftHandRef.current.rotation.set(0.2 + leftBob * 2, 0.3, 0.1 + swingX)
      
      rightHandRef.current.position.set(0.35 - swingX, -0.45 + rightBob, -0.8)
      rightHandRef.current.rotation.set(0.2 + rightBob * 2, -0.3, -0.1 - swingX)
    }
    // Wallrun animation
    else if (isWallrunning) {
      const targetLeftPos = wallrunSide === 'left' ? 
        new THREE.Vector3(-0.5, -0.3, -0.7) : 
        new THREE.Vector3(-0.3, -0.5, -0.9)
      const targetRightPos = wallrunSide === 'right' ? 
        new THREE.Vector3(0.5, -0.3, -0.7) : 
        new THREE.Vector3(0.3, -0.5, -0.9)
      
      leftHandRef.current.position.lerp(targetLeftPos, delta * 10)
      rightHandRef.current.position.lerp(targetRightPos, delta * 10)
      
      leftHandRef.current.rotation.set(0.1, 0.5, wallrunSide === 'left' ? 0.5 : 0)
      rightHandRef.current.rotation.set(0.1, -0.5, wallrunSide === 'right' ? -0.5 : 0)
    }
    // Grappling animation
    else if (isGrappling) {
      bobTime.current += delta * 8
      const grapplingBob = Math.sin(bobTime.current) * 0.03
      
      leftHandRef.current.position.set(-0.25, -0.35 + grapplingBob, -0.7)
      leftHandRef.current.rotation.set(-0.2, 0.4, 0.2)
      
      rightHandRef.current.position.set(0.45, -0.25 - grapplingBob, -0.6)
      rightHandRef.current.rotation.set(-0.3, -0.2, -0.1)
    }
    // Idle/air animation
    else {
      bobTime.current += delta * 3
      const idleBob = Math.sin(bobTime.current) * 0.01
      
      leftHandRef.current.position.set(-0.3, -0.5 + idleBob, -0.8)
      leftHandRef.current.rotation.set(0.2, 0.3, 0.1)
      
      rightHandRef.current.position.set(0.3, -0.5 - idleBob, -0.8)
      rightHandRef.current.rotation.set(0.2, -0.3, -0.1)
    }
  })
  
  return (
    <group>
      {/* Left Hand */}
      <group ref={leftHandRef}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.25, 0.1]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.18]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        {/* Fingers */}
        <mesh position={[0.03, -0.24, 0.05]} castShadow>
          <boxGeometry args={[0.02, 0.06, 0.02]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.24, 0.05]} castShadow>
          <boxGeometry args={[0.02, 0.06, 0.02]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
      </group>
      
      {/* Right Hand */}
      <group ref={rightHandRef}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.25, 0.1]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.18]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        {/* Fingers */}
        <mesh position={[-0.03, -0.24, 0.05]} castShadow>
          <boxGeometry args={[0.02, 0.06, 0.02]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.24, 0.05]} castShadow>
          <boxGeometry args={[0.02, 0.06, 0.02]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

function GrapplingHookModel({ 
  isGrappling, 
  grapplePoint,
  isFiring 
}: { 
  isGrappling: boolean
  grapplePoint: THREE.Vector3 | null
  isFiring: boolean
}) {
  const { camera } = useThree()
  const hookRef = useRef<THREE.Group>(null)
  const animationTime = useRef(0)
  
  useFrame((state, delta) => {
    if (!hookRef.current) return
    
    if (isGrappling && grapplePoint) {
      const direction = new THREE.Vector3()
      direction.subVectors(grapplePoint, camera.position).normalize()
      
      hookRef.current.position.set(0.45, -0.25, -0.6)
      hookRef.current.lookAt(camera.position.clone().add(direction))
      hookRef.current.rotateX(Math.PI / 4)
      
      // Recoil animation
      animationTime.current += delta * 10
      const recoil = Math.max(0, 1 - animationTime.current * 0.5)
      hookRef.current.position.x -= recoil * 0.1
    } else if (isFiring) {
      animationTime.current = 0
      hookRef.current.position.set(0.45, -0.3, -0.65)
      hookRef.current.rotation.set(-0.2, 0, 0)
    } else {
      hookRef.current.position.set(0.45, -0.35, -0.7)
      hookRef.current.rotation.set(0, 0, 0)
      animationTime.current = 0
    }
  })
  
  return (
    <group ref={hookRef}>
      {/* Handle */}
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Barrel */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.15, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Hook tip */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <coneGeometry args={[0.06, 0.12, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Hook prongs */}
      <mesh position={[0.05, 0.3, 0]} rotation={[0, 0, Math.PI / 3]} castShadow>
        <boxGeometry args={[0.1, 0.025, 0.025]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.05, 0.3, 0]} rotation={[0, 0, -Math.PI / 3]} castShadow>
        <boxGeometry args={[0.1, 0.025, 0.025]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Details */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <torusGeometry args={[0.045, 0.01, 8, 16]} />
        <meshStandardMaterial color="#ff4444" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

function Player({ onTrick, onSpeedUpdate }: { onTrick: (trick: TrickInfo) => void, onSpeedUpdate: (speed: number) => void }) {
  const { camera } = useThree()
  const velocityRef = useRef(new THREE.Vector3())
  const [isGrappling, setIsGrappling] = useState(false)
  const [grapplePoint, setGrapplePoint] = useState<THREE.Vector3 | null>(null)
  const [grappleRope, setGrappleRope] = useState<[THREE.Vector3, THREE.Vector3] | null>(null)
  const [isWallrunning, setIsWallrunning] = useState(false)
  const [wallrunSide, setWallrunSide] = useState<'left' | 'right' | null>(null)
  const [isFiring, setIsFiring] = useState(false)
  const [isGrounded, setIsGrounded] = useState(false)
  const keysPressed = useRef<Set<string>>(new Set())
  const isGroundedRef = useRef(false)
  const lastJumpTime = useRef(0)
  const lastGrappleTime = useRef(0)
  const wallrunTimeRef = useRef(0)
  const airTimeRef = useRef(0)
  const lastSpeedCheck = useRef(0)
  const lastTrickTime = useRef(0)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code)
      
      // Jump
      if (e.code === 'Space') {
        if (isGroundedRef.current && Date.now() - lastJumpTime.current > 300) {
          velocityRef.current.y = 12
          isGroundedRef.current = false
          lastJumpTime.current = Date.now()
        }
        // Wall jump
        else if (isWallrunning && Date.now() - lastJumpTime.current > 300) {
          velocityRef.current.y = 14
          const jumpDirection = wallrunSide === 'left' ? 1 : -1
          
          const right = new THREE.Vector3()
          const forward = new THREE.Vector3()
          camera.getWorldDirection(forward)
          right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
          
          velocityRef.current.x += right.x * jumpDirection * 15
          velocityRef.current.z += right.z * jumpDirection * 15
          
          setIsWallrunning(false)
          setWallrunSide(null)
          lastJumpTime.current = Date.now()
          onTrick({ name: 'Wall Jump!', points: 100, timestamp: Date.now() })
        }
      }
      
      // Grapple
      if (e.code === 'KeyE') {
        handleGrapple()
      }
      
      // Tricks
      if (!isGroundedRef.current && Date.now() - lastTrickTime.current > 1000) {
        if (e.code === 'KeyQ') {
          onTrick({ name: 'Barrel Roll', points: 100, timestamp: Date.now() })
          lastTrickTime.current = Date.now()
        }
        if (e.code === 'KeyZ') {
          onTrick({ name: 'Front Flip', points: 150, timestamp: Date.now() })
          lastTrickTime.current = Date.now()
        }
        if (e.code === 'KeyX') {
          onTrick({ name: 'Back Flip', points: 150, timestamp: Date.now() })
          lastTrickTime.current = Date.now()
        }
        if (e.code === 'KeyC') {
          onTrick({ name: '360 Spin', points: 200, timestamp: Date.now() })
          lastTrickTime.current = Date.now()
        }
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code)
    }
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        handleGrapple()
      }
    }
    
    const handleGrapple = () => {
      if (Date.now() - lastGrappleTime.current < 500) return
      lastGrappleTime.current = Date.now()
      setIsFiring(true)
      setTimeout(() => setIsFiring(false), 200)
      
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
      
      const intersects: THREE.Intersection[] = []
      platforms.forEach((platform) => {
        const [px, py, pz] = platform.position
        const [sx, sy, sz] = platform.size
        
        const box = new THREE.Box3(
          new THREE.Vector3(px - sx / 2, py - sy / 2, pz - sz / 2),
          new THREE.Vector3(px + sx / 2, py + sy / 2, pz + sz / 2)
        )
        
        const intersection = raycaster.ray.intersectBox(box, new THREE.Vector3())
        if (intersection) {
          intersects.push({
            distance: camera.position.distanceTo(intersection),
            point: intersection,
            object: null as unknown as THREE.Object3D,
          })
        }
      })
      
      if (intersects.length > 0) {
        intersects.sort((a, b) => a.distance - b.distance)
        const closest = intersects[0]
        
        if (closest.distance < 150) {
          setIsGrappling(true)
          setGrapplePoint(closest.point.clone())
          
          if (airTimeRef.current > 1) {
            onTrick({ name: 'Grapple Master', points: 50, timestamp: Date.now() })
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [camera, onTrick, isWallrunning, wallrunSide])
  
  useFrame((state, delta) => {
    const speed = 15
    const airControl = 0.4
    const controlFactor = isGroundedRef.current ? 1 : (isWallrunning ? 0.8 : airControl)
    
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
    
    const moveDirection = new THREE.Vector3()
    if (keysPressed.current.has('KeyW')) moveDirection.add(forward)
    if (keysPressed.current.has('KeyS')) moveDirection.sub(forward)
    if (keysPressed.current.has('KeyD')) moveDirection.add(right)
    if (keysPressed.current.has('KeyA')) moveDirection.sub(right)
    
    if (moveDirection.length() > 0) {
      moveDirection.normalize()
      velocityRef.current.x += moveDirection.x * speed * delta * controlFactor
      velocityRef.current.z += moveDirection.z * speed * delta * controlFactor
    }
    
    // Grappling hook physics
    if (isGrappling && grapplePoint) {
      const toGrapple = new THREE.Vector3()
      toGrapple.subVectors(grapplePoint, camera.position)
      const distance = toGrapple.length()
      
      if (distance > 2) {
        toGrapple.normalize()
        const pullStrength = 45
        velocityRef.current.add(toGrapple.multiplyScalar(pullStrength * delta))
        setGrappleRope([camera.position.clone(), grapplePoint.clone()])
      } else {
        setIsGrappling(false)
        setGrapplePoint(null)
        setGrappleRope(null)
      }
    } else {
      setGrappleRope(null)
    }
    
    // Wallrunning detection and physics
    if (!isGroundedRef.current && !isGrappling) {
      let foundWall = false
      const wallNormal = new THREE.Vector3()
      const wallPosition = new THREE.Vector3()
      
      for (const platform of platforms) {
        if (platform.type !== 'wall') continue
        
        const [px, py, pz] = platform.position
        const [sx, sy, sz] = platform.size
        
        const playerPos = camera.position
        
        const closestPoint = new THREE.Vector3()
        let minDist = Infinity
        const normal = new THREE.Vector3()
        
        const faces = [
          { point: new THREE.Vector3(px - sx / 2, py, pz), normal: new THREE.Vector3(-1, 0, 0) },
          { point: new THREE.Vector3(px + sx / 2, py, pz), normal: new THREE.Vector3(1, 0, 0) },
          { point: new THREE.Vector3(px, py, pz - sz / 2), normal: new THREE.Vector3(0, 0, -1) },
          { point: new THREE.Vector3(px, py, pz + sz / 2), normal: new THREE.Vector3(0, 0, 1) },
        ]
        
        for (const face of faces) {
          const dist = Math.abs(
            (playerPos.x - face.point.x) * face.normal.x +
            (playerPos.z - face.point.z) * face.normal.z
          )
          
          if (dist < minDist && dist < 2.0) {
            const projX = playerPos.x - face.normal.x * dist
            const projZ = playerPos.z - face.normal.z * dist
            
            const withinBoundsX = projX >= px - sx / 2 - 1 && projX <= px + sx / 2 + 1
            const withinBoundsZ = projZ >= pz - sz / 2 - 1 && projZ <= pz + sz / 2 + 1
            const withinBoundsY = playerPos.y >= py - sy / 2 && playerPos.y <= py + sy / 2
            
            if (withinBoundsX && withinBoundsZ && withinBoundsY) {
              minDist = dist
              closestPoint.set(projX, playerPos.y, projZ)
              normal.copy(face.normal)
            }
          }
        }
        
        if (minDist < 2.0) {
          const horizontalSpeed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.z ** 2)
          
          const velocityDir = new THREE.Vector3(velocityRef.current.x, 0, velocityRef.current.z).normalize()
          const angleToWall = Math.abs(velocityDir.dot(normal))
          
          if (horizontalSpeed > 5 && angleToWall < 0.7) {
            foundWall = true
            wallNormal.copy(normal)
            wallPosition.copy(closestPoint)
            
            if (!isWallrunning) {
              setIsWallrunning(true)
              wallrunTimeRef.current = 0
              onTrick({ name: 'Wallrun!', points: 75, timestamp: Date.now() })
            }
            
            const cross = forward.clone().cross(wallNormal)
            setWallrunSide(cross.y > 0 ? 'left' : 'right')
            
            wallrunTimeRef.current += delta
            
            const up = new THREE.Vector3(0, 1, 0)
            const wallRight = new THREE.Vector3().crossVectors(wallNormal, up).normalize()
            
            const currentVelOnWall = new THREE.Vector3(velocityRef.current.x, 0, velocityRef.current.z)
            const velocityAlongWall = currentVelOnWall.dot(wallRight)
            
            const wallDirection = wallRight.clone().multiplyScalar(velocityAlongWall > 0 ? 1 : -1)
            
            const targetSpeed = Math.max(horizontalSpeed * 0.95, 12)
            const targetVelocity = wallDirection.multiplyScalar(targetSpeed)
            
            velocityRef.current.x = THREE.MathUtils.lerp(velocityRef.current.x, targetVelocity.x, delta * 8)
            velocityRef.current.z = THREE.MathUtils.lerp(velocityRef.current.z, targetVelocity.z, delta * 8)
            
            const pushFromWall = wallNormal.clone().multiplyScalar(0.5)
            velocityRef.current.x += pushFromWall.x * delta * 10
            velocityRef.current.z += pushFromWall.z * delta * 10
            
            if (wallrunTimeRef.current < 2.5) {
              velocityRef.current.y = Math.max(velocityRef.current.y, -1)
              velocityRef.current.y += 12 * delta
            } else {
              velocityRef.current.y = Math.max(velocityRef.current.y, -3)
            }
            
            break
          }
        }
      }
      
      if (!foundWall && isWallrunning) {
        setIsWallrunning(false)
        setWallrunSide(null)
      }
    } else if (isGroundedRef.current && isWallrunning) {
      setIsWallrunning(false)
      setWallrunSide(null)
    }
    
    // Gravity
    if (!isGrappling) {
      const gravityMultiplier = isWallrunning ? 0.3 : 1
      velocityRef.current.y -= 30 * delta * gravityMultiplier
    } else {
      velocityRef.current.y -= 10 * delta
    }
    
    // Friction
    const friction = isGroundedRef.current ? 0.82 : (isWallrunning ? 0.95 : 0.99)
    velocityRef.current.x *= friction
    velocityRef.current.z *= friction
    
    // Speed limit
    const maxHorizontalSpeed = 50
    const horizontalSpeed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.z ** 2)
    if (horizontalSpeed > maxHorizontalSpeed) {
      const scale = maxHorizontalSpeed / horizontalSpeed
      velocityRef.current.x *= scale
      velocityRef.current.z *= scale
    }
    
    // Update speed display
    if (Date.now() - lastSpeedCheck.current > 100) {
      setCurrentSpeed(horizontalSpeed)
      onSpeedUpdate(horizontalSpeed)
      lastSpeedCheck.current = Date.now()
    }
    
    // Movement and collision
    const nextPosition = camera.position.clone()
    nextPosition.add(velocityRef.current.clone().multiplyScalar(delta))
    
    const wasGrounded = isGroundedRef.current
    isGroundedRef.current = false
    let newGroundedState = false
    
    platforms.forEach((platform) => {
      if (platform.type === 'building' || platform.type === 'wall') return
      
      const [px, py, pz] = platform.position
      const [sx, sy, sz] = platform.size
      
      const minX = px - sx / 2
      const maxX = px + sx / 2
      const minY = py - sy / 2
      const maxY = py + sy / 2
      const minZ = pz - sz / 2
      const maxZ = pz + sz / 2
      
      const playerRadius = 0.5
      const playerHeight = 1.8
      
      if (
        nextPosition.x + playerRadius > minX &&
        nextPosition.x - playerRadius < maxX &&
        nextPosition.z + playerRadius > minZ &&
        nextPosition.z - playerRadius < maxZ
      ) {
        if (
          camera.position.y - playerHeight / 2 >= maxY &&
          nextPosition.y - playerHeight / 2 < maxY
        ) {
          nextPosition.y = maxY + playerHeight / 2
          
          if (platform.type === 'jump') {
            velocityRef.current.y = Math.max(velocityRef.current.y * -1.2, 15)
            onTrick({ name: 'Jump Boost!', points: 25, timestamp: Date.now() })
          } else {
            velocityRef.current.y = Math.max(0, velocityRef.current.y)
          }
          
          isGroundedRef.current = true
          newGroundedState = true
          
          if (!wasGrounded && airTimeRef.current > 2) {
            const landingSpeed = horizontalSpeed
            if (landingSpeed > 30) {
              onTrick({ name: 'Speed Landing!', points: Math.floor(landingSpeed * 2), timestamp: Date.now() })
            }
          }
          
          airTimeRef.current = 0
          
          if (isGrappling) {
            setIsGrappling(false)
            setGrapplePoint(null)
            setGrappleRope(null)
          }
        }
        else if (
          camera.position.y + playerHeight / 2 <= minY &&
          nextPosition.y + playerHeight / 2 > minY
        ) {
          nextPosition.y = minY - playerHeight / 2
          velocityRef.current.y = Math.min(0, velocityRef.current.y)
        }
      }
    })
    
    setIsGrounded(newGroundedState)
    
    if (!isGroundedRef.current) {
      airTimeRef.current += delta
    }
    
    // Respawn if fallen
    if (nextPosition.y < -30) {
      nextPosition.set(0, 10, 0)
      velocityRef.current.set(0, 0, 0)
      setIsGrappling(false)
      setGrapplePoint(null)
      setGrappleRope(null)
      setIsWallrunning(false)
      setWallrunSide(null)
    }
    
    camera.position.copy(nextPosition)
  })
  
  return (
    <>
      <AdvancedFirstPersonCamera 
        speed={currentSpeed}
      />
      <FirstPersonHands 
        speed={currentSpeed}
        isGrounded={isGrounded}
        isWallrunning={isWallrunning}
        isGrappling={isGrappling}
        wallrunSide={wallrunSide}
      />
      <GrapplingHookModel 
        isGrappling={isGrappling} 
        grapplePoint={grapplePoint}
        isFiring={isFiring}
      />
      {grappleRope && (() => {
        const points = []
        const segments = 10
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const point = new THREE.Vector3()
          point.lerpVectors(grappleRope[0], grappleRope[1], t)
          const sag = Math.sin(t * Math.PI) * Math.min(grappleRope[0].distanceTo(grappleRope[1]) * 0.1, 3)
          point.y -= sag
          points.push(point)
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        return (
          <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
            color: '#00ff88', 
            linewidth: 2 
          }))} />
        )
      })()}
      {grapplePoint && (
        <mesh position={[grapplePoint.x, grapplePoint.y, grapplePoint.z]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial 
            color="#00ff88" 
            emissive="#00ff88" 
            emissiveIntensity={2}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </>
  )
}

function RealisticEnvironment() {
  return (
    <>
      {platforms.map((platform, index) => {
        const isBuilding = platform.type === 'building'
        const isWall = platform.type === 'wall'
        const isJump = platform.type === 'jump'
        
        return (
          <group key={index}>
            <mesh 
              position={platform.position} 
              rotation={platform.rotation || [0, 0, 0]}
              receiveShadow 
              castShadow
            >
              <boxGeometry args={platform.size} />
              <meshStandardMaterial 
                color={platform.color}
                metalness={isBuilding ? 0.3 : isWall ? 0.5 : 0.2}
                roughness={isBuilding ? 0.8 : isWall ? 0.6 : 0.9}
                emissive={isJump ? platform.color : '#000000'}
                emissiveIntensity={isJump ? 0.4 : 0}
              />
            </mesh>
            
            {/* Window details for buildings */}
            {isBuilding && (() => {
              const windows = []
              const [sx, sy, sz] = platform.size
              const [px, py, pz] = platform.position
              
              const windowsX = Math.floor(sx / 3)
              const windowsY = Math.floor(sy / 3)
              
              for (let i = 0; i < windowsX; i++) {
                for (let j = 0; j < windowsY; j++) {
                  const x = px - sx / 2 + (i + 0.5) * (sx / windowsX)
                  const y = py - sy / 2 + (j + 0.5) * (sy / windowsY)
                  
                  // Front face
                  windows.push(
                    <mesh key={`f-${i}-${j}`} position={[x, y, pz + sz / 2 + 0.1]} castShadow>
                      <boxGeometry args={[1, 1.2, 0.1]} />
                      <meshStandardMaterial 
                        color="#87ceeb" 
                        emissive="#4a90a4"
                        emissiveIntensity={0.3}
                        metalness={0.9}
                        roughness={0.1}
                      />
                    </mesh>
                  )
                  
                  // Back face
                  windows.push(
                    <mesh key={`b-${i}-${j}`} position={[x, y, pz - sz / 2 - 0.1]} castShadow>
                      <boxGeometry args={[1, 1.2, 0.1]} />
                      <meshStandardMaterial 
                        color="#87ceeb" 
                        emissive="#4a90a4"
                        emissiveIntensity={0.3}
                        metalness={0.9}
                        roughness={0.1}
                      />
                    </mesh>
                  )
                }
              }
              
              return <>{windows}</>
            })()}
            
            {/* Jump pad indicator */}
            {isJump && (
              <mesh position={[platform.position[0], platform.position[1] + 0.6, platform.position[2]]}>
                <coneGeometry args={[0.8, 1.5, 4]} />
                <meshStandardMaterial 
                  color="#ffff00" 
                  emissive="#ffff00" 
                  emissiveIntensity={0.8}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            )}
            
            {/* Wall grip indicators */}
            {isWall && (() => {
              const grips = []
              const [sx, sy, sz] = platform.size
              const [px, py, pz] = platform.position
              const count = 8
              
              for (let i = 0; i < count; i++) {
                const offset = (i / count) * Math.max(sx, sy, sz)
                grips.push(
                  <mesh 
                    key={i} 
                    position={[
                      px + (sx > 1 ? -sx / 2 + offset : 0),
                      py + (sy > 1 ? -sy / 2 + offset : 0),
                      pz + (sz > 1 ? -sz / 2 + offset : 0)
                    ]}
                    castShadow
                  >
                    <boxGeometry args={[0.3, 0.3, 0.3]} />
                    <meshStandardMaterial 
                      color="#ff6b6b" 
                      emissive="#ff6b6b"
                      emissiveIntensity={0.2}
                      roughness={0.8}
                    />
                  </mesh>
                )
              }
              return <>{grips}</>
            })()}
          </group>
        )
      })}
      
      {/* Ground plane */}
      <mesh position={[0, -10, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>
      
      {/* Fog effect */}
      <fog attach="fog" args={['#0d1117', 50, 200]} />
    </>
  )
}

function HUD({ speed, tricks, score }: { speed: number, tricks: TrickInfo[], score: number }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white p-4 rounded-lg border border-cyan-500/50">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="text-cyan-400 font-mono text-xs">SPEED</div>
            <div className="flex-1">
              <div className="h-2 w-32 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                  style={{ width: `${Math.min((speed / 50) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="font-bold text-lg min-w-[60px] text-right">
              {Math.floor(speed)}
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-cyan-500/30">
            <div className="text-yellow-400 font-mono text-xs">SCORE</div>
            <div className="font-bold text-2xl text-yellow-400">{score}</div>
          </div>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg border border-purple-500/50 max-w-xs">
        <div className="text-purple-400 font-mono text-xs mb-2">TRICKS</div>
        <div className="space-y-1 max-h-40 overflow-hidden">
          {tricks.slice(-5).reverse().map((trick, i) => (
            <div 
              key={trick.timestamp} 
              className="flex justify-between items-center text-sm animate-fade-in"
              style={{ 
                animation: 'slideIn 0.3s ease-out',
                opacity: 1 - (i * 0.15)
              }}
            >
              <span className="text-white font-semibold">{trick.name}</span>
              <span className="text-yellow-400 ml-2">+{trick.points}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg border border-green-500/50">
        <div className="text-green-400 font-mono text-xs mb-2">CONTROLS</div>
        <div className="text-xs space-y-1">
          <div className="flex gap-2"><span className="text-gray-400">WASD</span> Move</div>
          <div className="flex gap-2"><span className="text-gray-400">Space</span> Jump/Wall Jump</div>
          <div className="flex gap-2"><span className="text-gray-400">E/Click</span> Grapple</div>
          <div className="flex gap-2"><span className="text-gray-400">Q/Z/X/C</span> Air Tricks</div>
        </div>
      </div>
      
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-8 h-8">
          <div className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-cyan-400 -translate-x-1/2 -translate-y-full shadow-lg shadow-cyan-500/50" />
          <div className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-cyan-400 -translate-x-1/2 shadow-lg shadow-cyan-500/50" />
          <div className="absolute left-1/2 top-1/2 w-3 h-0.5 bg-cyan-400 -translate-y-1/2 -translate-x-full shadow-lg shadow-cyan-500/50" />
          <div className="absolute left-1/2 top-1/2 w-3 h-0.5 bg-cyan-400 -translate-y-1/2 shadow-lg shadow-cyan-500/50" />
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 border-2 border-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-cyan-500/50" />
        </div>
      </div>
    </div>
  )
}

function Instructions() {
  const [show, setShow] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 12000)
    return () => clearTimeout(timer)
  }, [])
  
  if (!show) return null
  
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white px-8 py-6 rounded-lg z-40 backdrop-blur-sm border-2 border-cyan-500 max-w-lg">
      <h2 className="font-bold text-2xl mb-4 text-center text-cyan-400">🎮 ADVANCED PARKOUR MASTER 🎮</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h3 className="font-bold text-green-400 mb-2">Movement</h3>
          <p><strong className="text-cyan-300">WASD:</strong> Move</p>
          <p><strong className="text-cyan-300">Mouse:</strong> Look</p>
          <p><strong className="text-cyan-300">Space:</strong> Jump</p>
          <p><strong className="text-cyan-300">Click/E:</strong> Grapple Hook</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-purple-400 mb-2">Tricks (in air)</h3>
          <p><strong className="text-cyan-300">Q:</strong> Barrel Roll</p>
          <p><strong className="text-cyan-300">Z:</strong> Front Flip</p>
          <p><strong className="text-cyan-300">X:</strong> Back Flip</p>
          <p><strong className="text-cyan-300">C:</strong> 360 Spin</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-cyan-500/50 space-y-2">
        <p className="text-yellow-400 text-center font-semibold">🚀 Build momentum and chain tricks! 🚀</p>
        <p className="text-pink-400 text-xs text-center">🧗 Run along RED walls for wallrunning!</p>
        <p className="text-green-400 text-xs text-center">⚡ Use grappling hook to swing between buildings!</p>
        <p className="text-purple-400 text-xs text-center">⬆️ Jump while wallrunning for a boost!</p>
      </div>
    </div>
  )
}

export default function ParkourGame() {
  const [isLocked, setIsLocked] = useState(false)
  const [speed, setSpeed] = useState(0)
  const [tricks, setTricks] = useState<TrickInfo[]>([])
  const [score, setScore] = useState(0)
  
  const handleTrick = (trick: TrickInfo) => {
    setTricks(prev => [...prev, trick])
    setScore(prev => prev + trick.points)
  }
  
  const handleSpeedUpdate = (newSpeed: number) => {
    setSpeed(newSpeed)
  }
  
  return (
    <div className="w-screen h-screen">
      <Canvas
        shadows
        camera={{ position: [0, 5, 0], fov: 80 }}
      >
        <Sky 
          sunPosition={[100, 20, 100]} 
          turbidity={8}
          rayleigh={2}
        />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={300}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
        <pointLight position={[0, 30, 0]} intensity={0.6} color="#4dabf7" />
        <pointLight position={[50, 50, 50]} intensity={0.4} color="#ff6b6b" />
        <pointLight position={[-50, 40, -50]} intensity={0.4} color="#51cf66" />
        
        <RealisticEnvironment />
        <Player onTrick={handleTrick} onSpeedUpdate={handleSpeedUpdate} />
        
        <PointerLockControls
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
        />
      </Canvas>
      
      {!isLocked && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-30">
          <div className="bg-gradient-to-br from-cyan-900/90 to-purple-900/90 text-white px-12 py-8 rounded-xl text-center border-2 border-cyan-400 shadow-2xl">
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              ADVANCED PARKOUR MASTER
            </h1>
            <p className="mb-6 text-lg">Click anywhere to start playing!</p>
            <div className="space-y-2 text-sm">
              <p className="text-cyan-300">🧗 Wallrun on vertical surfaces</p>
              <p className="text-green-300">🪝 Grappling hook with realistic physics</p>
              <p className="text-purple-300">🤸 Perform tricks for extra points</p>
              <p className="text-yellow-300">🏙️ Explore a realistic urban environment</p>
            </div>
          </div>
        </div>
      )}
      
      {isLocked && (
        <>
          <HUD speed={speed} tricks={tricks} score={score} />
          <Instructions />
        </>
      )}
      
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
