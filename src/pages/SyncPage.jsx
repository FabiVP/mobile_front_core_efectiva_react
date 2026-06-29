import { useState, useEffect, useCallback, useMemo } from 'react'
import { RefreshCw, Send, Clock, CheckCircle2, XCircle, Database, List } from 'lucide-react'
import PageHead from '../components/layout/PageHead.jsx'
import Loader from '../components/ui/Loader.jsx'
import Alert from '../components/ui/Alert.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import { promover, outbox } from '../services/syncService.js'
import { extractError } from '../utils/format.js'

function estadoTone(estado) {
  if (estado === 'completado') return 'turq'
  if (estado === 'fallido') return 'red'
  if (estado === 'pendiente') return 'amber'
  return 'gray'
}

export default function SyncPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [promoviendo, setPromoviendo] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(null)

  const cargar = useCallback(() => {
    setLoading(true)
    outbox()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const ejecutarPromover = async () => {
    setPromoviendo(true); setError(null); setOk(null)
    try {
      const res = await promover()
      setOk(`Promoción completada: ${res.aplicados || 0} aplicados, ${res.errores || 0} errores.`)
      await outbox().then((data) => setRows(Array.isArray(data) ? data : []))
    } catch (err) {
      setError(extractError(err))
    } finally { setPromoviendo(false) }
  }

  const stats = useMemo(() => {
    const total = rows.length
    const pendientes = rows.filter((r) => r.estado === 'pendiente').length
    const promovidos = rows.filter((r) => r.estado === 'completado').length
    const fallidos = rows.filter((r) => r.estado === 'fallido').length
    return { total, pendientes, promovidos, fallidos }
  }, [rows])

  return (
    <>
      <PageHead
        title="Sincronización Core"
        subtitle={`${stats.pendientes} pendientes · ${stats.total} registros`}
        icon={RefreshCw}
        actions={
          <>
            <button className="hb-btn hb-btn-gray hb-btn-sm" onClick={cargar} disabled={promoviendo}>
              <RefreshCw size={15} /> Recargar
            </button>
            <button className="hb-btn hb-btn-sm" onClick={ejecutarPromover} disabled={promoviendo || stats.pendientes === 0}>
              <Send size={15} /> {promoviendo ? 'Promoviendo…' : 'Promover ahora'}
            </button>
          </>
        }
      />

      {error && <Alert tipo="error">{error}</Alert>}
      {ok && <Alert tipo="success">{ok}</Alert>}

      {loading ? (
        <Loader text="Consultando cola de sincronización…" />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={32} style={{ color: '#f59e0b' }} />
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.pendientes}</div>
                  <small>Pendientes</small>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={32} style={{ color: '#10b981' }} />
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.promovidos}</div>
                  <small>Promovidos</small>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <XCircle size={32} style={{ color: '#ef4444' }} />
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.fallidos}</div>
                  <small>Fallidos</small>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Database size={32} style={{ color: '#6366f1' }} />
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.total}</div>
                  <small>Total</small>
                </div>
              </div>
            </Card>
          </div>

          {rows.length > 0 && (
            <div className="hb-card" style={{ marginTop: '1.5rem' }}>
              <div className="hb-card-title"><List size={18} /> Bitácora de sincronización</div>
              <table className="hb-table">
                <thead>
                  <tr>
                    <th>Entidad</th>
                    <th>Operación</th>
                    <th>Estado</th>
                    <th>Core Ref</th>
                    <th>Intentos</th>
                    <th>Error</th>
                    <th>Creado</th>
                    <th>Procesado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.entidad}</td>
                      <td>{r.operacion}</td>
                      <td><Badge estado={r.estado} tone={estadoTone(r.estado)} label={r.estado} /></td>
                      <td>{r.core_ref || '—'}</td>
                      <td>{r.intentos ?? 0}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85em' }}>
                        {r.ultimo_error || '—'}
                      </td>
                      <td style={{ fontSize: '0.85em' }}>{r.created_at ? new Date(r.created_at).toLocaleString('es-PE') : '—'}</td>
                      <td style={{ fontSize: '0.85em' }}>{r.procesado_at ? new Date(r.procesado_at).toLocaleString('es-PE') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
