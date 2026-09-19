import { Star } from 'lucide-react';
import { useState } from 'react';
import './Rating.css';

export function RatingDisplay({ value, size = 16 }) {
  return (
    <div className="rating-display" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`rating-star ${star <= Math.round(value) ? 'rating-star--filled' : 'rating-star--empty'}`}
          fill={star <= Math.round(value) ? 'var(--color-rating)' : 'none'}
          stroke={star <= Math.round(value) ? 'var(--color-rating)' : 'var(--color-text-disabled)'}
        />
      ))}
      {value > 0 && <span className="rating-value">{value}</span>}
    </div>
  );
}

export function RatingInput({ value, onChange, size = 32 }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="rating-input" role="radiogroup" aria-label="Rate your experience">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="rating-input__btn"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${star} star`}
          role="radio"
          aria-checked={value === star}
        >
          <Star
            size={size}
            className={`rating-star ${star <= (hovered || value) ? 'rating-star--filled' : 'rating-star--empty'}`}
            fill={star <= (hovered || value) ? 'var(--color-rating)' : 'none'}
            stroke={star <= (hovered || value) ? 'var(--color-rating)' : 'var(--color-text-disabled)'}
          />
        </button>
      ))}
    </div>
  );
}
