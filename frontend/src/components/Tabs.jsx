import { useState } from 'react';
import './Tabs.css';

export default function Tabs({ tabs = [], defaultTab, onChange }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === active);

  const handleSelect = (id) => {
    setActive(id);
    if (onChange) onChange(id);
  };

  return (
    <div className="tabs-container">
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            className={`tabs__tab ${active === t.id ? 'tabs__tab--active' : ''}`}
            onClick={() => handleSelect(t.id)}
          >
            {t.icon && <span className="tabs__icon" aria-hidden="true">{t.icon}</span>}
            <span className="tabs__label">{t.label}</span>
            {t.count !== undefined && (
              <span className={`tabs__count ${active === t.id ? 'tabs__count--active' : ''} tabular-nums`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="tabs__panel">
        {activeTab?.content}
      </div>
    </div>
  );
}
