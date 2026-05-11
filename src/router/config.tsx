
import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy‑load page components
const Inicio = lazy(() => import('../pages/inicio/page'));
const Home = lazy(() => import('../pages/home/page'));
const Usuarios = lazy(() => import('../pages/usuarios/page'));
const Prestadores = lazy(() => import('../pages/prestadores/page'));
const MiCuenta = lazy(() => import('../pages/mi-cuenta/page'));
const Puntos = lazy(() => import('../pages/puntos/page'));
// Sistema de pagos / órdenes
const Admin = lazy(() => import('../pages/admin/page'));
const Pagar = lazy(() => import('../pages/pagar/page'));
// Chat interno
const Chat = lazy(() => import('../pages/chat/page'));
// Reservas
const Reservar = lazy(() => import('../pages/reservar/page'));
/* The NotFound component lives directly in the pages folder */
const NotFound = lazy(() => import('../pages/NotFound'));
const FAQ = lazy(() => import('../pages/faq/page'));
const Privacidad = lazy(() => import('../pages/privacidad/page'));
const Terminos = lazy(() => import('../pages/terminos/page'));
const PrestadorPerfil = lazy(() => import('../pages/prestador/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Inicio />,
  },
  {
    path: '/home',
    element: <Home />,
  },
  {
    path: '/usuarios',
    element: <Usuarios />,
  },
  {
    path: '/prestadores',
    element: <Prestadores />,
  },
  {
    path: '/mi-cuenta',
    element: <MiCuenta />,
  },
  {
    path: '/puntos',
    element: <Puntos />,
  },
  // ── Sistema de pagos ──────────────────────────────────
  {
    path: '/admin',
    element: <Admin />,
  },
  {
    path: '/pagar/:id',
    element: <Pagar />,
  },
  {
    path: '/chat',
    element: <Chat />,
  },
  {
    path: '/reservar/:prestadorId',
    element: <Reservar />,
  },
  {
    path: '/faq',
    element: <FAQ />,
  },
  {
    path: '/privacidad',
    element: <Privacidad />,
  },
  {
    path: '/terminos',
    element: <Terminos />,
  },
  {
    path: '/prestador/:id',
    element: <PrestadorPerfil />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
