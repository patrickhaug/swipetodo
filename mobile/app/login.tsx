import { Redirect } from 'expo-router'

// Login is now handled by the setup flow
// This redirect ensures backwards compatibility
export default function LoginScreen() {
  return <Redirect href="/setup" />
}
