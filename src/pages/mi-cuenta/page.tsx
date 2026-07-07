import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginUsuario from '../usuarios/components/LoginUsuario';
import RegistroUsuario from '../usuarios/components/RegistroUsuario';
import PanelUsuario from '../usuarios/components/PanelUsuario';
import { useClienteSession } from '../../context/ClienteSessionContext';

type Vista = 'login' | 'registro' | 'panel';

export default function MiCuenta() {
  const navigate = useNavigate();
  const clienteSession = useClienteSession();
  const [vista, setVista] = useState<Vista>(clienteSession.dni ? 'panel' : 'login');

  function redirigirPostAuth() {
    const pendingChat = clienteSession.getPendingChat();
    if (pendingChat) {
      clienteSession.clearPendingChat();
      navigate(`/chat?prestador=${pendingChat}`);
      return;
    }
    // Sin pendiente: quedarse en el panel (no redirigir)
  }

  const handleLoginExitoso = (dni: string, token: string) => {
    clienteSession.login(dni, token);
    redirigirPostAuth();
    setVista('panel');
  };

  const handleRegistroExitoso = (dni: string, token: string) => {
    clienteSession.login(dni, token);
    redirigirPostAuth();
    setVista('panel');
  };

  const handleCerrarSesion = () => {
    clienteSession.logout();
    setVista('login');
  };

  if (vista === 'panel' && clienteSession.dni) {
    return <PanelUsuario clienteDni={clienteSession.dni} onCerrarSesion={handleCerrarSesion} />;
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
