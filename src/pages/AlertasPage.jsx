import { useState, useEffect, useCallback } from 'react'
import { Bell, RefreshCw, CheckCircle2, AlertTriangle, Info, Megaphone, UserCheck } from 'lucide-react'
import PageHead from '../components/layout/PageHead.jsx'
import Loader from '../components/ui/Loader.jsx'
import Alert from '../components/ui/Alert.jsx'
import { listarAlertas, marcarLeida } from '../services/alertasService.js'
import { extractError } from '../utils/format.js'

function alertaIcon(tipo) {
  switch (tipo) {
    case 'mora': return <AlertTriangle size={18} className="cm-alert-icon" style={{ color: '#ef4444' }} />
    case 'vencimiento': return <Megaphone size={18} className="cm-alert-icon" style={{ color: '#f59e0b' }} />
    case 'aprobacion': return <CheckCircle2 size={18} className="cm-alert-icon" style={{ color: '#10b981' }} />
    default: return <Info size={18} className="cm-alert-icon" style={{ color: '#6366f1' }} />
  }
}

export default function AlertasPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(() => {
    setLoading(true)
    listarAlertas()
      .then((data) => setItems(data || []))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const leer = async (id) => {
    try {
      await marcarLeida(id)
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, leida: true } : it)),
      )
    } catch (err) {
      setError(extractError(err))
    }
  }

  const noLeidas = items.filter((it) => !it.leida).length

  return (
    <>
      <PageHead
        title="Alertas"
        subtitle={`${noLeidas} sin leer · ${items.length} total`}
        icon={Bell}
        actions={<button className="hb-btn hb-btn-gray hb-btn-sm" onClick={cargar}><RefreshCw size={15} /> Actualizar</button>}
      />

      {error && <Alert tipo="error">{error}</Alert>}

      {loading ? (
        <Loader text="Cargando alertas…" />
      ) : items.length === 0 ? (
        <div className="hb-card hb-table-empty">No hay alertas.</div>
      ) : (
        <div className="cm-list">
          {items.map((it) => (
            <div className={`cm-item ${it.leida ? 'cm-item-muted' : ''}`} key={it.id}>
              <span className="cm-item-dot">
                {!it.leida && <span className="cm-dot" />}
              </span>
              <div className="cm-item-icon">{alertaIcon(it.tipo_alerta)}</div>
              <div className="cm-item-main">
                <strong>{it.cliente_nombre || 'Sistema'}</strong>
                <small>{it.mensaje || it.tipo_alerta}</small>
              </div>
              <div className="cm-item-right">
                {!it.leida && (
                  <button className="hb-btn hb-btn-sm hb-btn-ghost" onClick={() => leer(it.id)}>
                    <CheckCircle2 size={15} /> Leída
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
