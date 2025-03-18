import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Builder from './pages/Builder';
import { ToastContainer } from 'react-toastify';

const App = () => {
  return (
    <BrowserRouter>
      <ToastContainer />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/builder" element={<Builder />} />
    </Routes>
  </BrowserRouter>
  )
}

export default App