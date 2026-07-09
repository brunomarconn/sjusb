// ─────────────────────────────────────────────────────────────
// Panel del prestador vía link tokenizado, sin login.
// URL: /p/:providerToken
// ─────────────────────────────────────────────────────────────
import { useParams, useNavigate } from 'react-router-dom';
import PanelPrestador from '../prestadores/components/PanelPrestador';

export default function PanelPrestadorTokenPage() {
  const { providerToken } = useParams<{ providerToken: string }>();
  const navigate = useNavigate();

  if (!providerToken) return null;

  return (
    <PanelPrestador
      providerToken={providerToken}
      onCerrarSesion={() => navigate('/')}
    />
  );
}
