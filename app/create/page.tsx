'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  getThisWeekendTimes,
  getNextWeekendTimes,
  getWeekdayEveningTimes,
  validateEventTitle,
  validateLocation,
  getUserCookieId,
} from '@/lib/utils';

type Step = 'time-selection' | 'event-details';

interface TimeSlotInput {
  id: string;
  start_time: string; // ISO datetime-local format
  label: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('time-selection');
  const [isLoading, setIsLoading] = useState(false);

  // Time Selection State
  const [presetType, setPresetType] = useState<'this-weekend' | 'next-weekend' | 'weekday' | null>(null);
  const [customSlots, setCustomSlots] = useState<TimeSlotInput[]>([
    { id: '1', start_time: '', label: '' },
    { id: '2', start_time: '', label: '' },
  ]);
  const [useCustom, setUseCustom] = useState(false);

  // Event Details State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePresetSelect = (type: 'this-weekend' | 'next-weekend' | 'weekday') => {
    setPresetType(type);
    setUseCustom(false);
  };

  const handleCustomToggle = () => {
    setUseCustom(true);
    setPresetType(null);
  };

  // Get formatted times for the selected preset
  const getPresetTimes = (type: 'this-weekend' | 'next-weekend' | 'weekday') => {
    const presetMap = {
      'this-weekend': getThisWeekendTimes,
      'next-weekend': getNextWeekendTimes,
      'weekday': getWeekdayEveningTimes,
    };
    const times = presetMap[type]();
    return times.map(slot => ({
      formatted: new Date(slot.start_time).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      label: slot.label,
    }));
  };

  const addCustomSlot = () => {
    if (customSlots.length < 10) {
      setCustomSlots([
        ...customSlots,
        { id: Date.now().toString(), start_time: '', label: '' },
      ]);
    }
  };

  const removeCustomSlot = (id: string) => {
    if (customSlots.length > 2) {
      setCustomSlots(customSlots.filter((slot) => slot.id !== id));
    }
  };

  const updateCustomSlot = (id: string, field: 'start_time' | 'label', value: string) => {
    setCustomSlots(
      customSlots.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot))
    );
  };

  const validateTimeSelection = (): boolean => {
    if (!useCustom && !presetType) {
      alert('Please select a preset or create custom time slots');
      return false;
    }

    if (useCustom) {
      const filledSlots = customSlots.filter((slot) => slot.start_time);
      if (filledSlots.length < 2) {
        alert('Please add at least 2 time slots');
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateTimeSelection()) {
      setStep('event-details');
    }
  };

  const handleCreateEvent = async () => {
    // Validate event details
    const newErrors: Record<string, string> = {};

    const titleValidation = validateEventTitle(title);
    if (!titleValidation.valid) {
      newErrors.title = titleValidation.error!;
    }

    const locationValidation = validateLocation(location);
    if (!locationValidation.valid) {
      newErrors.location = locationValidation.error!;
    }

    if (notes.length > 500) {
      newErrors.notes = 'Notes must be 500 characters or less';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // Prepare time slots
      let timeSlots: { start_time: Date; label: string }[];

      if (presetType) {
        // Use preset times
        const presetMap = {
          'this-weekend': getThisWeekendTimes,
          'next-weekend': getNextWeekendTimes,
          weekday: getWeekdayEveningTimes,
        };
        timeSlots = presetMap[presetType]();
      } else {
        // Use custom times
        timeSlots = customSlots
          .filter((slot) => slot.start_time)
          .map((slot) => ({
            start_time: new Date(slot.start_time),
            label: slot.label || '',
          }));
      }

      const cookieId = getUserCookieId();

      // Create event via API
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          location: location || null,
          notes: notes || null,
          timeSlots,
          cookieId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const data = await response.json();

      // Navigate to share screen
      router.push(`/event/${data.eventId}/share`);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 sm:pb-12">
      <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className={`h-2 w-20 sm:w-24 rounded-full transition-all duration-300 ${step === 'time-selection' ? 'bg-foreground' : 'bg-foreground/20'}`} />
              <div className={`h-2 w-20 sm:w-24 rounded-full transition-all duration-300 ${step === 'event-details' ? 'bg-foreground' : 'bg-foreground/20'}`} />
            </div>
            <p className="text-center text-sm sm:text-base text-foreground/70 mt-3 font-medium">
              {step === 'time-selection' ? 'Step 1 of 2: Choose Times' : 'Step 2 of 2: Event Details'}
            </p>
          </div>

          {step === 'time-selection' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">When should we meet?</h1>
                <p className="text-base sm:text-lg text-foreground/70">Choose preset times or create your own</p>
              </div>

              {/* Quick Presets */}
              <Card>
                <h2 className="text-lg sm:text-xl font-bold mb-4">Quick Presets</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <button
                    onClick={() => handlePresetSelect('this-weekend')}
                    className={`p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 text-left touch-manipulation ${
                      presetType === 'this-weekend'
                        ? 'border-foreground bg-foreground/10 shadow-sm'
                        : 'border-foreground/20 hover:border-foreground/40 active:bg-foreground/5'
                    }`}
                  >
                    <div className="font-bold mb-1.5 text-base">This Weekend</div>
                    <div className="text-xs sm:text-sm text-foreground/60 leading-relaxed">Sat & Sun mornings</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('next-weekend')}
                    className={`p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 text-left touch-manipulation ${
                      presetType === 'next-weekend'
                        ? 'border-foreground bg-foreground/10 shadow-sm'
                        : 'border-foreground/20 hover:border-foreground/40 active:bg-foreground/5'
                    }`}
                  >
                    <div className="font-bold mb-1.5 text-base">Next Weekend</div>
                    <div className="text-xs sm:text-sm text-foreground/60 leading-relaxed">Next Sat & Sun</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('weekday')}
                    className={`p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 text-left touch-manipulation ${
                      presetType === 'weekday'
                        ? 'border-foreground bg-foreground/10 shadow-sm'
                        : 'border-foreground/20 hover:border-foreground/40 active:bg-foreground/5'
                    }`}
                  >
                    <div className="font-bold mb-1.5 text-base">Weekday Evenings</div>
                    <div className="text-xs sm:text-sm text-foreground/60 leading-relaxed">Mon, Wed, Thu</div>
                  </button>
                </div>

                {/* Show selected preset times */}
                {presetType && !useCustom && (
                  <div className="mt-5 pt-5 border-t border-foreground/10">
                    <p className="text-sm font-semibold text-foreground/70 mb-3">
                      Selected Times:
                    </p>
                    <div className="space-y-2">
                      {getPresetTimes(presetType).map((time, index) => (
                        <div 
                          key={index}
                          className="p-3 rounded-lg bg-foreground/5 border border-foreground/10"
                        >
                          <div className="font-medium text-sm">{time.formatted}</div>
                          {time.label && (
                            <div className="text-xs text-foreground/60 mt-0.5">{time.label}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Custom Times */}
              <Card>
                <div className="flex justify-between items-center mb-4 sm:mb-5">
                  <h2 className="text-lg sm:text-xl font-bold">Custom Times</h2>
                  <button
                    onClick={handleCustomToggle}
                    className="text-sm font-medium text-foreground/70 hover:text-foreground active:text-foreground transition-colors touch-manipulation min-h-[44px] px-3 rounded-lg hover:bg-foreground/10"
                  >
                    {useCustom ? '✓ Using custom' : 'Switch to custom'}
                  </button>
                </div>

                {useCustom && (
                  <div className="space-y-4 sm:space-y-5">
                    {customSlots.map((slot, index) => (
                      <div key={slot.id} className="flex gap-3 items-start">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <Input
                            type="datetime-local"
                            value={slot.start_time}
                            onChange={(e) => updateCustomSlot(slot.id, 'start_time', e.target.value)}
                            label={index === 0 ? 'Date & Time' : undefined}
                          />
                          <Input
                            type="text"
                            value={slot.label}
                            onChange={(e) => updateCustomSlot(slot.id, 'label', e.target.value)}
                            placeholder="Label (optional)"
                            label={index === 0 ? 'Label' : undefined}
                          />
                        </div>
                        {customSlots.length > 2 && (
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => removeCustomSlot(slot.id)}
                            className={index === 0 ? 'mt-8 sm:mt-9' : ''}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}

                    {customSlots.length < 10 && (
                      <Button variant="secondary" onClick={addCustomSlot} className="w-full">
                        + Add Time Slot ({customSlots.length}/10)
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {step === 'event-details' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Event Details</h1>
                <p className="text-base sm:text-lg text-foreground/70">Tell everyone what you&apos;re planning</p>
              </div>

              <Card>
                <div className="space-y-6 sm:space-y-7">
                  <Input
                    label="Event Title"
                    placeholder="What are we doing?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={errors.title}
                    required
                    maxLength={100}
                    helperText={`${title.length}/100 characters`}
                  />

                  <Input
                    label="Location"
                    placeholder="Where should we meet?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    error={errors.location}
                    maxLength={200}
                    helperText="Optional"
                  />

                  <Textarea
                    label="Additional Notes"
                    placeholder="Any other details?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    error={errors.notes}
                    maxLength={500}
                    helperText={`Optional - ${notes.length}/500 characters`}
                  />
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 sm:hidden z-50">
        <div className="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {step === 'time-selection' ? (
            <Button size="lg" onClick={handleNextStep} className="w-full min-h-[52px] shadow-lg">
              Next: Event Details →
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setStep('time-selection')}
                className="flex-1 min-h-[52px]"
              >
                ← Back
              </Button>
              <Button 
                size="lg" 
                onClick={handleCreateEvent} 
                isLoading={isLoading}
                className="flex-[2] min-h-[52px] shadow-lg"
              >
                Create Event
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop buttons - hidden on mobile */}
      <div className="hidden sm:block px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {step === 'time-selection' ? (
            <div className="flex justify-end">
              <Button size="lg" onClick={handleNextStep}>
                Next: Event Details
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 justify-between">
              <Button variant="secondary" onClick={() => setStep('time-selection')}>
                Back
              </Button>
              <Button size="lg" onClick={handleCreateEvent} isLoading={isLoading}>
                Create Event
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

