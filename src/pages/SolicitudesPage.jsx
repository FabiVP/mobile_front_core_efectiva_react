import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, PlusCircle, RefreshCw, StickyNote, Send,
  CheckCircle2, XCircle, Gauge, Search, ShieldCheck, Ban,
  Upload, DollarSign, Info, Calendar, History, ChevronLeft, ChevronRight,
} from 'lucide-react'
import PageHead from '../components/layout/PageHead.jsx'
import Loader from '../components/ui/Loader.jsx'
import Alert from '../components/ui/Alert.jsx'
import Badge from '../components/ui/Badge.jsx'
import Money from '../components/ui/Money.jsx'
import Modal from '../components/ui/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  listarSolicitudes, listarNotas, agregarNota, actualizarSolicitud,
  desembolsarSolicitud, subirDocumento,
  obtenerSolicitud, listarCronograma, listarBitacora,
} from '../services/solicitudesService.js'
import { preEvaluar, consultarBuro } from '../services/evaluacionService.js'
import { extractError, formatDate, formatDateTime } from '../utils/format.js'

const ESTADOS_EVALUABLES = ['en_evaluacion']
const ESTADOS_PRE_COMITE = ['enviado']
const ESTADOS_EN_EVAL = ['recibido_comite']

export default function SolicitudesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const esSupervisor = user?.perfil === 'supervisor'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Notas
  const [notasDe, setNotasDe] = useState(null)
  const [notas, setNotas] = useState([])
  const [notasLoading, setNotasLoading] = useState(false)
  const [nuevaNota, setNuevaNota] = useState('')
  const [savingNota, setSavingNota] = useState(false)

  // Documentos
  const [docsDe, setDocsDe] = useState(null)
  const [docTipo, setDocTipo] = useState('dni_anverso')
  const [docUrl, setDocUrl] = useState('')
  const [savingDoc, setSavingDoc] = useState(false)

  // Detail
  const [detalleDe, setDetalleDe] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [bitacora, setBitacora] = useState([])
  const [cronograma, setCronograma] = useState([])

  // Desembolso
  const [desembolsando, setDesembolsando] = useState(null)
  const [desembolsoRes, setDesembolsoRes] = useState(null)
  const [desembolsoError, setDesembolsoError] = useState(null)

  // Evaluación (supervisor)
  const [evaluar, setEvaluar] = useState(null)
  const [montoAprobado, setMontoAprobado] = useState('')
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [savingEval, setSavingEval] = useState(false)
  const [preEvalRes, setPreEvalRes] = useState(null)
  const [preEvalLoading, setPreEvalLoading] = useState(false)
  const [buroRes, setBuroRes] = useState(null)
  const [buroLoading, setBuroLoading] = useState(false)
  const [evalError, setEvalError] = useState(null)

  const cargar = useCallback((p) => {
    setLoading(true)
    const pg = p ?? pagina
    listarSolicitudes({ pagina: pg, por_pagina: 30 })
      .then((data) => {
        setItems(data.items || [])
        setTotalPaginas(data.total_paginas || 1)
        setTotalItems(data.total || 0)
      })
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [pagina])

  useEffect(() => { cargar() }, [cargar])

  const abrirNotas = async (sol) => {
    setNotasDe(sol)
    setNotas([])
    setNuevaNota('')
    setNotasLoading(true)
    try {
      setNotas(await listarNotas(sol.id) || [])
    } catch (err) {
      setError(extractError(err))
    } finally {
      setNotasLoading(false)
    }
  }

  const guardarNota = async () => {
    if (!nuevaNota.trim() || !notasDe) return
    setSavingNota(true)
    try {
      await agregarNota(notasDe.id, nuevaNota.trim())
      setNotas(await listarNotas(notasDe.id) || [])
      setNuevaNota('')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSavingNota(false)
    }
  }

  const abrirEvaluar = (sol) => {
    setEvaluar(sol)
    setMontoAprobado(String(sol.monto_solicitado))
    setMotivoRechazo('')
    setPreEvalRes(null)
    setBuroRes(null)
    setEvalError(null)
  }

  const ejecutarPreEvaluar = async () => {
    if (!evaluar) return
    setPreEvalLoading(true); setPreEvalRes(null); setEvalError(null)
    try {
      setPreEvalRes(await preEvaluar({
        numero_documento: evaluar.numero_documento || '',
        nombres: evaluar.cliente_nombre || '',
        tipo_negocio: '',
        ingresos_estimados: Number(evaluar.ingresos_estimados) || 0,
        monto_solicitado: Number(evaluar.monto_solicitado) || 0,
        destino_credito: evaluar.destino_credito || '',
      }))
    } catch (err) {
      setEvalError(extractError(err))
    } finally { setPreEvalLoading(false) }
  }

  const ejecutarBuro = async () => {
    if (!evaluar) return
    setBuroLoading(true); setBuroRes(null); setEvalError(null)
    try {
      setBuroRes(await consultarBuro({ dni: evaluar.numero_documento || '' }))
    } catch (err) {
      setEvalError(extractError(err))
    } finally { setBuroLoading(false) }
  }

  const aprobarSolicitud = async () => {
    if (!evaluar) return
    setSavingEval(true)
    try {
      await actualizarSolicitud(evaluar.id, {
        estado: 'aprobado',
        monto_aprobado: Number(montoAprobado),
      })
      setItems((prev) => prev.map((i) => i.id === evaluar.id
        ? { ...i, estado: 'aprobado', monto_aprobado: Number(montoAprobado) } : i))
      setEvaluar(null)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSavingEval(false)
    }
  }

  const rechazarSolicitud = async () => {
    if (!evaluar) return
    setSavingEval(true)
    try {
      await actualizarSolicitud(evaluar.id, {
        estado: 'rechazado',
        motivo_rechazo: motivoRechazo || 'No cumple requisitos',
      })
      setItems((prev) => prev.map((i) => i.id === evaluar.id
        ? { ...i, estado: 'rechazado' } : i))
      setEvaluar(null)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSavingEval(false)
    }
  }

  const avanzarEstado = async (sol, nuevoEstado) => {
    try {
      await actualizarSolicitud(sol.id, { estado: nuevoEstado })
      setItems((prev) => prev.map((i) => i.id === sol.id ? { ...i, estado: nuevoEstado } : i))
    } catch (err) {
      setError(extractError(err))
    }
  }

  const ejecutarDesembolso = async (sol) => {
    setDesembolsando(sol)
    setDesembolsoRes(null)
    setDesembolsoError(null)
    try {
      const res = await desembolsarSolicitud(sol.id)
      setDesembolsoRes(res)
      setItems((prev) => prev.map((i) => i.id === sol.id
        ? { ...i, estado: 'desembolsado' } : i))
      // Cargar cronograma
      try {
        const cro = await listarCronograma(sol.id)
        setCronograma(cro || [])
      } catch (_) {}
    } catch (err) {
      setDesembolsoError(extractError(err))
    }
  }

  const abrirDetalle = async (sol) => {
    setDetalleDe(sol)
    setDetalle(null)
    setBitacora([])
    setCronograma([])
    setDetalleLoading(true)
    try {
      const [det, bit, cro] = await Promise.all([
        obtenerSolicitud(sol.id),
        listarBitacora(sol.id),
        listarCronograma(sol.id),
      ])
      setDetalle(det)
      setBitacora(bit || [])
      setCronograma(cro || [])
    } catch (err) {
      setError(extractError(err))
    } finally {
      setDetalleLoading(false)
    }
  }

  const condicionarSolicitud = async () => {
    if (!evaluar) return
    setSavingEval(true)
    try {
      await actualizarSolicitud(evaluar.id, {
        estado: 'condicionado',
        monto_aprobado: Number(montoAprobado),
        condicion_adicional: motivoRechazo || 'Monto reducido por evaluacion',
      })
      setItems((prev) => prev.map((i) => i.id === evaluar.id
        ? { ...i, estado: 'condicionado', monto_aprobado: Number(montoAprobado) } : i))
      setEvaluar(null)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSavingEval(false)
    }
  }

  const guardarDocumento = async () => {
    if (!docsDe || !docUrl.trim()) return
    setSavingDoc(true)
    try {
      await subirDocumento(docsDe.id, { tipo_documento: docTipo, storage_url: docUrl })
      setDocUrl('')
      setDocTipo('dni_anverso')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSavingDoc(false)
    }
  }

  return (
    <>
      <PageHead
        title={esSupervisor ? "Solicitudes del equipo" : "Mis solicitudes"}
        subtitle={`${totalItems} solicitudes · Pág. ${pagina}/${totalPaginas}`}
        icon={FileText}
        actions={
          <>
            <button className="hb-btn hb-btn-gray hb-btn-sm" onClick={() => cargar(pagina)}><RefreshCw size={15} /> Actualizar</button>
            <button className="hb-btn" onClick={() => navigate('/solicitudes/nueva')}><PlusCircle size={16} /> Nueva</button>
          </>
        }
      />

      {error && <Alert tipo="error">{error}</Alert>}

      {loading ? (
        <Loader text="Cargando solicitudes…" />
      ) : items.length === 0 ? (
        <div className="hb-card hb-table-empty">
          No hay solicitudes registradas.
          <div style={{ marginTop: 14 }}>
            <button className="hb-btn" onClick={() => navigate('/solicitudes/nueva')}><PlusCircle size={16} /> Registrar la primera</button>
          </div>
        </div>
      ) : (
        <div className="hb-card" style={{ padding: 0 }}>
          <div className="hb-table-wrap">
            <table className="hb-table">
              <thead>
                  <tr>
                    <th>Expediente</th>
                    <th>Cliente</th>
                    {esSupervisor && <th>Asesor</th>}
                    <th className="num">Solicitado</th>
                    <th className="num">Aprobado</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.numero_expediente}</strong></td>
                    <td>{s.cliente_nombre}</td>
                    {esSupervisor && <td>{s.asesor_nombre || '—'}</td>}
                    <td className="num"><Money value={s.monto_solicitado} /></td>
                    <td className="num">{s.monto_aprobado ? <Money value={s.monto_aprobado} /> : '—'}</td>
                    <td><Badge estado={s.estado} /></td>
                    <td>{formatDate(s.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="hb-btn hb-btn-ghost hb-btn-sm" onClick={() => abrirDetalle(s)} title="Ver detalle">
                          <Info size={14} />
                        </button>
                        <button className="hb-btn hb-btn-ghost hb-btn-sm" onClick={() => abrirNotas(s)}>
                          <StickyNote size={14} />
                        </button>
                        <button className="hb-btn hb-btn-ghost hb-btn-sm" onClick={() => { setDocsDe(s); setDocUrl(''); setDocTipo('dni_anverso') }}>
                          <Upload size={14} />
                        </button>
                        {esSupervisor && ESTADOS_PRE_COMITE.includes(s.estado) && (
                          <button className="hb-btn hb-btn-sm" style={{ background: '#f59e0b' }} onClick={() => avanzarEstado(s, 'recibido_comite')}>
                            <Send size={14} /> Enviar a comité
                          </button>
                        )}
                        {esSupervisor && ESTADOS_EN_EVAL.includes(s.estado) && (
                          <button className="hb-btn hb-btn-sm" style={{ background: '#f59e0b' }} onClick={() => avanzarEstado(s, 'en_evaluacion')}>
                            <Gauge size={14} /> En evaluación
                          </button>
                        )}
                        {esSupervisor && ESTADOS_EVALUABLES.includes(s.estado) && (
                          <button className="hb-btn hb-btn-sm" style={{ background: 'var(--hb-green)' }} onClick={() => abrirEvaluar(s)}>
                            <CheckCircle2 size={14} /> Evaluar
                          </button>
                        )}
                        {esSupervisor && (s.estado === 'aprobado' || s.estado === 'condicionado') && (
                          <button className="hb-btn hb-btn-sm" style={{ background: '#2563eb' }} onClick={() => ejecutarDesembolso(s)}>
                            <DollarSign size={14} /> Desembolsar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && items.length > 0 && totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button className="hb-btn hb-btn-sm hb-btn-gray" disabled={pagina <= 1} onClick={() => { const np = pagina - 1; setPagina(np); cargar(np) }}>
            <ChevronLeft size={16} /> Anterior
          </button>
          <span style={{ fontSize: 14, color: 'var(--hb-muted)' }}>{pagina} / {totalPaginas}</span>
          <button className="hb-btn hb-btn-sm hb-btn-gray" disabled={pagina >= totalPaginas} onClick={() => { const np = pagina + 1; setPagina(np); cargar(np) }}>
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}

      {evaluar && (
        <Modal
          title={`Evaluar · ${evaluar.numero_expediente}`}
          icon={ShieldCheck}
          onClose={() => setEvaluar(null)}
          style={{ maxWidth: 560 }}
        >
          {evalError && <Alert tipo="error">{evalError}</Alert>}

          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{evaluar.cliente_nombre}</p>
            <p style={{ margin: 0, color: 'var(--hb-muted)', fontSize: 14 }}>
              DNI: {evaluar.numero_documento || '—'} · Asesor: {evaluar.asesor_nombre || '—'} · Solicitado: <Money value={evaluar.monto_solicitado} />
              {evaluar.plazo_meses ? ` · ${evaluar.plazo_meses} meses` : ''}
            </p>
          </div>

          {/* Pre-evaluación */}
          <div className="hb-field">
            <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Gauge size={15} /> Pre-evaluación
            </label>
            {preEvalRes ? (
              <div className={`cm-result ${preEvalRes.calificacion === 'APTO' ? 'apto' : preEvalRes.calificacion === 'NO_PROCEDE' ? 'rechazo' : 'revisar'}`} style={{ padding: '10px 14px', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <strong>{preEvalRes.calificacion === 'APTO' ? 'Apto' : preEvalRes.calificacion === 'NO_PROCEDE' ? 'No procede' : 'Revisar'}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 14 }}>{preEvalRes.motivo}</p>
                  <Badge estado={preEvalRes.calificacion} label={`Puntaje ${preEvalRes.puntaje}/100`} />
                </div>
              </div>
            ) : (
              <button className="hb-btn hb-btn-sm" onClick={ejecutarPreEvaluar} disabled={preEvalLoading} style={{ marginBottom: 10 }}>
                <Gauge size={14} /> {preEvalLoading ? 'Evaluando…' : 'Ejecutar pre-evaluación'}
              </button>
            )}
          </div>

          {/* Buró */}
          <div className="hb-field">
            <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={15} /> Consulta de buró
            </label>
            {buroRes ? (
              <div style={{ marginBottom: 10 }}>
                {buroRes.en_lista_negra && (
                  <div className="cm-result rechazo" style={{ padding: '10px 14px', marginBottom: 8 }}>
                    <div><Ban size={22} style={{ color: 'var(--hb-red)' }} /></div>
                    <div style={{ flex: 1 }}><strong>Cliente bloqueado</strong><p style={{ margin: '4px 0 0', fontSize: 14 }}>{buroRes.motivo_bloqueo}</p></div>
                  </div>
                )}
                <dl className="cm-dl" style={{ margin: 0 }}>
                  <div><dt>SBS</dt><dd><Badge estado={buroRes.calificacion_sbs} /></dd></div>
                  <div><dt>Deuda total</dt><dd><Money value={buroRes.deuda_total} /></dd></div>
                  <div><dt>Entidades</dt><dd>{buroRes.entidades_con_deuda}</dd></div>
                  <div><dt>Mora máxima</dt><dd>{buroRes.dias_mayor_mora} días</dd></div>
                </dl>
              </div>
            ) : (
              <button className="hb-btn hb-btn-sm" onClick={ejecutarBuro} disabled={buroLoading} style={{ marginBottom: 10 }}>
                <Search size={14} /> {buroLoading ? 'Consultando…' : 'Consultar buró'}
              </button>
            )}
          </div>

          <div className="hb-field">
            <label>Monto aprobado (S/)</label>
            <input className="hb-input" inputMode="decimal" value={montoAprobado} onChange={(e) => setMontoAprobado(e.target.value)} />
          </div>
          <div className="hb-field">
            <label>Motivo de rechazo (si aplica)</label>
            <textarea className="hb-textarea" placeholder="Dejar vacío si se aprueba…" value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="hb-btn" style={{ flex: 1, background: 'var(--hb-green)' }} onClick={aprobarSolicitud} disabled={savingEval}>
              <CheckCircle2 size={16} /> {savingEval ? 'Guardando…' : 'Aprobar'}
            </button>
            <button className="hb-btn" style={{ flex: 1, background: '#f59e0b', color: '#fff' }} onClick={condicionarSolicitud} disabled={savingEval}>
              <ShieldCheck size={16} /> Condicionar
            </button>
            <button className="hb-btn" style={{ flex: 1, background: 'var(--hb-red)' }} onClick={rechazarSolicitud} disabled={savingEval || !motivoRechazo.trim()}>
              <XCircle size={16} /> Rechazar
            </button>
          </div>
        </Modal>
      )}

      {notasDe && (
        <Modal
          title={`Notas · ${notasDe.numero_expediente}`}
          icon={StickyNote}
          onClose={() => setNotasDe(null)}
        >
          {notasLoading ? (
            <Loader text="Cargando notas…" />
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, maxHeight: 240, overflowY: 'auto' }}>
                {notas.length === 0 ? (
                  <p style={{ color: 'var(--hb-muted)', margin: 0, fontSize: 14 }}>Sin notas todavía.</p>
                ) : (
                  notas.map((n, i) => (
                    <div key={i} style={{ background: 'var(--hb-bg)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--hb-border)' }}>
                      <div style={{ fontSize: 14 }}>{n.contenido}</div>
                      {n.created_at && <small style={{ color: 'var(--hb-muted)' }}>{formatDateTime(n.created_at)}</small>}
                    </div>
                  ))
                )}
              </div>
              <div className="hb-field" style={{ marginBottom: 10 }}>
                <textarea
                  className="hb-textarea"
                  placeholder="Escribe una nota interna…"
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                />
              </div>
              <button className="hb-btn" onClick={guardarNota} disabled={savingNota || !nuevaNota.trim()}>
                <Send size={15} /> {savingNota ? 'Guardando…' : 'Agregar nota'}
              </button>
            </>
          )}
        </Modal>
      )}

      {/* Desembolso Modal */}
      {desembolsando && (
        <Modal title={`Desembolsar · ${desembolsando.numero_expediente}`} icon={DollarSign}
          onClose={() => { setDesembolsando(null); setDesembolsoRes(null); setDesembolsoError(null) }}
          style={{ maxWidth: 600 }}>
          {desembolsoError && <Alert tipo="error">{desembolsoError}</Alert>}
          {desembolsoRes ? (
            <div>
              <div className="cm-result apto" style={{ padding: '14px', marginBottom: 16 }}>
                <CheckCircle2 size={22} />
                <div><strong>Desembolso exitoso</strong></div>
              </div>
              <dl className="cm-dl" style={{ margin: 0 }}>
                <div><dt>Cuenta ahorro</dt><dd>{desembolsoRes.cuenta_ahorro}</dd></div>
                <div><dt>Crédito</dt><dd>{desembolsoRes.credito}</dd></div>
                <div><dt>Usuario cliente</dt><dd>{desembolsoRes.usuario_cliente}</dd></div>
                <div><dt>TEA usada</dt><dd>{desembolsoRes.tea_usada}%</dd></div>
                <div><dt>Cuota fija</dt><dd><Money value={desembolsoRes.cuota_fija} /></dd></div>
                <div><dt>Plazo</dt><dd>{desembolsoRes.plazo_meses} meses</dd></div>
                <div><dt>Monto aprobado</dt><dd><Money value={desembolsoRes.monto_aprobado} /></dd></div>
              </dl>
              {cronograma.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={16} /> Cronograma de pagos
                  </h4>
                  <div className="hb-table-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
                    <table className="hb-table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>N°</th>
                          <th>Vencimiento</th>
                          <th className="num">Cuota</th>
                          <th className="num">Capital</th>
                          <th className="num">Interés</th>
                          <th className="num">Saldo</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cronograma.map((c) => (
                          <tr key={c.nro_cuota}>
                            <td>{c.nro_cuota}</td>
                            <td>{c.fecha_vencimiento}</td>
                            <td className="num"><Money value={c.monto_cuota} /></td>
                            <td className="num"><Money value={c.monto_capital} /></td>
                            <td className="num"><Money value={c.monto_interes} /></td>
                            <td className="num"><Money value={c.saldo} /></td>
                            <td><Badge estado={c.estado_cuota} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--hb-muted)' }}>Procesando desembolso…</p>
          )}
        </Modal>
      )}

      {/* Detalle Modal */}
      {detalleDe && (
        <Modal title={`Detalle · ${detalleDe.numero_expediente}`} icon={Info}
          onClose={() => { setDetalleDe(null); setDetalle(null); setBitacora([]); setCronograma([]) }}
          style={{ maxWidth: 640 }}>
          {detalleLoading ? (
            <Loader text="Cargando detalle…" />
          ) : detalle ? (
            <div>
              <dl className="cm-dl" style={{ margin: 0 }}>
                <div><dt>Cliente</dt><dd>{detalle.cliente?.nombres} {detalle.cliente?.apellidos}</dd></div>
                <div><dt>Documento</dt><dd>{detalle.cliente?.numero_documento}</dd></div>
                <div><dt>Asesor</dt><dd>{detalle.asesor_nombre}</dd></div>
                <div><dt>Agencia</dt><dd>{detalle.agencia_nombre || '—'}</dd></div>
                <div><dt>Negocio</dt><dd>{detalle.nombre_negocio || '—'}</dd></div>
                <div><dt>Tipo</dt><dd>{detalle.tipo_negocio || '—'}</dd></div>
                <div><dt>Ingresos</dt><dd><Money value={detalle.ingresos_estimados} /></dd></div>
                <div><dt>Gastos</dt><dd><Money value={detalle.gastos_mensuales} /></dd></div>
                <div><dt>Monto solicitado</dt><dd><Money value={detalle.monto_solicitado} /></dd></div>
                <div><dt>Monto aprobado</dt><dd>{detalle.monto_aprobado ? <Money value={detalle.monto_aprobado} /> : '—'}</dd></div>
                <div><dt>Plazo</dt><dd>{detalle.plazo_meses} meses</dd></div>
                <div><dt>Garantía</dt><dd>{detalle.garantia || '—'}</dd></div>
                <div><dt>Destino</dt><dd>{detalle.destino_credito || '—'}</dd></div>
                <div><dt>TEA</dt><dd>{detalle.tea_referencial ? `${detalle.tea_referencial}%` : '—'}</dd></div>
                <div><dt>Estado</dt><dd><Badge estado={detalle.estado} /></dd></div>
                <div><dt>Canal</dt><dd>{detalle.canal}</dd></div>
                {detalle.motivo_rechazo && <div><dt>Motivo rechazo</dt><dd style={{ color: 'var(--hb-red)' }}>{detalle.motivo_rechazo}</dd></div>}
                {detalle.condicion_adicional && <div><dt>Condición</dt><dd style={{ color: '#f59e0b' }}>{detalle.condicion_adicional}</dd></div>}
                <div><dt>Creado</dt><dd>{formatDateTime(detalle.created_at)}</dd></div>
                <div><dt>Actualizado</dt><dd>{formatDateTime(detalle.updated_at)}</dd></div>
              </dl>

              {/* Bitácora */}
              {bitacora.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <History size={16} /> Línea de tiempo
                  </h4>
                  <div style={{ position: 'relative', paddingLeft: 24 }}>
                    {bitacora.map((b, i) => (
                      <div key={i} style={{ position: 'relative', paddingBottom: 14 }}>
                        <div style={{
                          position: 'absolute', left: -20, top: 4, width: 10, height: 10,
                          borderRadius: '50%', background: i === bitacora.length - 1 ? 'var(--hb-green)' : '#ccc',
                        }} />
                        {i < bitacora.length - 1 && <div style={{
                          position: 'absolute', left: -17, top: 14, width: 2, height: 'calc(100% - 4px)',
                          background: '#eee',
                        }} />}
                        <div style={{ fontSize: 13 }}>
                          <Badge estado={b.estado_nuevo} /> <span style={{ color: 'var(--hb-muted)' }}>
                            {formatDateTime(b.created_at)} — {b.cambiado_por}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cronograma */}
              {cronograma.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={16} /> Cronograma de pagos
                  </h4>
                  <div className="hb-table-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
                    <table className="hb-table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>N°</th>
                          <th>Vencimiento</th>
                          <th className="num">Cuota</th>
                          <th className="num">Capital</th>
                          <th className="num">Interés</th>
                          <th className="num">Saldo</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cronograma.map((c) => (
                          <tr key={c.nro_cuota}>
                            <td>{c.nro_cuota}</td>
                            <td>{c.fecha_vencimiento}</td>
                            <td className="num"><Money value={c.monto_cuota} /></td>
                            <td className="num"><Money value={c.monto_capital} /></td>
                            <td className="num"><Money value={c.monto_interes} /></td>
                            <td className="num"><Money value={c.saldo} /></td>
                            <td><Badge estado={c.estado_cuota} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--hb-muted)' }}>No se pudo cargar el detalle.</p>
          )}
        </Modal>
      )}

      {/* Documentos Modal */}
      {docsDe && (
        <Modal title={`Documentos · ${docsDe.numero_expediente}`} icon={Upload}
          onClose={() => setDocsDe(null)}>
          <div className="hb-field">
            <label>Tipo de documento</label>
            <select className="hb-input" value={docTipo} onChange={(e) => setDocTipo(e.target.value)}>
              <option value="dni_anverso">DNI Anverso</option>
              <option value="dni_reverso">DNI Reverso</option>
              <option value="ruc">RUC</option>
              <option value="recibo_servicios">Recibo de servicios</option>
              <option value="foto_negocio">Foto del negocio</option>
              <option value="foto_visita">Foto de visita</option>
              <option value="contrato_arrendamiento">Contrato de arrendamiento</option>
            </select>
          </div>
          <div className="hb-field">
            <label>URL del documento</label>
            <input className="hb-input" placeholder="https://storage.ejemplo.com/doc.pdf" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
          </div>
          <button className="hb-btn" onClick={guardarDocumento} disabled={savingDoc || !docUrl.trim()}>
            <Upload size={15} /> {savingDoc ? 'Subiendo…' : 'Adjuntar documento'}
          </button>
        </Modal>
      )}
    </>
  )
}
