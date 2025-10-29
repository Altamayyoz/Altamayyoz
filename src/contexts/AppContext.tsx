import React, { createContext, useContext, useEffect, useReducer } from 'react'

type State = {
  darkMode: boolean
  notifications: Array<any>
}

type Action = { type: 'TOGGLE_DARK' } | { type: 'SET_NOTIFICATIONS'; payload: any[] }

const initialState: State = {
  darkMode: false,
  notifications: []
}

const AppContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | undefined>(undefined)

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TOGGLE_DARK':
      const v = !state.darkMode
      try {
        localStorage.setItem('ttm_dark', JSON.stringify(v))
      } catch (e) {}
      return { ...state, darkMode: v }
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload }
    default:
      return state
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const raw = localStorage.getItem('ttm_dark')
      return { ...init, darkMode: raw ? JSON.parse(raw) : init.darkMode }
    } catch (e) {
      return init
    }
  })

  // Sync dark mode to <html> element so Tailwind and custom CSS apply globally
  useEffect(() => {
    const el = document.documentElement
    if (state.darkMode) el.classList.add('dark')
    else el.classList.remove('dark')
  }, [state.darkMode])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
