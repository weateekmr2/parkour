'use client'

import dynamic from 'next/dynamic'

const ParkourGame = dynamic(() => import('./ParkourGame'), { ssr: false })

export default function Home() {
  return <ParkourGame />
}
