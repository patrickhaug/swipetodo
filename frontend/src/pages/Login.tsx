import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { pb } from '@/lib/pocketbase'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const DEV_USERS = [
  { email: 'patrick@test.de', password: 'test1234', name: 'Patrick' },
  { email: 'lisa@test.de', password: 'test1234', name: 'Lisa' },
]

export function Login() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await pb.collection('users').requestOTP(email)
      navigate('/verify', { state: { otpId: result.otpId, email } })
    } catch (err) {
      setError('Fehler beim Senden des Codes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevLogin = async (devUser: typeof DEV_USERS[0]) => {
    setIsLoading(true)
    setError('')

    try {
      await pb.collection('users').authWithPassword(devUser.email, devUser.password)
      // Refresh to get latest user data including household
      await pb.collection('users').authRefresh()
      navigate('/')
    } catch (err) {
      console.error('Dev login failed:', err)
      setError('Dev login fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SwipeTodo</CardTitle>
          <CardDescription>Melde dich mit deiner E-Mail an</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sende...' : 'Code senden'}
            </Button>
          </form>

          {DEV_MODE && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">Dev Login:</p>
              <div className="flex gap-2">
                {DEV_USERS.map((user) => (
                  <Button
                    key={user.email}
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDevLogin(user)}
                    disabled={isLoading}
                  >
                    {user.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
