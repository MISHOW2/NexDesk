import React from 'react';
import { formatSlug } from '../utils/ticket.js';

export default function Badge({ kind, children, icon: Icon }) {
  return (
    <span className={`badge ${kind}-${formatSlug(children)}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
