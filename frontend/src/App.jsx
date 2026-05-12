import { useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'

export default function App() {
  // Shared counter to trigger Navbar health refresh after uploads
  const [docCount, setDocCount] = useState(0)

  return (
    <div className="noise-bg min-h-screen bg-vault-bg text-vault-text">
      <div className="relative z-10">
        <Navbar docCount={docCount} />
        <Home onDocCountChange={() => setDocCount(c => c + 1)} />
      </div>
    </div>
  )
}
