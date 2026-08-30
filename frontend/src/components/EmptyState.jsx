import './States.css';

export default function EmptyState({ title = 'Nothing here yet', description, action }) {
  return (
    <div className="state-block state-block--empty" role="status">
      <p className="state-block__title">{title}</p>
      {description && <p className="state-block__desc">{description}</p>}
      {action}
    </div>
  );
}
