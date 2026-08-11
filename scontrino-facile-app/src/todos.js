import { useCallback, useEffect, useState } from 'react'
import { idbGet, idbSet } from './utils/idb'
import { isQuotaError, reportStorageError } from './utils/storageAlert'

const IDB_KEY = 'todos'

function createId() {
  return `todo_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

async function loadTodos() {
  try {
    const fromIdb = await idbGet(IDB_KEY)
    if (fromIdb) return fromIdb
  } catch {
    // IndexedDB non disponibile: si riparte da una lista vuota
  }
  return []
}

function saveTodos(todos) {
  idbSet(IDB_KEY, todos).catch((err) => {
    if (isQuotaError(err)) reportStorageError()
  })
}

export function useTodos() {
  const [todos, setTodos] = useState([])

  useEffect(() => {
    let cancelled = false
    loadTodos().then((loaded) => { if (!cancelled) setTodos(loaded) })
    return () => { cancelled = true }
  }, [])

  const update = useCallback((updater) => {
    setTodos((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveTodos(next)
      return next
    })
  }, [])

  const addTodo = useCallback((text) => {
    const todo = { id: createId(), text, done: false, createdAt: new Date().toISOString() }
    update((prev) => [todo, ...prev])
    return todo
  }, [update])

  const toggleTodo = useCallback((id) => {
    update((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }, [update])

  const deleteTodo = useCallback((id) => {
    update((prev) => prev.filter((t) => t.id !== id))
  }, [update])

  return { todos, addTodo, toggleTodo, deleteTodo }
}
