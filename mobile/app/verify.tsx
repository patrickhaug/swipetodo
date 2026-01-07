import { Redirect } from 'expo-router'

// OTP verification is no longer needed in the simplified auth flow
// This redirect ensures backwards compatibility
export default function VerifyScreen() {
  return <Redirect href="/setup" />
}
