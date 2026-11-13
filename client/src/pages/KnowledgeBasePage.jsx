import React, { useState } from 'react';
import {
  ArrowRight,
  Cloud,
  KeyRound,
  LifeBuoy,
  Lock,
  Mail,
  Monitor,
  Printer,
  Search,
  Shield,
  ThumbsDown,
  ThumbsUp,
  Wifi,
} from 'lucide-react';

const articles = [
  [Wifi, 'Network', 'Connecting to the office Wi-Fi', 'Select “NexDesk-Staff”, sign in with your work email and password, then accept the certificate prompt. If it fails, forget the network and try again.'],
  [KeyRound, 'Network', 'Fixing VPN disconnections', 'Update your VPN client, switch from Wi-Fi to a wired or hotspot connection to test, and restart the client. If drops continue, log a ticket with the time of each drop.'],
  [Lock, 'Access request', 'Resetting your password', 'Use “Forgot password” on the sign-in page. Passwords must be 12+ characters. If you are locked out, raise an Access request ticket.'],
  [Printer, 'Hardware', 'Clearing a stuck print queue', 'Cancel all jobs in the printer queue, restart the print spooler service or reboot the computer, then print a single test page.'],
  [Monitor, 'Hardware', 'Laptop won’t power on', 'Hold the power button for 15 seconds with the charger unplugged, reconnect the charger, and wait 10 minutes. If there is no light, create an Urgent ticket.'],
  [Mail, 'Software', 'Setting up email on your phone', 'Add a new Exchange account, enter your work email, and approve the device security prompt. Your IT team may need to approve new devices.'],
  [Shield, 'Other', 'Spotting phishing emails', 'Check the sender address, avoid unexpected attachments, and never share passwords. Forward suspicious messages to the IT team and delete them.'],
  [Cloud, 'Access request', 'Requesting shared drive access', 'Raise an Access request ticket naming the folder and your manager. Access is usually granted within one working day after approval.'],
];

const categories = ['All', 'Network', 'Hardware', 'Software', 'Access request', 'Other'];

export default function KnowledgeBasePage({ go }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [openArticle, setOpenArticle] = useState(articles[0][2]);
  const filteredArticles = articles.filter(article =>
    (category === 'All' || article[1] === category)
    && `${article[2]} ${article[3]}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow green">SELF-SERVICE</span><h1>Knowledge base</h1><p>Quick answers to the most common IT questions.</p></div>
      </div>
      <section className="panel ticket-panel">
        <div className="filters">
          <div className="search-box">
            <Search size={18} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search articles..." />
          </div>
        </div>
        <div className="chips">
          {categories.map(item => (
            <button key={item} className={item === category ? 'on' : ''} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <div className="kb-list">
          {filteredArticles.map(([Icon, articleCategory, title, description]) => (
            <div className={`kb-item ${openArticle === title ? 'open' : ''}`} key={title}>
              <button onClick={() => setOpenArticle(openArticle === title ? null : title)}>
                <span className="stat-icon blue"><Icon size={18} /></span>
                <span><strong>{title}</strong><small>{articleCategory}</small></span>
                <ArrowRight size={16} />
              </button>
              {openArticle === title && (
                <>
                  <p>{description}</p>
                  <div className="kb-feedback">
                    Was this helpful?
                    <button onClick={event => { event.currentTarget.parentNode.textContent = 'Thanks for your feedback!'; }}>
                      <ThumbsUp size={13} /> Yes
                    </button>
                    <button onClick={event => { event.currentTarget.parentNode.textContent = 'Thanks — create a ticket if you still need help.'; }}>
                      <ThumbsDown size={13} /> No
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredArticles.length === 0 && <div className="empty">No articles found.</div>}
        </div>
      </section>
      <div className="kb-cta">
        <LifeBuoy size={22} />
        <div><strong>Still stuck?</strong><p>Can’t find your answer? Our team is happy to help.</p></div>
        <button className="btn primary" onClick={() => go('New ticket')}>Create ticket</button>
      </div>
    </>
  );
}
