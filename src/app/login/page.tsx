import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Sign In', description: 'Sign in to Inventory OS' };

export default function LoginPage() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '20%', left: '30%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,.08) 0%, transparent 60%)', filter: 'blur(40px)', transform: 'translate(-50%, -50%)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(52,211,153,.05) 0%, transparent 60%)', filter: 'blur(40px)', transform: 'translate(50%, 50%)' }} />
      </div>

      <div className="card animate-fade-up" style={{ width: '100%', maxWidth: 420, padding: '2.5rem 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)', marginBottom: '1rem',
            background: 'linear-gradient(135deg, var(--brand-500), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-brand)',
          }}>
            <Shield size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '.375rem' }}>Welcome back</h1>
          <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Enter your credentials to access your workspace.
          </p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" required />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className="label">Password</label>
              <Link href="#" style={{ fontSize: '.75rem', color: 'var(--brand-500)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
            </div>
            <input className="input" type="password" placeholder="••••••••" required />
          </div>

          <button type="button" className="btn btn-brand-gradient btn-lg" style={{ marginTop: '.5rem', width: '100%', justifyContent: 'center' }}>
            Sign In <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '.8125rem', color: 'var(--text-tertiary)' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
