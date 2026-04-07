import { useState, useEffect } from 'react';
import LoginPrestador from './components/LoginPrestador';
import RegistroPrestador from './components/RegistroPrestador';
import PanelPrestador from './components/PanelPrestador';

export default function PrestadoresPage() {
  const [vista, setVista] = useState<'login' | 'registro' | 'panel'>('login');
  const [prestadorLogueado, setPrestadorLogueado] = useState<{ dni: string } | null>(null);

  useEffect(() => {
    const dniGuardado = localStorage.getItem('dniPrestador');
    if (dniGuardado) {
      setPrestadorLogueado({ dni: dniGuardado });
      setVista('panel');
    }
  }, []);

  const handleLoginExitoso = (dni: string) => {
    localStorage.removeItem('mservicios_cliente_dni');
    localStorage.setItem('dniPrestador', dni);
    setPrestadorLogueado({ dni });
    setVista('panel');
  };

  const handleRegistroExitoso = (dni: string) => {
    localStorage.removeItem('mservicios_cliente_dni');
    localStorage.setItem('dniPrestador', dni);
    setPrestadorLogueado({ dni });
    setVista('panel');
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('dniPrestador');
    localStorage.removeItem('mservicios_prestador_id');
    setPrestadorLogueado(null);
    setVista('login');
  };

  if (vista === 'panel' && prestadorLogueado) {
    return <PanelPrestador prestadorData={prestadorLogueado} onCerrarSesion={handleCerrarSesion} />;
  }

  if (vista === 'registro') {
    return (
      <RegistroPrestador
        onRegistroExitoso={handleRegistroExitoso}
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
