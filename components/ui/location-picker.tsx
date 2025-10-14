'use client';

import { InputHTMLAttributes, forwardRef, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface LocationPickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  value: string;
  onChange: (value: string) => void;
}

// Popular location types and suggestions
const LOCATION_SUGGESTIONS = [
  { icon: '☕', label: 'Coffee Shop', value: 'Coffee Shop' },
  { icon: '🍽️', label: 'Restaurant', value: 'Restaurant' },
  { icon: '🍺', label: 'Bar', value: 'Bar' },
  { icon: '🎬', label: 'Movie Theater', value: 'Movie Theater' },
  { icon: '🏞️', label: 'Park', value: 'Park' },
  { icon: '🏠', label: 'My Place', value: 'My Place' },
  { icon: '🏢', label: 'Office', value: 'Office' },
  { icon: '🎮', label: 'Arcade', value: 'Arcade' },
  { icon: '🎳', label: 'Bowling Alley', value: 'Bowling Alley' },
  { icon: '🏋️', label: 'Gym', value: 'Gym' },
  { icon: '📚', label: 'Library', value: 'Library' },
  { icon: '🛍️', label: 'Mall', value: 'Mall' },
];

interface PlaceResult {
  display_name: string;
  name?: string;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const LocationPicker = forwardRef<HTMLInputElement, LocationPickerProps>(
  ({ className, label, error, helperText, value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState(LOCATION_SUGGESTIONS);
    const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
      // Filter quick pick suggestions based on input
      if (value) {
        const filtered = LOCATION_SUGGESTIONS.filter(suggestion =>
          suggestion.label.toLowerCase().includes(value.toLowerCase()) ||
          suggestion.value.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);

        // Search for real places if input is at least 3 characters
        if (value.length >= 3) {
          // Clear previous timeout
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
          }

          // Show searching state immediately
          setIsSearching(true);

          // Debounce search by 300ms (faster response)
          searchTimeoutRef.current = setTimeout(() => {
            searchPlaces(value);
          }, 300);
        } else {
          setPlaceResults([]);
          setIsSearching(false);
        }
      } else {
        setFilteredSuggestions(LOCATION_SUGGESTIONS);
        setPlaceResults([]);
      }

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [value]);

    const searchPlaces = async (query: string) => {
      setIsSearching(true);
      try {
        // Call our API route which proxies to Nominatim (no CORS issues)
        const response = await fetch(
          `/api/search-places?q=${encodeURIComponent(query)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setPlaceResults(data);
        }
      } catch (error) {
        console.error('Error searching places:', error);
      } finally {
        setIsSearching(false);
      }
    };

    useEffect(() => {
      // Close dropdown when clicking outside
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setIsOpen(true);
    };

    const handleSuggestionClick = (suggestion: typeof LOCATION_SUGGESTIONS[0]) => {
      onChange(suggestion.value);
      setIsOpen(false);
    };

    const handlePlaceClick = (place: PlaceResult) => {
      onChange(place.display_name);
      setIsOpen(false);
    };

    const handleInputFocus = () => {
      setIsOpen(true);
    };

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label className="block text-sm font-semibold mb-2 text-foreground">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              type="text"
              className={cn(
                'flex min-h-[48px] w-full rounded-lg border-2 border-foreground/20 bg-background pl-12 pr-4 py-3 text-base',
                'placeholder:text-foreground/40',
                'focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground',
                'hover:border-foreground/30',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-foreground/5',
                'transition-colors duration-200',
                'touch-manipulation',
                error && 'border-red-600 focus:ring-red-600/20 focus:border-red-600',
                className
              )}
              ref={ref}
              value={value}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              {...props}
            />
          </div>
          
          {/* Dropdown */}
          {isOpen && (placeResults.length > 0 || filteredSuggestions.length > 0 || isSearching) && (
            <div className="absolute z-50 w-full mt-2 bg-background border-2 border-foreground/20 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              <div className="p-2">
                {/* Searching State */}
                {isSearching && placeResults.length === 0 && value.length >= 3 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 px-2 py-3">
                      <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                      <p className="text-sm text-foreground/60">Searching places...</p>
                    </div>
                  </div>
                )}

                {/* Real Places Section */}
                {placeResults.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 px-2 py-1">
                      <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        Places
                      </p>
                    </div>
                    <div className="space-y-1">
                      {placeResults.map((place, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handlePlaceClick(place)}
                          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-foreground/5 transition-colors text-left"
                        >
                          <span className="text-lg mt-0.5">📍</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{place.display_name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Picks Section */}
                {filteredSuggestions.length > 0 && (
                  <div className={placeResults.length > 0 ? 'border-t border-foreground/10 pt-2' : ''}>
                    <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide px-2 py-1">
                      Quick Picks
                    </p>
                    <div className="space-y-1">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.value}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-foreground/5 transition-colors text-left"
                        >
                          <span className="text-xl">{suggestion.icon}</span>
                          <span className="text-sm font-medium">{suggestion.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-foreground/60">{helperText}</p>
        )}
      </div>
    );
  }
);

LocationPicker.displayName = 'LocationPicker';

export { LocationPicker };

