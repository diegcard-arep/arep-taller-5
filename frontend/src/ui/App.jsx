import React, { useEffect, useMemo, useState } from 'react'

const API = '/api/properties'

function validateProperty(p) {
  const errors = {}
  if (!p.address || p.address.trim() === '') errors.address = 'La dirección es requerida'
  if (p.price == null || isNaN(p.price) || Number(p.price) <= 0) errors.price = 'El precio debe ser mayor a 0'
  if (p.size == null || isNaN(p.size) || Number(p.size) <= 0) errors.size = 'El tamaño debe ser mayor a 0'
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
    <form onSubmit={submit} className="property-form">
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">📍 Dirección</label>
          <input 
            name="address" 
            value={form.address} 
            onChange={handleChange} 
            placeholder="Ej: Calle 123 #45-67" 
            className={errors.address ? 'error-input' : ''}
            required 
          />
          {errors.address && <small className="error-text">{errors.address}</small>}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">💰 Precio</label>
          <input 
            type="number" 
            step="0.01" 
            name="price" 
            value={form.price} 
            onChange={handleChange} 
            placeholder="0.00"
            className={errors.price ? 'error-input' : ''}
            required 
          />
          {errors.price && <small className="error-text">{errors.price}</small>}
        </div>
        
        <div className="form-field">
          <label className="form-label">📐 Tamaño (m²)</label>
          <input 
            type="number" 
            name="size" 
            value={form.size} 
            onChange={handleChange} 
            placeholder="0"
            className={errors.size ? 'error-input' : ''}
            required 
          />
          {errors.size && <small className="error-text">{errors.size}</small>}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">📄 Descripción</label>
          <textarea 
            name="description" 
            value={form.description} 
            onChange={handleChange} 
            placeholder="Descripción adicional de la propiedad..."
            rows="3"
          />
        </div>
      </div>
      
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          ✕ Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          ✓ Guardar
        </button>
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
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="title">
            🏠 <span>Sistema de Gestión de Propiedades</span>
          </h1>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {message && (
            <div className="alert alert-success">
              <span className="alert-icon">✅</span>
              {message}
              <button className="alert-close" onClick={() => setMessage('')}>×</button>
            </div>
          )}
          
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">❌</span>
              {error}
              <button className="alert-close" onClick={() => setError('')}>×</button>
            </div>
          )}

          <section className="filters-section">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🔍 Filtros de Búsqueda</h3>
              </div>
              <div className="card-content">
                <div className="filters-grid">
                  <div className="filter-group">
                    <label>📍 Dirección</label>
                    <input 
                      placeholder="Buscar por dirección..." 
                      value={filter.address} 
                      onChange={e => setFilter({ ...filter, address: e.target.value })} 
                    />
                  </div>
                  <div className="filter-group">
                    <label>💰 Precio Mínimo</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={filter.minPrice} 
                      onChange={e => setFilter({ ...filter, minPrice: e.target.value })} 
                    />
                  </div>
                  <div className="filter-group">
                    <label>💰 Precio Máximo</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="999999.99" 
                      value={filter.maxPrice} 
                      onChange={e => setFilter({ ...filter, maxPrice: e.target.value })} 
                    />
                  </div>
                  <div className="filter-group">
                    <label>📐 Tamaño Mín (m²)</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={filter.minSize} 
                      onChange={e => setFilter({ ...filter, minSize: e.target.value })} 
                    />
                  </div>
                  <div className="filter-group">
                    <label>📐 Tamaño Máx (m²)</label>
                    <input 
                      type="number" 
                      placeholder="9999" 
                      value={filter.maxSize} 
                      onChange={e => setFilter({ ...filter, maxSize: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="filter-actions">
                  <button onClick={() => setPage(0)} className="btn btn-primary">
                    🔍 Buscar
                  </button>
                  <button 
                    onClick={() => { 
                      setFilter({ address: '', minPrice: '', maxPrice: '', minSize: '', maxSize: '' }); 
                      setPage(0) 
                    }}
                    className="btn btn-secondary"
                  >
                    🗑️ Limpiar
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="actions-section">
            <button onClick={openCreate} className="btn btn-success btn-large">
              ➕ Nueva Propiedad
            </button>
          </section>

          <section className="properties-section">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📋 Lista de Propiedades</h3>
                {loading && <div className="loading">⏳ Cargando...</div>}
              </div>
              <div className="card-content">
                {items.length === 0 && !loading ? (
                  <div className="empty-state">
                    <div className="empty-icon">🏘️</div>
                    <h4>No hay propiedades</h4>
                    <p>Comienza agregando tu primera propiedad</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>📍 Dirección</th>
                          <th>💰 Precio</th>
                          <th>📐 Tamaño</th>
                          <th>📄 Descripción</th>
                          <th>⚙️ Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(it => (
                          <tr key={it.id} className="table-row">
                            <td className="id-cell">{it.id}</td>
                            <td className="address-cell">{it.address}</td>
                            <td className="price-cell">
                              ${Number(it.price).toLocaleString('es-CO')}
                            </td>
                            <td className="size-cell">{it.size} m²</td>
                            <td className="description-cell">
                              {it.description || <span className="no-description">Sin descripción</span>}
                            </td>
                            <td className="actions-cell">
                              <button 
                                onClick={() => openEdit(it)} 
                                className="btn btn-sm btn-primary"
                                title="Editar propiedad"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm('¿Estás seguro de eliminar esta propiedad?')) {
                                    remove(it.id)
                                  }
                                }} 
                                className="btn btn-sm btn-danger"
                                title="Eliminar propiedad"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="pagination-section">
            <div className="pagination">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0}
                className="btn btn-secondary"
              >
                ← Anterior
              </button>
              
              <div className="pagination-info">
                <span>Página <strong>{page + 1}</strong> de <strong>{totalPages}</strong></span>
              </div>
              
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
                className="btn btn-secondary"
              >
                Siguiente →
              </button>
              
              <select 
                value={size} 
                onChange={e => { setSize(Number(e.target.value)); setPage(0) }}
                className="page-size-select"
              >
                {[5,10,20,50].map(s => 
                  <option key={s} value={s}>{s} por página</option>
                )}
              </select>
            </div>
          </section>
        </div>
      </main>

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditItem(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editItem ? '✏️ Editar Propiedad' : '➕ Nueva Propiedad'}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => { setShowForm(false); setEditItem(null) }}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <PropertyForm
                initial={editItem}
                onSubmit={async (data) => {
                  try {
                    if (editItem) await update(editItem.id, data); 
                    else await create(data)
                    setShowForm(false); 
                    setEditItem(null)
                  } catch (e) { 
                    setError(e.message) 
                  }
                }}
                onCancel={() => { setShowForm(false); setEditItem(null) }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Variables CSS para colores consistentes */
        :root {
          --primary-color: #4f46e5;
          --primary-hover: #3b82f6;
          --secondary-color: #6b7280;
          --success-color: #10b981;
          --danger-color: #ef4444;
          --warning-color: #f59e0b;
          --background: #f8fafc;
          --surface: #ffffff;
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --border: #e5e7eb;
          --border-focus: #3b82f6;
          --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          --radius: 8px;
          --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Reset y base styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: var(--text-primary);
          background: var(--background);
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        /* Header */
        .header {
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
          color: white;
          padding: 2rem 0;
          box-shadow: var(--shadow-lg);
        }

        .title {
          font-size: 2rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
        }

        .title span {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem 1rem;
          border-radius: var(--radius);
          backdrop-filter: blur(10px);
        }

        /* Main */
        .main {
          flex: 1;
          padding: 2rem 0;
        }

        /* Cards */
        .card {
          background: var(--surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .card-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(to right, #f9fafb, #f3f4f6);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .card-content {
          padding: 1.5rem;
        }

        /* Alerts */
        .alert {
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: relative;
          border: 1px solid transparent;
        }

        .alert-success {
          background: #ecfdf5;
          color: #065f46;
          border-color: #10b981;
        }

        .alert-error {
          background: #fef2f2;
          color: #991b1b;
          border-color: #ef4444;
        }

        .alert-icon {
          font-size: 1.25rem;
        }

        .alert-close {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          opacity: 0.5;
          transition: var(--transition);
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .alert-close:hover {
          opacity: 1;
        }

        /* Filters */
        .filters-section {
          margin-bottom: 1.5rem;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .filter-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* Form Elements */
        input, textarea, select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 1rem;
          transition: var(--transition);
          background: var(--surface);
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
        }

        input.error-input, textarea.error-input {
          border-color: var(--danger-color);
          background: #fef2f2;
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        .page-size-select {
          width: auto;
          min-width: 140px;
        }

        /* Buttons */
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-decoration: none;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: var(--primary-color);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-lg);
        }

        .btn-secondary {
          background: var(--surface);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: var(--secondary-color);
        }

        .btn-success {
          background: var(--success-color);
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: var(--shadow-lg);
        }

        .btn-danger {
          background: var(--danger-color);
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .btn-sm {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          min-width: 40px;
          height: 40px;
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.125rem;
        }

        /* Actions Section */
        .actions-section {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: flex-end;
        }

        /* Table */
        .table-container {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .table th {
          background: #f9fafb;
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }

        .table td {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }

        .table-row:hover {
          background: #f9fafb;
        }

        .id-cell {
          font-weight: 600;
          color: var(--text-secondary);
          width: 80px;
        }

        .address-cell {
          font-weight: 500;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-cell {
          font-weight: 600;
          color: var(--success-color);
          white-space: nowrap;
        }

        .size-cell {
          white-space: nowrap;
        }

        .description-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .no-description {
          color: var(--text-secondary);
          font-style: italic;
        }

        .actions-cell {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          align-items: center;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h4 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        /* Loading */
        .loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        /* Pagination */
        .pagination-section {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
        }

        .pagination-info {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .pagination-info strong {
          color: var(--text-primary);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal {
          background: var(--surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(to right, #f9fafb, #f3f4f6);
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          transition: var(--transition);
        }

        .modal-close:hover {
          background: #f3f4f6;
        }

        .modal-content {
          padding: 1.5rem;
        }

        /* Property Form */
        .property-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .form-row:has(.form-field:nth-child(2)) {
          grid-template-columns: 1fr 1fr;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .error-text {
          color: var(--danger-color);
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .container {
            padding: 0 0.75rem;
          }

          .title {
            font-size: 1.5rem;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .form-row:has(.form-field:nth-child(2)) {
            grid-template-columns: 1fr;
          }

          .actions-cell {
            flex-direction: column;
          }

          .pagination {
            flex-wrap: wrap;
            justify-content: center;
            text-align: center;
          }

          .table-container {
            font-size: 0.8rem;
          }

          .modal {
            margin: 0;
            border-radius: 0;
            max-height: 100vh;
          }
        }

        @media (max-width: 480px) {
          .header {
            padding: 1rem 0;
          }

          .main {
            padding: 1rem 0;
          }

          .card-header, .card-content {
            padding: 1rem;
          }

          .btn-large {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
