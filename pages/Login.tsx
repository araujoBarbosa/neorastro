import { useState } from 'react'
import { supabase } from '../src/lib/supabase'

type LoginProps = {
  onNavigateToSignup?: () => void
}

export default function Login({ onNavigateToSignup }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }
  }

  return (
    <div>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin} disabled={loading}>
        Entrar
      </button>
      <button onClick={onNavigateToSignup}>Ir para cadastro</button>
    </div>
  )
}