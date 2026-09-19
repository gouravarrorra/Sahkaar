import './Card.css';

export default function Card({ children, onClick, className = '', padding = true, hoverable = false }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`card ${padding ? 'card--padded' : ''} ${hoverable || onClick ? 'card--hoverable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
