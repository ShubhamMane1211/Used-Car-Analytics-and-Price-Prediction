import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Listings from './pages/Listings'
import Analytics from './pages/Analytics'
import Prediction from './pages/Prediction'
import './style.css'
function App(){return <BrowserRouter><Routes><Route element={<Layout/>}><Route index element={<Dashboard/>}/><Route path="listings" element={<Listings/>}/><Route path="analytics" element={<Analytics/>}/><Route path="prediction" element={<Prediction/>}/></Route></Routes></BrowserRouter>}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)
