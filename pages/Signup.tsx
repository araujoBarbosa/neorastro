import { useState } from 'react'
import { supabase } from '../src/lib/supabase'

type SignupProps = {
  onNavigateToLogin?: () => void
}

export default function Signup({ onNavigateToLogin }: SignupProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      alert('Erro ao criar usuário')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        name
      })

    if (profileError) {
      alert(profileError.message)
      setLoading(false)
      return
    }

    onNavigateToLogin?.()
  }

  return (
    <div>
      <input placeholder="Nome" onChange={e => setName(e.target.value)} />
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignup} disabled={loading}>
        Criar conta
      </button>
    </div>
  )
}