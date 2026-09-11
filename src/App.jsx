import { useEffect, useState } from 'react'

const STORAGE_KEY = 'my-projects-v1'

const LANGUAGES = [
  'JavaScript',
  'HTML',
  'CSS',
  'React',
]

const emptyProject = {
  id: '',
  title: '',
  language: 'JavaScript',
  description: '',
  cover: '',
  code: '',
}

function createId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  )
}

function loadProjects() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)

    if (!data) {
      return []
    }

    const projects = JSON.parse(data)

    return Array.isArray(projects)
      ? projects
      : []
  } catch {
    return []
  }
}

function formatDate(date) {
  if (!date) return ''

  return new Date(date).toLocaleDateString(
    'ru-RU'
  )
}

function copyText(text) {
  return navigator.clipboard.writeText(text)
}

export default function App() {
  const [projects, setProjects] = useState(
    loadProjects
  )

  const [showForm, setShowForm] = useState(false)

  const [editingProject, setEditingProject] =
    useState(null)

  const [selectedProject, setSelectedProject] =
    useState(null)

  const [fullscreenProject, setFullscreenProject] =
    useState(null)

  const [message, setMessage] = useState('')

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(projects)
    )
  }, [projects])

  function notify(text) {
    setMessage(text)

    setTimeout(() => {
      setMessage('')
    }, 1800)
  }

  function openCreate() {
    setEditingProject(null)
    setShowForm(true)
  }

  function openEdit(project) {
    setSelectedProject(null)
    setEditingProject(project)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingProject(null)
  }

  function saveProject(data) {
    if (!data.title.trim()) {
      notify('Введите название')
      return
    }

    const now = Date.now()

    if (editingProject) {
      setProjects(prev =>
        prev.map(project =>
          project.id === editingProject.id
            ? {
                ...project,
                ...data,
                title: data.title.trim(),
                updatedAt: now,
              }
            : project
        )
      )

      notify('Проект изменён')
    } else {
      const project = {
        ...emptyProject,
        ...data,
        id: createId(),
        title: data.title.trim(),
        createdAt: now,
        updatedAt: now,
      }

      setProjects(prev => [
        project,
        ...prev,
      ])

      notify('Проект создан')
    }

    closeForm()
  }

  function deleteProject(id) {
    const answer = window.confirm(
      'Удалить проект?'
    )

    if (!answer) return

    setProjects(prev =>
      prev.filter(
        project => project.id !== id
      )
    )

    setSelectedProject(null)
    setFullscreenProject(null)

    notify('Проект удалён')
  }

  async function copyAll(project) {
    const text = `
Название: ${project.title}
Язык: ${project.language}

Описание:
${project.description}

Код:
${project.code}
`.trim()

    try {
      await copyText(text)
      notify('Всё скопировано')
    } catch {
      notify('Ошибка копирования')
    }
  }

  async function copyCode(project) {
    try {
      await copyText(project.code || '')
      notify('Код скопирован')
    } catch {
      notify('Ошибка копирования')
    }
  }

  return (
    <>
      <header className="header">
        <div className="logo">
          <span className="logo-icon">
            📓
          </span>

          <div>
            <h1>Мои проекты</h1>
            <p>
              Личный блокнот
            </p>
          </div>
        </div>

        <button
          type="button"
          className="button primary"
          onClick={openCreate}
        >
          + Новый проект
        </button>
      </header>

      <main className="container">
        {projects.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              📁
            </div>

            <h2>
              Пока нет проектов
            </h2>

            <p>
              Создай первый проект.
            </p>

            <button
              type="button"
              className="button primary"
              onClick={openCreate}
            >
              + Создать проект
            </button>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() =>
                  setSelectedProject(
                    project
                  )
                }
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <ProjectForm
          initialProject={
            editingProject || emptyProject
          }
          editing={Boolean(editingProject)}
          onSave={saveProject}
          onClose={closeForm}
        />
      )}

      {selectedProject && (
        <ProjectViewer
          project={selectedProject}
          onClose={() =>
            setSelectedProject(null)
          }
          onEdit={() =>
            openEdit(selectedProject)
          }
          onDelete={() =>
            deleteProject(
              selectedProject.id
            )
          }
          onCopyAll={() =>
            copyAll(selectedProject)
          }
          onCopyCode={() =>
            copyCode(selectedProject)
          }
          onFullscreen={() => {
            setSelectedProject(null)
            setFullscreenProject(
              selectedProject
            )
          }}
        />
      )}

      {fullscreenProject && (
        <FullscreenViewer
          project={fullscreenProject}
          onClose={() =>
            setFullscreenProject(null)
          }
          onCopyCode={() =>
            copyCode(fullscreenProject)
          }
        />
      )}

      {message && (
        <div className="toast">
          {message}
        </div>
      )}
    </>
  )
}

/* =========================
   КАРТОЧКА
========================= */

function ProjectCard({
  project,
  onOpen,
}) {
  const [broken, setBroken] =
    useState(false)

  return (
    <article
      className="project-card"
      onClick={onOpen}
    >
      <div className="project-cover">
        {project.cover &&
        !broken ? (
          <img
            src={project.cover}
            alt=""
            onError={() =>
              setBroken(true)
            }
          />
        ) : (
          <div className="cover-placeholder">
            📁
          </div>
        )}
      </div>

      <div className="project-info">
        <div className="project-top">
          <span className="language">
            {project.language}
          </span>

          <span className="date">
            {formatDate(
              project.updatedAt
            )}
          </span>
        </div>

        <h2>
          {project.title ||
            'Без названия'}
        </h2>

        <p>
          {project.description ||
            'Описание отсутствует'}
        </p>

        <div className="open-link">
          Открыть проект →
        </div>
      </div>
    </article>
  )
}

/* =========================
   ФОРМА
========================= */

function ProjectForm({
  initialProject,
  editing,
  onSave,
  onClose,
}) {
  const [title, setTitle] =
    useState(
      initialProject.title || ''
    )

  const [language, setLanguage] =
    useState(
      initialProject.language ||
        'JavaScript'
    )

  const [description, setDescription] =
    useState(
      initialProject.description || ''
    )

  const [cover, setCover] =
    useState(
      initialProject.cover || ''
    )

  const [code, setCode] =
    useState(
      initialProject.code || ''
    )

  const [coverError, setCoverError] =
    useState(false)

  function submit(event) {
    event.preventDefault()

    onSave({
      title,
      language,
      description,
      cover,
      code,
    })
  }

  return (
    <div
      className="modal-background"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div className="form-modal">
        <div className="modal-title">
          <div>
            <h2>
              {editing
                ? 'Редактировать проект'
                : 'Новый проект'}
            </h2>

            <p>
              Заполни информацию
              о проекте.
            </p>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="form-body">
            <label>
              Название проекта
              <input
                value={title}
                onChange={event =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="Например: Todo App"
              />
            </label>

            <label>
              Язык
              <select
                value={language}
                onChange={event =>
                  setLanguage(
                    event.target.value
                  )
                }
              >
                {LANGUAGES.map(
                  languageItem => (
                    <option
                      key={
                        languageItem
                      }
                      value={
                        languageItem
                      }
                    >
                      {languageItem}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Описание
              <textarea
                value={description}
                onChange={event =>
                  setDescription(
                    event.target.value
                  )
                }
                rows="6"
                placeholder="Что делает проект, что ты в нём изучил и т.д."
              />
            </label>

            <label>
              Ссылка на обложку
              <input
                value={cover}
                onChange={event => {
                  setCover(
                    event.target.value
                  )
                  setCoverError(false)
                }}
                placeholder="https://example.com/image.jpg"
              />
            </label>

            {cover && (
              <div className="cover-preview">
                {!coverError ? (
                  <img
                    src={cover}
                    alt=""
                    onError={() =>
                      setCoverError(
                        true
                      )
                    }
                  />
                ) : (
                  <span>
                    Не удалось загрузить
                    картинку
                  </span>
                )}
              </div>
            )}

            <label>
              Код проекта
              <textarea
                className="code-input"
                value={code}
                onChange={event =>
                  setCode(
                    event.target.value
                  )
                }
                rows="18"
                spellCheck="false"
                placeholder={`const button = document.querySelector('#button')

button.addEventListener('click', () => {
  console.log('Привет!')
})`}
              />
            </label>
          </div>

          <div className="form-footer">
            <button
              type="button"
              className="button"
              onClick={onClose}
            >
              Отмена
            </button>

            <button
              type="submit"
              className="button primary"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================
   ОБЫЧНЫЙ ПРОСМОТР
========================= */

function ProjectViewer({
  project,
  onClose,
  onEdit,
  onDelete,
  onCopyAll,
  onCopyCode,
  onFullscreen,
}) {
  return (
    <div
      className="modal-background"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div className="viewer">
        <div className="viewer-head">
          <div>
            <span className="viewer-language">
              {project.language}
            </span>

            <h2>
              {project.title ||
                'Без названия'}
            </h2>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="viewer-body">
          {project.description && (
            <section>
              <h3>
                Описание
              </h3>

              <p className="description">
                {project.description}
              </p>
            </section>
          )}

          {project.code && (
            <section>
              <div className="section-head">
                <h3>Код</h3>

                <button
                  type="button"
                  className="button small"
                  onClick={
                    onCopyCode
                  }
                >
                  📋 Копировать код
                </button>
              </div>

              <pre className="code-view">
                <code>
                  {project.code}
                </code>
              </pre>
            </section>
          )}
        </div>

        <div className="viewer-footer">
          <button
            type="button"
            className="button danger"
            onClick={onDelete}
          >
            🗑 Удалить
          </button>

          <div className="viewer-buttons">
            <button
              type="button"
              className="button"
              onClick={onCopyAll}
            >
              📋 Копировать всё
            </button>

            <button
              type="button"
              className="button"
              onClick={onFullscreen}
            >
              ⛶ Во весь экран
            </button>

            <button
              type="button"
              className="button primary"
              onClick={onEdit}
            >
              ✏️ Редактировать
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================
   ПОЛНЫЙ ЭКРАН
========================= */

function FullscreenViewer({
  project,
  onClose,
  onCopyCode,
}) {
  return (
    <div className="fullscreen">
      <header className="fullscreen-head">
        <div>
          <span className="viewer-language">
            {project.language}
          </span>

          <h1>
            {project.title ||
              'Без названия'}
          </h1>
        </div>

        <div className="fullscreen-actions">
          {project.code && (
            <button
              type="button"
              className="button"
              onClick={onCopyCode}
            >
              📋 Копировать код
            </button>
          )}

          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </header>

      <main className="fullscreen-content">
        <section>
          <h2>
            Описание
          </h2>

          <div className="fullscreen-description">
            {project.description ||
              'Описание отсутствует.'}
          </div>
        </section>

        <section>
          <h2>Код</h2>

          {project.code ? (
            <pre className="fullscreen-code">
              <code>
                {project.code}
              </code>
            </pre>
          ) : (
            <div className="no-code">
              Кода пока нет.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
