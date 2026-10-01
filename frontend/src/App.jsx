import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [volunteer, setVolunteer] = useState('')
  const [error, setError] = useState(null)         // erreur de chargement
  const [formError, setFormError] = useState(null) // erreur du formulaire

  async function loadTasks() {
    try {
      const res = await fetch(`${API_URL}/tasks`)
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const json = await res.json()
      setTasks(json.task)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  // Ajouter une tâche (POST /tasks)
  async function addTask(e) {
    e.preventDefault()
    setFormError(null)

    // Le titre est obligatoire
    if (!title.trim()) {
      setFormError('Le titre est obligatoire.')
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
        // l'API peut aussi refuser (ex. 400) : on affiche son message
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

  if (error) return <p>Erreur : {error}</p>

  return (
    <div>
      <h1>Mes tâches</h1>

      <form onSubmit={addTask}>
        <input
          value={volunteer}
          onChange={(e) => setVolunteer(e.target.value)}
          placeholder="Nom du bénévole"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la tâche (obligatoire)"
          required
        />
        <button type="submit">Ajouter</button>
        {formError && <p style={{ color: 'red' }}>{formError}</p>}
      </form>

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <input
              type="checkbox"
              checked={task.complété}
              onChange={() => toggleTask(task)}
            />
            {task.titre}
            {task.benevole && <em> (bénévole : {task.benevole})</em>}
            <button onClick={() => deleteTask(task.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App