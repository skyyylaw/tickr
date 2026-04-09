'use client'

import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient()
    // scope: 'global' revokes all sessions, not just the current tab
    await supabase.auth.signOut({ scope: 'global' })
    // Server-side route ensures cookies are cleared even if client cleanup fails
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: '#9a9a9a',
        fontSize: '12px',
        cursor: 'pointer',
      }}
    >
      Sign Out
    </button>
  )
}
