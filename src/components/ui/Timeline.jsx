import { Check, Circle } from 'lucide-react';
import './Timeline.css';

export default function Timeline({ steps, currentStep }) {
  return (
    <div className="timeline" role="list" aria-label="Booking status">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div
            key={step}
            className={`timeline__item ${isCompleted ? 'timeline__item--completed' : ''} ${isCurrent ? 'timeline__item--current' : ''} ${isPending ? 'timeline__item--pending' : ''}`}
            role="listitem"
          >
            <div className="timeline__marker">
              {isCompleted ? (
                <Check size={14} strokeWidth={3} />
              ) : isCurrent ? (
                <div className="timeline__dot timeline__dot--active" />
              ) : (
                <Circle size={14} />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`timeline__line ${isCompleted ? 'timeline__line--completed' : ''}`} />
            )}
            <span className="timeline__label">{step}</span>
          </div>
        );
      })}
    </div>
  );
}
