const LOGO_URL = '/logo_efectiva.png'

export default function Logo({
  size = 44,
  wordmark = true,
  variant = 'light',
  subtitle = 'CORE FINANCIERO',
}) {
  const subColor = variant === 'light' ? 'rgba(255,255,255,.85)' : '#6b6b7b'
  const subSize = Math.max(9, Math.round(size * 0.23))

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <img src={LOGO_URL} alt="Financiera Efectiva"
        style={{ height: size, width: 'auto', objectFit: 'contain' }}
      />
      {wordmark && subtitle && (
        <span style={{ fontSize: subSize, fontWeight: 700, color: subColor, letterSpacing: '1.2px' }}>
          {subtitle}
        </span>
      )}
    </span>
  )
}
