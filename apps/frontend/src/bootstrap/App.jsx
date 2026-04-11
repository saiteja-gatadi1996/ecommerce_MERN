import React, { Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

const AuthApp = React.lazy(() => import('auth_mfe/App'));
const CatalogApp = React.lazy(() => import('catalog_mfe/App'));
const CheckoutApp = React.lazy(() => import('checkout_mfe/App'));
const OrdersApp = React.lazy(() => import('orders_mfe/App'));

window.__API_BASE_URL__ = 'http://localhost:8080';

function Shell() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#ffffff',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          border: '2px solid red',
          padding: 24,
          borderRadius: 16,
        }}
      >

        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <Link style={{ color: '#60a5fa' }} to='/'>
            Home
          </Link>
          <Link style={{ color: '#60a5fa' }} to='/login'>
            Login
          </Link>
          <Link style={{ color: '#60a5fa' }} to='/signup'>
            Signup
          </Link>
          <Link style={{ color: '#60a5fa' }} to='/checkout'>
            Checkout
          </Link>
          <Link style={{ color: '#60a5fa' }} to='/orders'>
            Orders
          </Link>
        </div>

        <Suspense
          fallback={<div style={{ color: '#ffffff' }}>Loading remote...</div>}
        >
          <Routes>
            <Route
              path='/'
              element={<CatalogApp apiBaseUrl={window.__API_BASE_URL__} />}
            />
            <Route
              path='/login'
              element={
                <AuthApp mode='login' apiBaseUrl={window.__API_BASE_URL__} />
              }
            />
            <Route
              path='/signup'
              element={
                <AuthApp mode='signup' apiBaseUrl={window.__API_BASE_URL__} />
              }
            />
            <Route
              path='/checkout'
              element={<CheckoutApp apiBaseUrl={window.__API_BASE_URL__} />}
            />
            <Route
              path='/orders'
              element={<OrdersApp apiBaseUrl={window.__API_BASE_URL__} />}
            />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
