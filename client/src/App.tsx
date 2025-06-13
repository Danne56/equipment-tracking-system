import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import ToolManagement from './pages/ToolManagement.tsx'
import BorrowRecords from './pages/BorrowRecords.tsx'
import QRScanner from './pages/QRScanner.tsx'
import Notifications from './pages/Notifications.tsx'
import { NotificationProvider } from './context/NotificationContext.tsx'

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tools" element={<ToolManagement />} />
              <Route path="/records" element={<BorrowRecords />} />
              <Route path="/scanner" element={<QRScanner />} />
              <Route path="/notifications" element={<Notifications />} />
            </Routes>
          </main>
        </div>
      </Router>
    </NotificationProvider>
  )
}

export default App
