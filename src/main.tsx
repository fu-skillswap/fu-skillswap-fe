import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { initTheme } from './theme/theme'
import App from './App.tsx'

// Áp theme đã lưu (mặc định 'royal') trước khi render
initTheme()

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
console.log('[GoogleOAuth] VITE_GOOGLE_CLIENT_ID:', googleClientId)

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>,
)
