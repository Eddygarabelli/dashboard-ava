import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props){
  const root = document.getElementById('modal-root')
  if (!open || !root) return null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div role="dialog" aria-modal="true" className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold">{title}</h3>
            <button className="btn" onClick={onClose}>Fechar</button>
          </div>
          <div className="p-4 max-h-[80vh] overflow-auto">{children}</div>
        </div>
      </div>
    </div>,
    root
  )
}
