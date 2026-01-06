import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { pb } from '@/lib/pocketbase'

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function Setup() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const household = await pb.collection('households').create({
        name,
        invite_code: generateInviteCode(),
        created_by: pb.authStore.record?.id,
      })

      await pb.collection('users').update(pb.authStore.record!.id, {
        household: household.id,
      })

      await pb.collection('users').authRefresh()
      navigate('/')
    } catch (err) {
      setError('Fehler beim Erstellen')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Willkommen bei SwipeTodo</CardTitle>
          <CardDescription>Erstelle deinen Haushalt</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              type="text"
              placeholder="Haushaltsname (z.B. Zuhause)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Erstelle...' : 'Haushalt erstellen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
