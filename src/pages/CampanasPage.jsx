import { useState, useEffect, useCallback } from 'react'
import { Megaphone, RefreshCw, Clock, User } from 'lucide-react'
import PageHead from '../components/layout/PageHead.jsx'
import Loader from '../components/ui/Loader.jsx'
import Alert from '../components/ui/Alert.jsx'
import Badge from '../components/ui/Badge.jsx'
import Money from '../components/ui/Money.jsx'
import { listarCampanas } from '../services/campanasService.js'
import { extractError } from '../utils/format.js'

function diasTone(dias) {
  if (dias <= 3) return 'red'
  if (dias <= 7) return 'amber'
  return 'turq'
}

export default function CampanasPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(() => {
    setLoading(true)
    listarCampanas()
      .then((data) => setItems(data || []))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const totalOfertado = items.reduce((a, i) => a + (i.monto_ofertado || 0), 0)

  return (
    <>
      <PageHead
        title="Campañas activas"
        subtitle={`${items.length} campañas · S/ ${totalOfertado.toLocaleString('es-PE', { maximumFractionDigits: 0 })} ofertado`}
        icon={Megaphone}
        actions={<button className="hb-btn hb-btn-gray hb-btn-sm" onClick={cargar}><RefreshCw size={15} /> Actualizar</button>}
      />

      {error && <Alert tipo="error">{error}</Alert>}

      {loading ? (
        <Loader text="Cargando campañas…" />
      ) : items.length === 0 ? (
        <div className="hb-card hb-table-empty">No hay campañas activas.</div>
      ) : (
        <div className="cm-list">
          {items.map((it) => (
            <div className="cm-item" key={it.id}>
              <div className="cm-item-main">
                <strong>{it.cliente_nombre}</strong>
                <small><User size={13} /> {it.cliente_id}</small>
              </div>
              <div className="cm-item-center">
                <Money value={it.monto_ofertado} colored />
                <small>{it.tipo || 'Oferta'}</small>
              </div>
              <div className="cm-item-right">
                {it.fecha_vencimiento && (
                  <Badge
                    estado={`${it.dias_restantes} días`}
                    tone={diasTone(it.dias_restantes)}
                    label={
                      <><Clock size={12} /> {it.dias_restantes} días</>
                    }
                  />
                )}
                {it.fecha_vencimiento && (
                  <small>Vence {new Date(it.fecha_vencimiento).toLocaleDateString('es-PE')}</small>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
