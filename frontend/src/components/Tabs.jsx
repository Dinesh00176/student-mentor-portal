import { useState } from 'react';
import './Tabs.css';

export default function Tabs({ tabs, defaultTab }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === active);
  return (
    <div>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            className={`tabs__tab ${active === t.id ? 'tabs__tab--active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="tabs__panel">
        {activeTab?.content}
      </div>
    </div>
  );
}
