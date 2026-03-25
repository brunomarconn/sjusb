import { useState, useEffect } from 'react';
import LoginUsuario from '../usuarios/components/LoginUsuario';
import RegistroUsuario from '../usuarios/components/RegistroUsuario';
import PanelUsuario from '../usuarios/components/PanelUsuario';

type Vista = 'login' | 'registro' | 'panel';

export default function MiCuenta() {
  const [vista, setVista] = useState<Vista>('login');
  const [clienteEmail, setClienteEmail] = useState<string | null>(null);

  useEffect(() => {
    const emailGuardado = localStorage.getItem('mservicios_cliente_email');
    if (emailGuardado) {
      setClienteEmail(emailGuardado);
      setVista('panel');
    }
  }, []);

  const handleLoginExitoso = (email: string) => {
    localStorage.setItem('mservicios_cliente_email', email);
    setClienteEmail(email);
    setVista('panel');
  };

  const handleRegistroExitoso = (email: string) => {
    localStorage.setItem('mservicios_cliente_email', email);
    setClienteEmail(email);
    setVista('panel');
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('mservicios_cliente_email');
    setClienteEmail(null);
    setVista('login');
  };

  if (vista === 'panel' && clienteEmail) {
    return <PanelUsuario clienteEmail={clienteEmail} onCerrarSesion={handleCerrarSesion} />;
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
