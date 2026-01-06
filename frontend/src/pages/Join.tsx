import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { pb } from '@/lib/pocketbase'
import { useAuth } from '@/contexts/AuthContext'

export function Join() {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      localStorage.setItem('pendingInviteCode', code || '')
      navigate('/login')
      return
    }

    joinHousehold()
  }, [user, code])

  const joinHousehold = async () => {
    try {
      const households = await pb.collection('households').getList(1, 1, {
        filter: `invite_code = "${code}"`,
      })

      if (households.items.length === 0) {
        setError('Ungültiger Einladungscode')
        setStatus('error')
        return
      }

      const household = households.items[0]

      await pb.collection('users').update(pb.authStore.model!.id, {
        household: household.id,
      })

      localStorage.removeItem('pendingInviteCode')
      await pb.collection('users').authRefresh()

      setStatus('success')
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setError('Fehler beim Beitreten')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === 'loading' && 'Trete bei...'}
            {status === 'success' && 'Willkommen!'}
            {status === 'error' && 'Fehler'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Einen Moment...'}
            {status === 'success' && 'Du bist jetzt Mitglied des Haushalts'}
            {status === 'error' && error}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
