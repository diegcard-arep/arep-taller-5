import React, { useEffect, useMemo, useState } from 'react'

const API = 'http://localhost:8080/api/properties'

function validateProperty(p) {
  const errors = {}
  if (!p.address || p.address.trim() === '') errors.address = 'Dirección es requerida'
  if (p.price == null || isNaN(p.price) || Number(p.price) <= 0) errors.price = 'Precio debe ser > 0'
  if (p.size == null || isNaN(p.size) || Number(p.size) <= 0) errors.size = 'Tamaño debe ser > 0'
  return errors
}

function PropertyForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({ address: '', price: '', size: '', description: '', ...(initial || {}) })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const submit = (e) => {
    e.preventDefault()
    const errs = validateProperty({ ...form, price: Number(form.price), size: Number(form.size) })
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      onSubmit({ ...form, price: Number(form.price), size: Number(form.size) })
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <div>
        <label>Dirección</label>
        <input name="address" value={form.address} onChange={handleChange} required />
        {errors.address && <small className="error">{errors.address}</small>}
      </div>
      <div>
        <label>Precio</label>
        <input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} required />
        {errors.price && <small className="error">{errors.price}</small>}
      </div>
      <div>
        <label>Tamaño (m²)</label>
        <input type="number" name="size" value={form.size} onChange={handleChange} required />
        {errors.size && <small className="error">{errors.size}</small>}
      </div>
      <div>
        <label>Descripción</label>
        <textarea name="description" value={form.description} onChange={handleChange} />
      </div>
      <div className="actions">
        <button type="submit">Guardar</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}

export default function App() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState({ address: '', minPrice: '', maxPrice: '', minSize: '', maxSize: '' })
  const [message, setMessage] = useState('')

  const qs = useMemo(() => {
    const params = new URLSearchParams()
    if (filter.address) params.set('address', filter.address)
    if (filter.minPrice) params.set('minPrice', filter.minPrice)
    if (filter.maxPrice) params.set('maxPrice', filter.maxPrice)
    if (filter.minSize) params.set('minSize', filter.minSize)
    if (filter.maxSize) params.set('maxSize', filter.maxSize)
    params.set('page', page)
    params.set('size', size)
    return params.toString()
  }, [filter, page, size])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}?${qs}`)
      if (!res.ok) throw new Error('Error al cargar propiedades')
      const data = await res.json()
      setItems(data.content)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [qs])

  async function create(item) {
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
    if (!res.ok) throw new Error('Error al crear')
    await load()
    setMessage('Propiedad creada correctamente')
  }

  async function update(id, item) {
    const res = await fetch(`${API}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
    if (!res.ok) throw new Error('Error al actualizar')
    await load()
    setMessage('Propiedad actualizada correctamente')
  }

  async function remove(id) {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) throw new Error('Error al eliminar')
    await load()
    setMessage('Propiedad eliminada correctamente')
  }

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)

  const openCreate = () => { setEditItem(null); setShowForm(true) }
  const openEdit = (it) => { setEditItem(it); setShowForm(true) }

  return (
    <div className="container">
      <h1>Gestión de Propiedades</h1>

      {message && <div className="msg success">{message}</div>}
      {error && <div className="msg error">{error}</div>}

      <section className="card">
        <h3>Filtros</h3>
        <div className="grid">
          <input placeholder="Dirección" value={filter.address} onChange={e => setFilter({ ...filter, address: e.target.value })} />
          <input type="number" step="0.01" placeholder="Precio mín" value={filter.minPrice} onChange={e => setFilter({ ...filter, minPrice: e.target.value })} />
          <input type="number" step="0.01" placeholder="Precio máx" value={filter.maxPrice} onChange={e => setFilter({ ...filter, maxPrice: e.target.value })} />
          <input type="number" placeholder="Tamaño mín" value={filter.minSize} onChange={e => setFilter({ ...filter, minSize: e.target.value })} />
          <input type="number" placeholder="Tamaño máx" value={filter.maxSize} onChange={e => setFilter({ ...filter, maxSize: e.target.value })} />
          <button onClick={() => setPage(0)}>Aplicar</button>
          <button onClick={() => { setFilter({ address: '', minPrice: '', maxPrice: '', minSize: '', maxSize: '' }); setPage(0) }}>Limpiar</button>
        </div>
      </section>

      <div className="actions">
        <button onClick={openCreate}>Nueva Propiedad</button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Dirección</th>
              <th>Precio</th>
              <th>Tamaño</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{it.address}</td>
                <td>{Number(it.price).toLocaleString()}</td>
                <td>{it.size}</td>
                <td>{it.description}</td>
                <td>
                  <button onClick={() => openEdit(it)}>Editar</button>
                  <button onClick={() => remove(it.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Anterior</button>
        <span>Página {page + 1} de {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Siguiente</button>
        <select value={size} onChange={e => { setSize(Number(e.target.value)); setPage(0) }}>
          {[5,10,20,50].map(s => <option key={s} value={s}>{s}/página</option>)}
        </select>
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editItem ? 'Editar' : 'Nueva'} Propiedad</h3>
            <PropertyForm
              initial={editItem}
              onSubmit={async (data) => {
                try {
                  if (editItem) await update(editItem.id, data); else await create(data)
                  setShowForm(false); setEditItem(null)
                } catch (e) { setError(e.message) }
              }}
              onCancel={() => { setShowForm(false); setEditItem(null) }}
            />
          </div>
        </div>
      )}

      <style>{`
        .container { max-width: 1100px; margin: 0 auto; padding: 1rem; font-family: system-ui, Arial; }
        .actions { margin: 1rem 0; display: flex; gap: .5rem; }
        .card { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
        .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: .5rem; }
        input, textarea, select { width: 100%; padding: .5rem; border: 1px solid #ccc; border-radius: 4px; }
        button { padding: .5rem .75rem; border: 1px solid #0d6efd; background: #0d6efd; color: #fff; border-radius: 4px; cursor: pointer; }
        button[disabled] { opacity: .5; cursor: not-allowed; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 1px solid #eee; padding: .5rem; text-align: left; }
        .pagination { display: flex; align-items: center; gap: .5rem; margin-top: 1rem; }
        .msg { padding: .5rem; border-radius: 4px; margin: .5rem 0; }
        .msg.success { background: #e7f7ee; color: #0a8247; }
        .msg.error { background: #fdecea; color: #b00020; }
        .error { color: #b00020; }
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: grid; place-items: center; }
        .modal-content { background: #fff; padding: 1rem; border-radius: 8px; width: 600px; max-width: 95vw; }
      `}</style>
    </div>
  )
}
