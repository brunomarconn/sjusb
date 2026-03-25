
import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy‑load page components
const Inicio = lazy(() => import('../pages/inicio/page'));
const Home = lazy(() => import('../pages/home/page'));
const Usuarios = lazy(() => import('../pages/usuarios/page'));
const Prestadores = lazy(() => import('../pages/prestadores/page'));
const MiCuenta = lazy(() => import('../pages/mi-cuenta/page'));
/* The NotFound component lives directly in the pages folder */
const NotFound = lazy(() => import('../pages/NotFound'));

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
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
