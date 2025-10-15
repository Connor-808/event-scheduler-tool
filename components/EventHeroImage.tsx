/**
 * EventHeroImage Component
 * Reusable hero image display for event pages
 */

interface EventHeroImageProps {
  imageUrl: string | null;
  eventTitle: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function EventHeroImage({
  imageUrl,
  eventTitle,
  size = 'medium',
  className = ''
}: EventHeroImageProps) {
  if (!imageUrl) return null;

  const sizeClasses = {
    small: 'h-32 sm:h-40',
    medium: 'h-48 sm:h-64',
    large: 'h-64 sm:h-80',
  };

  return (
    <div className={`mb-8 rounded-xl overflow-hidden shadow-lg ${className}`}>
      <img
        src={imageUrl}
        alt={eventTitle}
        className={`w-full ${sizeClasses[size]} object-cover`}
      />
    </div>
  );
}
