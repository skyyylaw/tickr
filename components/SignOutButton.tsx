'use client'

import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
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
