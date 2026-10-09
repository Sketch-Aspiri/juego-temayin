interface StarsProps {
  value: number;
  max?: number;
}

export function Stars({ value, max = 3 }: StarsProps) {
  return (
    <span className="stars" role="img" aria-label={`${value} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? 'star star--on' : 'star'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}
