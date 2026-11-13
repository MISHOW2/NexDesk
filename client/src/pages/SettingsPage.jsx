import React, { useState } from 'react';
import { Save } from 'lucide-react';

const departments = ['IT', 'Finance', 'HR', 'Safety'];
const preferences = [
  ['updates', 'Ticket status updates', 'When the status of your ticket changes'],
  ['comments', 'New comments', 'When someone replies to your ticket'],
  ['digest', 'Weekly digest', 'A summary of your activity every Monday'],
];

export default function SettingsPage({ auth, onSave }) {
  const [preferencesEnabled, setPreferencesEnabled] = useState({ updates: true, comments: true, digest: false });

  const togglePreference = key => (
    <button
      type="button"
      className={`toggle ${preferencesEnabled[key] ? 'on' : ''}`}
      onClick={() => setPreferencesEnabled(current => ({ ...current, [key]: !current[key] }))}
    >
      <i />
    </button>
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow green">ACCOUNT</span>
          <h1>Settings</h1>
          <p>Profile changes and notification preferences are not synced to the server yet.</p>
        </div>
      </div>
      <div className="form-grid">
        <section className="panel form-panel">
          <h3>Profile</h3>
          <form onSubmit={event => {
            event.preventDefault();
            onSave(Object.fromEntries(new FormData(event.currentTarget)));
          }}>
            <label>Full name<input name="name" defaultValue={auth.name} required /></label>
            <label>
              Department
              <select name="department" defaultValue={auth.department} disabled>
                {departments.map(department => <option key={department}>{department}</option>)}
              </select>
              <small>Department access is managed by your account and cannot be changed here.</small>
            </label>
            <label>Email address<input value={auth.email} disabled readOnly /></label>
            <label>Role<input value={auth.role} disabled readOnly /></label>
            <div className="form-actions"><button className="btn primary" type="submit"><Save size={16} /> Save changes</button></div>
          </form>
        </section>
        <section className="panel">
          <h3>Notifications</h3>
          {preferences.map(([key, title, description]) => (
            <div className="pref" key={key}>
              <div><strong>{title}</strong><p>{description}</p></div>
              {togglePreference(key)}
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
