import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { pb } from '@/lib/pocketbase'

export function Verify() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { otpId, email } = (location.state as { otpId?: string; email?: string }) || {}

  if (!otpId) {
    return <Navigate to="/login" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await pb.collection('users').authWithOTP(otpId, code)

      const pendingInvite = localStorage.getItem('pendingInviteCode')
      if (pendingInvite) {
        navigate('/join/' + pendingInvite)
      } else if (!pb.authStore.record?.household) {
        navigate('/setup')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError('Ungültiger Code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Code eingeben</CardTitle>
          <CardDescription>
            Wir haben einen Code an {email} gesendet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Prüfe...' : 'Bestätigen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
