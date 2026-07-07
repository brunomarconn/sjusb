import { useState } from 'react';
import LoginPrestador from './components/LoginPrestador';
import RegistroPrestador from './components/RegistroPrestador';
import PanelPrestador from './components/PanelPrestador';
import { usePrestadorSession } from '../../context/PrestadorSessionContext';

export default function PrestadoresPage() {
  const prestadorSession = usePrestadorSession();
  const [vista, setVista] = useState<'login' | 'registro' | 'panel'>(
    prestadorSession.dniPrestador ? 'panel' : 'login'
  );

  const handleLoginExitoso = (dni: string, token: string) => {
    prestadorSession.loginConDni(dni, token);
    setVista('panel');
  };

  const handleCerrarSesion = () => {
    prestadorSession.logout();
    setVista('login');
  };

  if (vista === 'panel' && prestadorSession.dniPrestador) {
    return <PanelPrestador prestadorData={{ dni: prestadorSession.dniPrestador }} onCerrarSesion={handleCerrarSesion} />;
  }

  if (vista === 'registro') {
    return (
      <RegistroPrestador
        onVolverLogin={() => setVista('login')}
      />
    );
  }

  return (
    <LoginPrestador
      onLoginExitoso={handleLoginExitoso}
      onIrRegistro={() => setVista('registro')}
    />
  );
}
