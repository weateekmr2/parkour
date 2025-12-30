'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, Sky } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

interface Platform {
  position: [number, number, number]
  size: [number, number, number]
  color: string
}

const platforms: Platform[] = [
  { position: [0, -0.5, 0], size: [20, 1, 20], color: '#4a5568' },
  { position: [15, 2, 0], size: [10, 1, 10], color: '#2d3748' },
  { position: [30, 6, 5], size: [8, 1, 8], color: '#1a202c' },
  { position: [25, 10, -10], size: [12, 1, 12], color: '#2d3748' },
  { position: [10, 15, -15], size: [10, 1, 10], color: '#4a5568' },
  { position: [-10, 5, -5], size: [8, 1, 8], color: '#2d3748' },
  { position: [-20, 8, 5], size: [10, 1, 10], color: '#1a202c' },
  { position: [-15, 12, 15], size: [12, 1, 12], color: '#4a5568' },
  { position: [5, 18, 10], size: [10, 1, 10], color: '#2d3748' },
  { position: [20, 22, 0], size: [15, 1, 15], color: '#1a202c' },
  { position: [0, 25, -20], size: [10, 1, 10], color: '#4a5568' },
  { position: [-25, 15, -10], size: [8, 1, 8], color: '#2d3748' },
  { position: [35, 12, 15], size: [10, 1, 10], color: '#1a202c' },
  { position: [-5, 20, 20], size: [12, 1, 12], color: '#4a5568' },
]

function Player() {
  const { camera } = useThree()
  const velocityRef = useRef(new THREE.Vector3())
  const [isGrappling, setIsGrappling] = useState(false)
  const [grapplePoint, setGrapplePoint] = useState<THREE.Vector3 | null>(null)
  const [grappleRope, setGrappleRope] = useState<[THREE.Vector3, THREE.Vector3] | null>(null)
  const keysPressed = useRef<Set<string>>(new Set())
  const isGroundedRef = useRef(false)
  const lastJumpTime = useRef(0)
  const lastGrappleTime = useRef(0)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code)
      
      if (e.code === 'Space' && isGroundedRef.current && Date.now() - lastJumpTime.current > 300) {
        velocityRef.current.y = 12
        isGroundedRef.current = false
        lastJumpTime.current = Date.now()
      }
      
      if (e.code === 'KeyE') {
        handleGrapple()
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
      if (Date.now() - lastGrappleTime.current < 100) return
      lastGrappleTime.current = Date.now()
      
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
      
      const intersects: THREE.Intersection[] = []
      platforms.forEach((platform) => {
        const box = new THREE.Box3(
          new THREE.Vector3(
            platform.position[0] - platform.size[0] / 2,
            platform.position[1] - platform.size[1] / 2,
            platform.position[2] - platform.size[2] / 2
          ),
          new THREE.Vector3(
            platform.position[0] + platform.size[0] / 2,
            platform.position[1] + platform.size[1] / 2,
            platform.position[2] + platform.size[2] / 2
          )
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
        
        if (closest.distance < 100) {
          setIsGrappling(true)
          setGrapplePoint(closest.point.clone())
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
  }, [camera])
  
  useFrame((state, delta) => {
    const speed = 15
    const airControl = 0.4
    const controlFactor = isGroundedRef.current ? 1 : airControl
    
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
    
    if (isGrappling && grapplePoint) {
      const toGrapple = new THREE.Vector3()
      toGrapple.subVectors(grapplePoint, camera.position)
      const distance = toGrapple.length()
      
      if (distance > 2) {
        toGrapple.normalize()
        const pullStrength = 35
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
    
    if (!isGrappling) {
      velocityRef.current.y -= 30 * delta
    } else {
      velocityRef.current.y -= 15 * delta
    }
    
    const friction = isGroundedRef.current ? 0.85 : 0.99
    velocityRef.current.x *= friction
    velocityRef.current.z *= friction
    
    const maxHorizontalSpeed = 40
    const horizontalSpeed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.z ** 2)
    if (horizontalSpeed > maxHorizontalSpeed) {
      const scale = maxHorizontalSpeed / horizontalSpeed
      velocityRef.current.x *= scale
      velocityRef.current.z *= scale
    }
    
    const nextPosition = camera.position.clone()
    nextPosition.add(velocityRef.current.clone().multiplyScalar(delta))
    
    isGroundedRef.current = false
    
    platforms.forEach((platform) => {
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
          velocityRef.current.y = Math.max(0, velocityRef.current.y)
          isGroundedRef.current = true
          
          if (isGrappling) {
            setIsGrappling(false)
            setGrapplePoint(null)
            setGrappleRope(null)
          }
        } else if (
          camera.position.y + playerHeight / 2 <= minY &&
          nextPosition.y + playerHeight / 2 > minY
        ) {
          nextPosition.y = minY - playerHeight / 2
          velocityRef.current.y = Math.min(0, velocityRef.current.y)
        }
      }
    })
    
    if (nextPosition.y < -30) {
      nextPosition.set(0, 10, 0)
      velocityRef.current.set(0, 0, 0)
      setIsGrappling(false)
      setGrapplePoint(null)
      setGrappleRope(null)
    }
    
    camera.position.copy(nextPosition)
  })
  
  return (
    <>
      {grappleRope && (() => {
        const points = []
        points.push(grappleRope[0])
        points.push(grappleRope[1])
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        return (
          <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#00ff00' }))} />
        )
      })()}
      {grapplePoint && (
        <mesh position={[grapplePoint.x, grapplePoint.y, grapplePoint.z]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
        </mesh>
      )}
    </>
  )
}

function Platforms() {
  return (
    <>
      {platforms.map((platform, index) => (
        <mesh key={index} position={platform.position} receiveShadow castShadow>
          <boxGeometry args={platform.size} />
          <meshStandardMaterial color={platform.color} />
        </mesh>
      ))}
    </>
  )
}

function Crosshair() {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="relative w-8 h-8">
        <div className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-white -translate-x-1/2 -translate-y-full" />
        <div className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-white -translate-x-1/2" />
        <div className="absolute left-1/2 top-1/2 w-3 h-0.5 bg-white -translate-y-1/2 -translate-x-full" />
        <div className="absolute left-1/2 top-1/2 w-3 h-0.5 bg-white -translate-y-1/2" />
        <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  )
}

function SpeedMeter() {
  const { camera } = useThree()
  const lastPosition = useRef(camera.position.clone())
  
  useFrame(() => {
    lastPosition.current.copy(camera.position)
  })
  
  return null
}

function Instructions() {
  const [show, setShow] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 8000)
    return () => clearTimeout(timer)
  }, [])
  
  if (!show) return null
  
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-4 rounded-lg z-40 backdrop-blur-sm">
      <h2 className="font-bold text-lg mb-2 text-center">Controls</h2>
      <div className="space-y-1 text-sm">
        <p><strong>WASD:</strong> Move</p>
        <p><strong>Mouse:</strong> Look around</p>
        <p><strong>Space:</strong> Jump</p>
        <p><strong>Left Click / E:</strong> Grappling Hook</p>
        <p className="mt-3 text-yellow-400">Build momentum and go fast! 🚀</p>
      </div>
    </div>
  )
}

export default function ParkourGame() {
  const [isLocked, setIsLocked] = useState(false)
  
  return (
    <div className="w-screen h-screen">
      <Canvas
        shadows
        camera={{ position: [0, 5, 0], fov: 75 }}
      >
        <Sky sunPosition={[100, 100, 20]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={200}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        
        <Platforms />
        <Player />
        <SpeedMeter />
        
        <PointerLockControls
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
        />
      </Canvas>
      
      {!isLocked && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
          <div className="bg-white/90 text-black px-8 py-6 rounded-lg text-center">
            <h1 className="text-3xl font-bold mb-4">3D Parkour Game</h1>
            <p className="mb-4">Click anywhere to start playing!</p>
            <p className="text-sm text-gray-600">Use the grappling hook to swing and build momentum</p>
          </div>
        </div>
      )}
      
      {isLocked && (
        <>
          <Crosshair />
          <Instructions />
        </>
      )}
    </div>
  )
}
