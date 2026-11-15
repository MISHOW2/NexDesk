import React, { useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, Headphones } from 'lucide-react';

const departments = ['IT', 'Finance', 'HR', 'Safety'];

export default function AuthScreen({ onAuthenticate, toast }) {
  const [mode, setMode] = useState('signin');

  const submit = event => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    onAuthenticate(mode, formData);
  };

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <div className="brand light">
          <span className="brand-icon"><Headphones size={22} /></span>
          <span>NexDesk<span className="brand-dot">.</span></span>
        </div>
        <div className="auth-pitch">
          <div className="eyebrow">ENTERPRISE SERVICE MANAGEMENT</div>
          <h1>Resolve faster.<br /><em>Work smarter.</em></h1>
          <p>One workspace for requests, SLAs and knowledge — built for modern IT teams.</p>
          <div className="auth-graphic">
            <div className="float-card"><CheckCircle2 size={19} /> Issue resolved <span>Just now</span></div>
            <div className="float-card second"><Activity size={19} /> SLA compliance <strong>↗ 96%</strong></div>
          </div>
        </div>
        <span className="auth-foot">© 2026 NexDesk. All rights reserved.</span>
      </div>
      <div className="auth-right">
        <div className="auth-box">
          <div className="mobile-brand brand">
            <span className="brand-icon"><Headphones size={22} /></span>
            NexDesk.
          </div>
          <span className="pill-top"><span className="pulse" /> SERVICE DESK PLATFORM</span>
          <h2>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="muted">
            {mode === 'signin' ? 'Sign in to your workspace to get started.' : 'Join your team and start managing requests.'}
          </p>
          <div className="auth-tabs">
            <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
          </div>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <label>Full name<input name="name" placeholder="Your full name" maxLength="100" required /></label>
                <label>
                  Department
                  <select name="department">{departments.map(department => <option key={department}>{department}</option>)}</select>
                </label>
              </>
            )}
            <label>Email address<input type="email" name="email" placeholder="name@company.com" maxLength="320" required /></label>
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                minLength={mode === 'register' ? 10 : undefined}
                required
              />
            </label>
            {mode === 'register' && (
              <label>
                Confirm password
                <input type="password" name="rePassword" placeholder="Confirm your password" minLength="10" required />
              </label>
            )}
            <button className="btn primary full" type="submit">
              {mode === 'signin' ? 'Sign in to workspace' : 'Create account'} <ArrowRight size={17} />
            </button>
          </form>
          <p className="muted">Use your organization account to sign in.</p>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
