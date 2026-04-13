import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginUsuario from '../usuarios/components/LoginUsuario';
import RegistroUsuario from '../usuarios/components/RegistroUsuario';
import PanelUsuario from '../usuarios/components/PanelUsuario';

type Vista = 'login' | 'registro' | 'panel';

export default function MiCuenta() {
  const navigate = useNavigate();
  const [vista, setVista] = useState<Vista>('login');
  const [clienteDni, setClienteDni] = useState<string | null>(null);

  useEffect(() => {
    const dniGuardado = localStorage.getItem('mservicios_cliente_dni');
    if (dniGuardado) {
      setClienteDni(dniGuardado);
      setVista('panel');
    }
  }, []);

  function redirigirPostAuth() {
    const pendingChat = localStorage.getItem('mservicios_pending_chat');
    if (pendingChat) {
      localStorage.removeItem('mservicios_pending_chat');
      navigate(`/chat?prestador=${pendingChat}`);
      return;
    }
    // Sin pendiente: quedarse en el panel (no redirigir)
  }

  const handleLoginExitoso = (dni: string) => {
    localStorage.removeItem('dniPrestador');
    localStorage.removeItem('mservicios_prestador_id');
    localStorage.setItem('mservicios_cliente_dni', dni);
    setClienteDni(dni);
    redirigirPostAuth();
    setVista('panel');
  };

  const handleRegistroExitoso = (dni: string) => {
    localStorage.removeItem('dniPrestador');
    localStorage.removeItem('mservicios_prestador_id');
    localStorage.setItem('mservicios_cliente_dni', dni);
    setClienteDni(dni);
    redirigirPostAuth();
    setVista('panel');
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('mservicios_cliente_dni');
    setClienteDni(null);
    setVista('login');
  };

  if (vista === 'panel' && clienteDni) {
    return <PanelUsuario clienteDni={clienteDni} onCerrarSesion={handleCerrarSesion} />;
  }

  if (vista === 'registro') {
    return (
      <RegistroUsuario
        onRegistroExitoso={handleRegistroExitoso}
        onCambiarALogin={() => setVista('login')}
      />
    );
  }

  return (
    <LoginUsuario
      onLoginExitoso={handleLoginExitoso}
      onCambiarARegistro={() => setVista('registro')}
    />
  );
}
