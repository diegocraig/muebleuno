const isSandbox = process.env.NAVE_SANDBOX === 'true'

const AUTH_URL = isSandbox
  ? 'https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate'
  : 'https://services.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate'

export const NAVE_PAYMENT_URL = isSandbox
  ? 'https://api-sandbox.ranty.io/api/payment_request/payment_link'
  : 'https://api.ranty.io/api/payment_request/payment_link'

export const NAVE_PAYMENT_CHECK_BASE = isSandbox
  ? 'https://api-sandbox.ranty.io/ranty-payments/payments'
  : 'https://api.ranty.io/ranty-payments/payments'

let cachedToken: string | null = null
let tokenExpiry = 0

export async function getNaveToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.NAVE_CLIENT_ID,
      client_secret: process.env.NAVE_CLIENT_SECRET,
      audience: 'https://naranja.com/ranty/merchants/api',
    }),
  })

  if (!res.ok) throw new Error(`Nave auth error: ${res.status}`)

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (parseInt(data.expires_in) - 300) * 1000
  return cachedToken!
}
