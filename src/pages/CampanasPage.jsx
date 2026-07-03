import { useState, useEffect, useCallback } from 'react'
import { Megaphone, RefreshCw, Clock, User, PlusCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import PageHead from '../components/layout/PageHead.jsx'
import Loader from '../components/ui/Loader.jsx'
import Alert from '../components/ui/Alert.jsx'
import Badge from '../components/ui/Badge.jsx'
import Money from '../components/ui/Money.jsx'
import Modal from '../components/ui/Modal.jsx'
import { listarCampanas, crearCampana } from '../services/campanasService.js'
import { extractError } from '../utils/format.js'

function diasTone(dias) {
  if (dias <= 3) return 'red'
  if (dias <= 7) return 'amber'
  return 'turq'
}

export default function CampanasPage() {
  const { user } = useAuth()
  const esSupervisor = user?.perfil === 'supervisor' || user?.perfil === 'administrador'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [clienteDni, setClienteDni] = useState('')
  const [asesorCod, setAsesorCod] = useState('')
  const [tipo, setTipo] = useState('renovacion')
  const [monto, setMonto] = useState('')
  const [fechaVen, setFechaVen] = useState('')
  const [saving, setSaving] = useState(false)

  const cargar = useCallback(() => {
    setLoading(true)
    listarCampanas()
      .then((data) => setItems(data || []))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const totalOfertado = items.reduce((a, i) => a + (i.monto_ofertado || 0), 0)

  const handleCrear = async () => {
    if (!clienteDni || !asesorCod || !monto || !fechaVen) return
    setSaving(true)
    setError(null)
    try {
      await crearCampana({
        cliente_dni: clienteDni,
        asesor_codigo: asesorCod,
        tipo,
        monto_ofertado: Number(monto),
        fecha_vencimiento: fechaVen,
      })
      setOk(`Campaña creada para DNI ${clienteDni} con asesor ${asesorCod}`)
      setShowForm(false)
      setClienteDni(''); setAsesorCod(''); setTipo('renovacion'); setMonto(''); setFechaVen('')
      cargar()
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Campañas activas"
        subtitle={`${items.length} campañas · S/ ${totalOfertado.toLocaleString('es-PE', { maximumFractionDigits: 0 })} ofertado`}
        icon={Megaphone}
        actions={
          <>
            <button className="hb-btn hb-btn-gray hb-btn-sm" onClick={cargar}><RefreshCw size={15} /> Actualizar</button>
            {esSupervisor && (
              <button className="hb-btn hb-btn-sm" onClick={() => setShowForm(true)}><PlusCircle size={16} /> Nueva campaña</button>
            )}
          </>
        }
      />

      {error && <Alert tipo="error">{error}</Alert>}
      {ok && <Alert tipo="success">{ok}</Alert>}

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

      {showForm && (
        <Modal
          title="Nueva campaña"
          icon={Megaphone}
          onClose={() => setShowForm(false)}
          footer={
            <button className="hb-btn" onClick={handleCrear} disabled={saving}>
              <CheckCircle2 size={16} /> {saving ? 'Creando…' : 'Crear campaña'}
            </button>
          }
        >
          <div className="hb-field">
            <label>DNI del cliente</label>
            <input className="hb-input" placeholder="40118120" value={clienteDni} onChange={(e) => setClienteDni(e.target.value)} />
          </div>
          <div className="hb-field">
            <label>Código del asesor</label>
            <input className="hb-input" placeholder="0001" value={asesorCod} onChange={(e) => setAsesorCod(e.target.value)} />
          </div>
          <div className="hb-field">
            <label>Tipo</label>
            <select className="hb-input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="renovacion">Renovación</option>
              <option value="ampliacion">Ampliación</option>
              <option value="producto_paralelo">Producto paralelo</option>
            </select>
          </div>
          <div className="hb-field">
            <label>Monto ofertado (S/)</label>
            <input className="hb-input" inputMode="decimal" placeholder="5000" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <div className="hb-field">
            <label>Fecha de vencimiento</label>
            <input className="hb-input" type="date" value={fechaVen} onChange={(e) => setFechaVen(e.target.value)} />
          </div>
        </Modal>
      )}
    </>
  )
}
