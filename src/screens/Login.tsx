import { useState } from 'react'
import { APP_NAME } from '../config'
import { sendMagicLink } from '../lib/backend'

// Sign-in gate shown when the backend is connected but nobody is signed in.
// Passwordless: the owner enters an email and gets a one-tap magic link.
export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || status === 'sending') return
    setStatus('sending')
    const res = await sendMagicLink(email)
    if (res.ok) {
      setStatus('sent')
      setMessage(res.message)
    } else {
      setStatus('error')
      setMessage(res.message)
    }
  }

  return (
    <div className="mx-auto max-w-md h-full flex flex-col items-center justify-center px-7 bg-[var(--ground)] text-center">
      <img src={`${import.meta.env.BASE_URL}icon-512.png`} alt="" className="w-32 h-32 mb-2" />
      <h1 className="text-3xl font-extrabold text-park-700">{APP_NAME}</h1>
      <p className="mt-1 text-xs font-semibold tracking-wide text-park-500">Where Community Meets Trust</p>
      <p className="mt-2 text-sm text-park-500 leading-relaxed">
        הפארק החברתי לבעלי כלבים.<br />הזינו אימייל ונשלח לכם קישור כניסה — בלי סיסמה.
      </p>

      {status === 'sent' ? (
        <div className="mt-8 w-full rounded-2xl bg-white border border-[var(--line)] p-6"
          style={{ boxShadow: '0 8px 26px rgba(20,60,30,0.10)' }}>
          <div className="text-4xl mb-2">📧</div>
          <p className="font-semibold text-park-700">{message}</p>
          <p className="mt-2 text-xs text-park-400">
            פתחו את המייל שנשלח אל <span className="font-medium">{email}</span> ולחצו על הקישור
            <b> במכשיר שבו תשתמשו באפליקציה</b>.
          </p>
          <p className="mt-2 text-[11px] text-park-400">
            ⚠️ הקישור חד-פעמי ותקף לזמן קצר — אם פג, בקשו חדש כאן.
          </p>
          <button
            onClick={() => { setStatus('idle'); setMessage('') }}
            className="mt-4 text-xs text-park-500 underline"
          >
            שליחה לכתובת אחרת
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 w-full flex flex-col gap-3">
          <input
            type="email"
            inputMode="email"
            dir="ltr"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-center text-base outline-none focus:border-park-400"
          />
          {status === 'error' && <p className="text-xs text-red-500">{message}</p>}
          <button
            type="submit"
            disabled={!valid || status === 'sending'}
            className="w-full rounded-2xl py-3.5 text-white font-bold disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#4fb84a,#2d9c3a)' }}
          >
            {status === 'sending' ? 'שולח…' : 'שלחו לי קישור כניסה'}
          </button>
        </form>
      )}

      <p className="mt-8 text-[11px] text-park-400 leading-relaxed">
        בכניסה אתם מאשרים שימוש בסיסי בנתוני הפרופיל שלכם לצורך הפעלת האפליקציה.
      </p>
    </div>
  )
}
