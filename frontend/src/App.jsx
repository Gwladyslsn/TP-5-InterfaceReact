import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL

const FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'done', label: 'Complétées' },
  { value: 'todo', label: 'Non complétées' },
]

// Hors du composant : récupère les données, ne touche à aucun état
async function fetchTasks() {
  const res = await fetch(`${API_URL}/tasks`)
  if (!res.ok) throw new Error(`Erreur ${res.status}`)
  const json = await res.json()
  return json.task
}

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [volunteer, setVolunteer] = useState('')
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)

  // Pour recharger la liste après ajout / modification / suppression
  async function loadTasks() {
    try {
      setTasks(await fetchTasks())
    } catch (err) {
      setError(err.message)
    }
  }

  // Chargement initial
  useEffect(() => {
    let ignore = false

    fetchTasks()
      .then((data) => {
        if (!ignore) setTasks(data)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })

    return () => {
      ignore = true
    }
  }, [])

  async function addTask(e) {
    e.preventDefault()
    setFormError(null)

    if (!title.trim()) {
      setFormError('Le titre de la tâche est obligatoire.')
      return
    }

    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: title.trim(),
          benevole: volunteer.trim(),
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message || `Erreur ${res.status}`)
      }
      setTitle('')
      setVolunteer('')
      loadTasks()
    } catch (err) {
      setFormError(err.message)
    }
  }

  async function toggleTask(task) {
    await fetch(`${API_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, complété: !task.complété }),
    })
    loadTasks()
  }

  async function deleteTask(id) {
    await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' })
    loadTasks()
  }

  // ----- Filtre -----
  const counts = {
    all: tasks.length,
    done: tasks.filter((t) => t.complété).length,
    todo: tasks.filter((t) => !t.complété).length,
  }

  const visibleTasks = tasks.filter((t) => {
    if (filter === 'done') return t.complété
    if (filter === 'todo') return !t.complété
    return true
  })

  const emptyMessages = {
    all: 'Aucune tâche pour le moment.',
    done: 'Aucune tâche complétée.',
    todo: 'Aucune tâche à faire : tout est terminé !',
  }

  if (error) {
    return (
      <main className="app">
        <p className="message-error" role="alert">Erreur : {error}</p>
      </main>
    )
  }

  return (
    <>
      <a className="skip-link" href="#main">Aller au contenu principal</a>

      <main className="app" id="main">
        <h1>Mes tâches</h1>

        <section className="card" aria-labelledby="form-title">
          <h2 id="form-title">Ajouter une tâche</h2>
          <p className="hint">Les champs marqués d'un astérisque (*) sont obligatoires.</p>

          <form onSubmit={addTask} noValidate>
            <div className="field">
              <label htmlFor="volunteer">Nom du bénévole</label>
              <input
                id="volunteer"
                type="text"
                value={volunteer}
                onChange={(e) => setVolunteer(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="title">
                Titre de la tâche <span aria-hidden="true">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-required="true"
                aria-invalid={formError ? 'true' : 'false'}
                aria-describedby={formError ? 'form-error' : undefined}
              />
            </div>

            {formError && (
              <p id="form-error" className="message-error" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" className="btn-primary">Ajouter la tâche</button>
          </form>
        </section>

        <section aria-labelledby="list-title">
          <h2 id="list-title">Liste des tâches</h2>

          <fieldset className="filter">
            <legend>Afficher</legend>
            {FILTERS.map((f) => (
              <label key={f.value} className="filter-option">
                <input
                  type="radio"
                  name="filter"
                  value={f.value}
                  checked={filter === f.value}
                  onChange={() => setFilter(f.value)}
                />
                {f.label} ({counts[f.value]})
              </label>
            ))}
          </fieldset>

          {/* Annoncé par les lecteurs d'écran quand le filtre change */}
          <p className="result-count" role="status">
            {visibleTasks.length} tâche{visibleTasks.length > 1 ? 's' : ''} affichée
            {visibleTasks.length > 1 ? 's' : ''}
          </p>

          {visibleTasks.length === 0 ? (
            <p className="empty">{emptyMessages[filter]}</p>
          ) : (
            <ul className="task-list">
              {visibleTasks.map((task) => (
                <li key={task.id} className={`task ${task.complété ? 'done' : ''}`}>
                  <input
                    type="checkbox"
                    id={`task-${task.id}`}
                    checked={task.complété}
                    onChange={() => toggleTask(task)}
                  />
                  <label htmlFor={`task-${task.id}`} className="task-label">
                    <span className="task-title">{task.titre}</span>
                    {task.benevole && (
                      <span className="task-volunteer">Bénévole : {task.benevole}</span>
                    )}
                    {task.complété && <span className="sr-only"> (terminée)</span>}
                  </label>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Supprimer la tâche ${task.titre}`}
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}

export default App