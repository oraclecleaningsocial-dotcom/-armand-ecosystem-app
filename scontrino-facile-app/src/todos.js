import { useCallback } from 'react'
import { useIdbState } from './utils/idb'

const IDB_KEY = 'todos'

function createId() {
  return `todo_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

export function useTodos() {
  const [todos, update] = useIdbState(IDB_KEY, [])

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
