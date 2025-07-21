
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { generateSqlFromNaturalLanguage } from '../../services/geminiService';
import { ICONS } from '../../constants';
import Spinner from '../common/Spinner';
import { can } from '@/utils/permissions';

const SqlView: React.FC = () => {
  const { currentUser } = useAppContext();
  const [naturalQuery, setNaturalQuery] = useState('');
  const [sqlQuery, setSqlQuery] = useState('/* La salida SQL aparecerá aquí */');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSql = async () => {
    if (!naturalQuery) return;
    setIsLoading(true);
    try {
      const result = await generateSqlFromNaturalLanguage(naturalQuery);
      setSqlQuery(result);
    } catch (error) {
      console.error(error);
      setSqlQuery('/* Ocurrió un error al generar el SQL. */');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuerySample = (query: string) => {
    setNaturalQuery(query);
  }

  // Permission check is now handled by MainContent.tsx
  if (!can("sql.view")) {
    // This view should not be rendered at all if permission is denied.
    // The check in MainContent.tsx will prevent this component from being mounted.
    // This is a fallback.
    return (
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold text-danger">Acceso Denegado</h2>
        <p className="text-text-secondary mt-2">No tienes permisos para ver esta sección.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold">Lenguaje Natural a SQL</h2>
        <p className="text-text-secondary mt-1">Describe los datos que quieres ver, y nuestro asistente de IA generará la consulta SQL por ti.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleQuerySample("muéstrame todos los tickets proactivos abiertos de la última semana")}>Tickets proactivos abiertos</Button>
          <Button size="sm" variant="ghost" onClick={() => handleQuerySample("lista los subtickets en Ciudad de México que se cerraron hoy")}>Subtickets cerrados en CDMX</Button>
          <Button size="sm" variant="ghost" onClick={() => handleQuerySample("cuenta los tickets por asesor para este mes")}>Tickets por asesor</Button>
        </div>
        <div className="mt-4">
          <textarea
            value={naturalQuery}
            onChange={(e) => setNaturalQuery(e.target.value)}
            placeholder="ej., muéstrame todos los tickets del Nodo Central con servicio no disponible"
            rows={3}
            className="w-full bg-primary border border-border-color rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="mt-4">
          <Button onClick={handleGenerateSql} isLoading={isLoading}>
            <span className="mr-2">{ICONS.sparkles}</span>
            Generar SQL
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Consulta SQL Generada</h3>
          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(sqlQuery)}>Copiar SQL</Button>
        </div>
        <div className="mt-4 p-4 bg-primary rounded-md border border-border-color font-mono text-sm overflow-x-auto">
          {isLoading ? <Spinner /> : <pre><code>{sqlQuery}</code></pre>}
        </div>
        <p className="text-xs text-yellow-400 mt-4"><strong>Advertencia:</strong> Las consultas generadas por IA deben ser revisadas antes de su ejecución en una base de datos de producción.</p>
      </Card>
    </div>
  );
};

export default SqlView;
