import { useState, useEffect } from 'react';
import LoginUsuario from '../usuarios/components/LoginUsuario';
import RegistroUsuario from '../usuarios/components/RegistroUsuario';
import PanelUsuario from '../usuarios/components/PanelUsuario';

type Vista = 'login' | 'registro' | 'panel';

export default function MiCuenta() {
  const [vista, setVista] = useState<Vista>('login');
  const [clienteId, setClienteId] = useState<string | null>(null);

  useEffect(() => {
    const clienteGuardado = localStorage.getItem('mservicios_cliente_id');
    if (clienteGuardado) {
      setClienteId(clienteGuardado);
      setVista('panel');
    }
  }, []);

  const handleLoginExitoso = (id: string) => {
    localStorage.setItem('mservicios_cliente_id', id);
    setClienteId(id);
    setVista('panel');
  };

  const handleRegistroExitoso = (id: string) => {
    localStorage.setItem('mservicios_cliente_id', id);
    setClienteId(id);
    setVista('panel');
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('mservicios_cliente_id');
    setClienteId(null);
    setVista('login');
  };

  if (vista === 'panel' && clienteId) {
    return <PanelUsuario clienteId={clienteId} onCerrarSesion={handleCerrarSesion} />;
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
