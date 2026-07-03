import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, MapPin, CheckCircle2, FileText, RefreshCw, ClipboardCheck, IdCard, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import PageHead from '../components/layout/PageHead.jsx'
import Loader from '../components/ui/Loader.jsx'
import Alert from '../components/ui/Alert.jsx'
import Badge from '../components/ui/Badge.jsx'
import Money from '../components/ui/Money.jsx'
import Modal from '../components/ui/Modal.jsx'
import { listarCartera, marcarVisita } from '../services/carteraService.js'
import { extractError, humanizar } from '../utils/format.js'

const RESULTADOS = [
  { v: 'visitado', l: 'Visitado' },
  { v: 'no_encontrado', l: 'No encontrado' },
  { v: 'reagendado', l: 'Reagendado' },
  { v: 'negocio_cerrado', l: 'Negocio cerrado' },
]

export default function CarteraPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const esSupervisor = user?.perfil === 'supervisor'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(null)
  const [target, setTarget] = useState(null)
  const [resultado, setResultado] = useState('visitado')
  const [observacion, setObservacion] = useState('')
  const [saving, setSaving] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const cargar = useCallback((p) => {
    setLoading(true)
    const pg = p ?? pagina
    listarCartera({ pagina: pg, por_pagina: 30 })
      .then((data) => {
        setItems(data.items || [])
        setTotalPaginas(data.total_paginas || 1)
        setTotalItems(data.total || 0)
      })
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [pagina])

  useEffect(() => { cargar() }, [cargar])

  const abrirGestion = (item) => {
    setTarget(item)
    setResultado('visitado')
    setObservacion('')
  }

  const guardar = async () => {
    if (!target) return
    setSaving(true)
    setError(null)
    try {
      await marcarVisita(target.id, { resultado, observacion })
      setItems((prev) => prev.map((i) => (i.id === target.id ? { ...i, estado_visita: resultado } : i)))
      setOk(`Visita de ${target.cliente_nombre} registrada como "${humanizar(resultado)}".`)
      setTarget(null)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  const pendientes = items.filter((i) => i.estado_visita === 'pendiente').length

  const irPagina = (p) => {
    setPagina(p)
    cargar(p)
  }

  return (
    <>
      <PageHead
        title="Cartera"
        subtitle={`${totalItems} clientes · Pág. ${pagina}/${totalPaginas} · ${pendientes} pendientes`}
        icon={Briefcase}
        actions={
          <button className="hb-btn hb-btn-gray hb-btn-sm" onClick={() => cargar(pagina)}>
            <RefreshCw size={15} /> Actualizar
          </button>
        }
      />

      {error && <Alert tipo="error">{error}</Alert>}
      {ok && <Alert tipo="success">{ok}</Alert>}

      {loading ? (
        <Loader text="Cargando tu cartera…" />
      ) : items.length === 0 ? (
        <div className="hb-card hb-table-empty">No tienes clientes asignados para hoy.</div>
      ) : (
        <div className="cm-list">
          {items.map((it) => {
            const prio = String(it.prioridad || '').toLowerCase()
            const gestionado = it.estado_visita && it.estado_visita !== 'pendiente'
            return (
              <div className="cm-item" key={it.id}>
                <span className={`cm-item-prio ${prio}`} />
                <div className="cm-item-main">
                  <strong>{it.cliente_nombre}</strong>
                  <small>
                    <IdCard size={13} /> DNI {it.documento}
                    {esSupervisor && it.asesor_nombre && <><span>·</span><span>{it.asesor_nombre}</span></>}
                    <span>·</span>
                    {humanizar(it.tipo_gestion)}
                    <span>·</span>
                    <span title="Score de prioridad">score {it.score_prioridad}</span>
                  </small>
                </div>
                <div className="cm-item-right">
                  <Badge estado={it.prioridad} label={`Prioridad ${humanizar(it.prioridad)}`} />
                  {gestionado
                    ? <Badge estado={it.estado_visita} />
                    : <Badge estado="pendiente" tone="amber" label="Pendiente" />}
                  <div className="cm-item-monto">
                    <Money value={it.monto_credito} />
                    <small>crédito</small>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="hb-btn hb-btn-ghost hb-btn-sm"
                      onClick={() => navigate(`/clientes/${it.cliente_id}/ficha`)}
                    >
                      <FileText size={15} /> Ficha
                    </button>
                    <button
                      className="hb-btn hb-btn-sm"
                      onClick={() => abrirGestion(it)}
                      disabled={gestionado}
                    >
                      <ClipboardCheck size={15} /> {gestionado ? 'Gestionado' : 'Registrar'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && items.length > 0 && totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button className="hb-btn hb-btn-sm hb-btn-gray" disabled={pagina <= 1} onClick={() => irPagina(pagina - 1)}>
            <ChevronLeft size={16} /> Anterior
          </button>
          <span style={{ fontSize: 14, color: 'var(--hb-muted)' }}>{pagina} / {totalPaginas}</span>
          <button className="hb-btn hb-btn-sm hb-btn-gray" disabled={pagina >= totalPaginas} onClick={() => irPagina(pagina + 1)}>
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}

      {target && (
        <Modal
          title={`Registrar visita · ${target.cliente_nombre}`}
          icon={MapPin}
          onClose={() => setTarget(null)}
          footer={
            <>
              <button className="hb-btn hb-btn-gray" onClick={() => setTarget(null)}>Cancelar</button>
              <button className="hb-btn" onClick={guardar} disabled={saving}>
                <CheckCircle2 size={16} /> {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </>
          }
        >
          <div className="hb-field">
            <label>Resultado de la visita</label>
            <div className="cm-chips">
              {RESULTADOS.map((r) => (
                <button
                  key={r.v}
                  type="button"
                  className={`cm-chip ${resultado === r.v ? 'sel' : ''}`}
                  onClick={() => setResultado(r.v)}
                >
                  {r.l}
                </button>
              ))}
            </div>
          </div>
          <div className="hb-field" style={{ marginBottom: 0 }}>
            <label htmlFor="obs">Observación</label>
            <textarea
              id="obs"
              className="hb-textarea"
              placeholder="Detalle de la gestión (opcional)…"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </>
  )
}
