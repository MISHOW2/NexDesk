import React, { useState } from 'react';
import { Plus, ShieldCheck, Zap } from 'lucide-react';
import { SLA_HOURS } from '../utils/ticket.js';

const categories = ['Hardware', 'Network', 'Software', 'Access / Passwords'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const articleSuggestions = [
  ['VPN', 'Fixing VPN disconnections'],
  ['wi-fi', 'Connecting to the office Wi-Fi'],
  ['password', 'Resetting your password'],
  ['print', 'Clearing a stuck print queue'],
  ['laptop', 'Laptop won’t power on'],
  ['email', 'Setting up email on your phone'],
  ['phish', 'Spotting phishing emails'],
  ['drive', 'Requesting shared drive access'],
];

export default function NewTicketPage({ go, onCreateTicket, onTicketCreated }) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const suggestions = articleSuggestions.filter(([keyword]) =>
    title.toLowerCase().includes(keyword.toLowerCase())
  ).slice(0, 2);

  const submit = async event => {
    event.preventDefault();
    setSubmitting(true);
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    const ticket = await onCreateTicket(formData);
    setSubmitting(false);
    if (ticket) {
      setTitle('');
      onTicketCreated(ticket);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow green">SUPPORT REQUEST</span><h1>Create a new ticket</h1><p>Tell us what’s happening and we’ll help get it sorted.</p></div>
      </div>
      <div className="form-grid">
        <section className="panel form-panel">
          <form onSubmit={submit}>
            <label>
              Ticket title <span>*</span>
              <input
                name="title"
                required
                maxLength="200"
                placeholder="Briefly describe the issue"
                value={title}
                onChange={event => setTitle(event.target.value)}
              />
            </label>
            {suggestions.map(([, article]) => (
              <div className="suggest" key={article}>
                <Zap size={14} /> Suggested article:
                <button type="button" onClick={() => go('Knowledge base')}>{article} →</button>
              </div>
            ))}
            <label>Description <span>*</span><textarea name="description" required maxLength="5000" rows="6" placeholder="What happened? What have you already tried?" /></label>
            <label>Category
              <select name="category">{categories.map(category => <option key={category}>{category}</option>)}</select>
            </label>
            <label>Priority <span className="muted" style={{ fontWeight: 500 }}>— response target shown below each option</span></label>
            <div className="priority-picker">
              {priorities.map((priority, index) => (
                <label key={priority}>
                  <input type="radio" name="priority" value={priority} defaultChecked={index === 1} />
                  <span>{priority}<small style={{ display: 'block', fontSize: 10, opacity: 0.75 }}>{SLA_HOURS[priority]}h SLA</small></span>
                </label>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="btn secondary" onClick={() => go('All tickets')}>Cancel</button>
              <button className="btn primary" type="submit" disabled={submitting}>
                <Plus size={17} /> {submitting ? 'Submitting…' : 'Submit ticket'}
              </button>
            </div>
          </form>
        </section>
        <section className="panel guide">
          <span className="guide-icon"><ShieldCheck size={25} /></span>
          <h3>What happens next?</h3>
          {[
            ['01', 'Ticket submitted', 'Your request is logged with an SLA target.'],
            ['02', 'Team assigned', 'An agent will take ownership of your request.'],
            ['03', 'Work in progress', 'Follow updates and reply in the conversation.'],
            ['04', 'Issue resolved', 'We’ll close the request once it’s sorted.'],
          ].map(([number, heading, description]) => (
            <div className="guide-step" key={number}>
              <span>{number}</span>
              <div><strong>{heading}</strong><p>{description}</p></div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
