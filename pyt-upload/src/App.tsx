import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import TheoryDetail from './pages/TheoryDetail'
import Publish from './pages/Publish'
import Mine from './pages/Mine'
import Lab from './pages/Lab'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teoria/:id" element={<TheoryDetail />} />
        <Route path="/publicar" element={<Publish />} />
        <Route path="/mis-teorias" element={<Mine />} />
        <Route path="/laboratorio" element={<Lab />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  )
}
