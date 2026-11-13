import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';

export default function CommandPalette({ open, onClose, items }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredItems = useMemo(
    () => items
      .filter(item => `${item.label} ${item.hint || ''}`.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 12),
    [items, query]
  );

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  useEffect(() => setSelectedIndex(0), [query]);

  if (!open) return null;

  const run = item => {
    if (!item) return;
    onClose();
    item.run();
  };

  const handleKeyDown = event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(index => Math.min(index + 1, filteredItems.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(index => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      run(filteredItems[selectedIndex]);
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  let previousGroup = '';

  return (
    <div className="cmd-back" onClick={onClose}>
      <div className="cmd" onClick={event => event.stopPropagation()}>
        <div className="cmd-in">
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tickets, pages and actions…"
          />
          <span className="kbd">ESC</span>
        </div>
        <div className="cmd-list">
          {filteredItems.length === 0 && <div className="empty">No results for “{query}”.</div>}
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            const heading = item.group !== previousGroup
              ? <div className="cmd-grp" key={`group-${item.group}`}>{item.group.toUpperCase()}</div>
              : null;
            previousGroup = item.group;

            return (
              <React.Fragment key={item.id}>
                {heading}
                <button
                  className={`cmd-item ${index === selectedIndex ? 'sel' : ''}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => run(item)}
                >
                  <Icon size={17} />
                  {item.label}
                  <small>{item.hint}</small>
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="cmd-foot">
          <span><CornerDownLeft size={11} /> to select</span>
          <span>↑↓ to navigate</span>
        </div>
      </div>
    </div>
  );
}
