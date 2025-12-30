'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, Sky } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

interface Platform {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  type?: 'normal' | 'jump' | 'slide' | 'grind'
}

const platforms: Platform[] = [
  { position: [0, -0.5, 0], size: [30, 1, 30], color: '#2c3e50', type: 'normal' },
  { position: [25, 1, 5], size: [15, 1, 10], color: '#34495e', type: 'normal' },
  { position: [45, 5, 0], size: [12, 1, 12], color: '#e74c3c', type: 'jump' },
  { position: [60, 8, -5], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [75, 12, 5], size: [15, 1, 15], color: '#34495e', type: 'normal' },
  { position: [75, 18, -15], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [60, 22, -25], size: [12, 1, 12], color: '#e74c3c', type: 'jump' },
  { position: [45, 25, -20], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [30, 28, -15], size: [8, 1, 8], color: '#34495e', type: 'normal' },
  { position: [15, 30, -10], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [0, 33, -5], size: [15, 1, 15], color: '#27ae60', type: 'jump' },
  { position: [-15, 35, 5], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [-30, 38, 0], size: [12, 1, 12], color: '#34495e', type: 'normal' },
  { position: [-45, 40, -10], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [-55, 42, 5], size: [15, 1, 15], color: '#27ae60', type: 'jump' },
  { position: [-65, 45, 20], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [-60, 48, 35], size: [12, 1, 12], color: '#34495e', type: 'normal' },
  { position: [-45, 50, 45], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [-30, 52, 40], size: [15, 1, 15], color: '#e74c3c', type: 'jump' },
  { position: [-15, 55, 35], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [0, 57, 30], size: [12, 1, 12], color: '#34495e', type: 'normal' },
  { position: [15, 59, 25], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [30, 61, 20], size: [15, 1, 15], color: '#27ae60', type: 'jump' },
  { position: [45, 63, 15], size: [20, 1, 20], color: '#f39c12', type: 'normal' },
  { position: [10, 10, 20], size: [8, 1, 8], color: '#34495e', type: 'normal' },
  { position: [-20, 15, -20], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [20, 20, -30], size: [8, 1, 8], color: '#e74c3c', type: 'jump' },
  { position: [-40, 25, 15], size: [12, 1, 12], color: '#34495e', type: 'normal' },
  { position: [-10, 45, -15], size: [10, 1, 10], color: '#2c3e50', type: 'normal' },
  { position: [35, 40, 5], size: [8, 1, 8], color: '#27ae60', type: 'jump' },
]

interface TrickInfo {
  name: string
  points: number
  timestamp: number
}

function FirstPersonHands() {
  const { camera } = useThree()
  const leftHandRef = useRef<THREE.Group>(null)
  const rightHandRef = useRef<THREE.Group>(null)
  const bobTime = useRef(0)
  
  useFrame((state, delta) => {
    bobTime.current += delta * 5
    
    if (leftHandRef.current && rightHandRef.current) {
      const bobAmount = Math.sin(bobTime.current) * 0.02
      
      leftHandRef.current.position.set(-0.3, -0.5 + bobAmount, -0.8)
      leftHandRef.current.rotation.set(0.2, 0.3, 0.1)
      
      rightHandRef.current.position.set(0.3, -0.5 - bobAmount, -0.8)
      rightHandRef.current.rotation.set(0.2, -0.3, -0.1)
    }
  })
  
  return (
    <group>
      <group ref={leftHandRef}>
        <mesh>
          <boxGeometry args={[0.08, 0.2, 0.08]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.1, 0.05, 0.15]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
      </group>
      
      <group ref={rightHandRef}>
        <mesh>
          <boxGeometry args={[0.08, 0.2, 0.08]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.1, 0.05, 0.15]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
      </group>
    </group>
  )
}

function GrapplingHookModel({ isGrappling, grapplePoint }: { isGrappling: boolean, grapplePoint: THREE.Vector3 | null }) {
  const { camera } = useThree()
  const hookRef = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (hookRef.current) {
      if (isGrappling && grapplePoint) {
        const direction = new THREE.Vector3()
        direction.subVectors(grapplePoint, camera.position).normalize()
        hookRef.current.position.set(0.4, -0.3, -0.6)
        hookRef.current.lookAt(direction)
        hookRef.current.rotateX(Math.PI / 4)
      } else {
        hookRef.current.position.set(0.4, -0.4, -0.7)
        hookRef.current.rotation.set(0, 0, 0)
      }
    }
  })
  
  return (
    <group ref={hookRef}>
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <coneGeometry args={[0.05, 0.1, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.04, 0.18, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.04, 0.18, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
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
  const keysPressed = useRef<Set<string>>(new Set())
  const isGroundedRef = useRef(false)
  const lastJumpTime = useRef(0)
  const lastGrappleTime = useRef(0)
  const airTimeRef = useRef(0)
  const lastSpeedCheck = useRef(0)
  const rotationRef = useRef({ x: 0, y: 0, z: 0 })
  const lastTrickTime = useRef(0)
  
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
  }, [camera, onTrick])
  
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
    
    if (!isGrappling) {
      velocityRef.current.y -= 30 * delta
    } else {
      velocityRef.current.y -= 10 * delta
    }
    
    const friction = isGroundedRef.current ? 0.82 : 0.99
    velocityRef.current.x *= friction
    velocityRef.current.z *= friction
    
    const maxHorizontalSpeed = 50
    const horizontalSpeed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.z ** 2)
    if (horizontalSpeed > maxHorizontalSpeed) {
      const scale = maxHorizontalSpeed / horizontalSpeed
      velocityRef.current.x *= scale
      velocityRef.current.z *= scale
    }
    
    if (Date.now() - lastSpeedCheck.current > 100) {
      onSpeedUpdate(horizontalSpeed)
      lastSpeedCheck.current = Date.now()
    }
    
    const nextPosition = camera.position.clone()
    nextPosition.add(velocityRef.current.clone().multiplyScalar(delta))
    
    const wasGrounded = isGroundedRef.current
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
          
          if (platform.type === 'jump') {
            velocityRef.current.y = Math.max(velocityRef.current.y * -1.2, 15)
            onTrick({ name: 'Jump Boost!', points: 25, timestamp: Date.now() })
          } else {
            velocityRef.current.y = Math.max(0, velocityRef.current.y)
          }
          
          isGroundedRef.current = true
          
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
        } else if (
          camera.position.y + playerHeight / 2 <= minY &&
          nextPosition.y + playerHeight / 2 > minY
        ) {
          nextPosition.y = minY - playerHeight / 2
          velocityRef.current.y = Math.min(0, velocityRef.current.y)
        }
      }
    })
    
    if (!isGroundedRef.current) {
      airTimeRef.current += delta
    }
    
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
      <FirstPersonHands />
      <GrapplingHookModel isGrappling={isGrappling} grapplePoint={grapplePoint} />
      {grappleRope && (() => {
        const points = []
        points.push(grappleRope[0])
        points.push(grappleRope[1])
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        return (
          <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#00ff00', linewidth: 3 }))} />
        )
      })()}
      {grapplePoint && (
        <mesh position={[grapplePoint.x, grapplePoint.y, grapplePoint.z]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
        </mesh>
      )}
    </>
  )
}

function Platforms() {
  return (
    <>
      {platforms.map((platform, index) => (
        <group key={index}>
          <mesh position={platform.position} receiveShadow castShadow>
            <boxGeometry args={platform.size} />
            <meshStandardMaterial 
              color={platform.color} 
              emissive={platform.type === 'jump' ? platform.color : '#000000'}
              emissiveIntensity={platform.type === 'jump' ? 0.3 : 0}
            />
          </mesh>
          {platform.type === 'jump' && (
            <mesh position={[platform.position[0], platform.position[1] + 0.6, platform.position[2]]}>
              <coneGeometry args={[0.5, 1, 4]} />
              <meshStandardMaterial 
                color="#ffff00" 
                emissive="#ffff00" 
                emissiveIntensity={0.5}
                transparent
                opacity={0.7}
              />
            </mesh>
          )}
        </group>
      ))}
      
      <mesh position={[0, -10, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
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
          <div className="flex gap-2"><span className="text-gray-400">Q</span> Barrel Roll</div>
          <div className="flex gap-2"><span className="text-gray-400">Z</span> Front Flip</div>
          <div className="flex gap-2"><span className="text-gray-400">X</span> Back Flip</div>
          <div className="flex gap-2"><span className="text-gray-400">C</span> 360 Spin</div>
        </div>
      </div>
      
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-8 h-8">
          <div className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-white -translate-x-1/2 -translate-y-full shadow-lg" />
          <div className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-white -translate-x-1/2 shadow-lg" />
          <div className="absolute left-1/2 top-1/2 w-3 h-0.5 bg-white -translate-y-1/2 -translate-x-full shadow-lg" />
          <div className="absolute left-1/2 top-1/2 w-3 h-0.5 bg-white -translate-y-1/2 shadow-lg" />
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />
        </div>
      </div>
    </div>
  )
}

function Instructions() {
  const [show, setShow] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 10000)
    return () => clearTimeout(timer)
  }, [])
  
  if (!show) return null
  
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white px-8 py-6 rounded-lg z-40 backdrop-blur-sm border-2 border-cyan-500 max-w-lg">
      <h2 className="font-bold text-2xl mb-4 text-center text-cyan-400">🎮 PARKOUR MASTER 🎮</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h3 className="font-bold text-green-400 mb-2">Movement</h3>
          <p><strong className="text-cyan-300">WASD:</strong> Move</p>
          <p><strong className="text-cyan-300">Mouse:</strong> Look</p>
          <p><strong className="text-cyan-300">Space:</strong> Jump</p>
          <p><strong className="text-cyan-300">Click/E:</strong> Grapple</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-purple-400 mb-2">Tricks (in air)</h3>
          <p><strong className="text-cyan-300">Q:</strong> Barrel Roll</p>
          <p><strong className="text-cyan-300">Z:</strong> Front Flip</p>
          <p><strong className="text-cyan-300">X:</strong> Back Flip</p>
          <p><strong className="text-cyan-300">C:</strong> 360 Spin</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-cyan-500/50">
        <p className="text-yellow-400 text-center font-semibold">🚀 Build momentum, do tricks, and go FAST! 🚀</p>
        <p className="text-gray-400 text-xs text-center mt-2">Yellow platforms give you a speed boost!</p>
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
        <Sky sunPosition={[100, 100, 20]} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={300}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
        <pointLight position={[0, 30, 0]} intensity={0.5} color="#4dabf7" />
        <pointLight position={[50, 50, 50]} intensity={0.3} color="#ff6b6b" />
        
        <Platforms />
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
              3D PARKOUR MASTER
            </h1>
            <p className="mb-6 text-lg">Click anywhere to start playing!</p>
            <p className="text-sm text-cyan-300">Use the grappling hook to swing and build momentum</p>
            <p className="text-sm text-purple-300 mt-2">Perform tricks in the air for extra points!</p>
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
