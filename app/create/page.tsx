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
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className={`h-2 w-16 rounded-full ${step === 'time-selection' ? 'bg-foreground' : 'bg-foreground/20'}`} />
              <div className={`h-2 w-16 rounded-full ${step === 'event-details' ? 'bg-foreground' : 'bg-foreground/20'}`} />
            </div>
            <p className="text-center text-sm text-foreground/60 mt-2">
              {step === 'time-selection' ? 'Step 1 of 2: Choose Times' : 'Step 2 of 2: Event Details'}
            </p>
          </div>

          {step === 'time-selection' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold">When should we meet?</h1>
                <p className="text-foreground/60">Choose preset times or create your own</p>
              </div>

              {/* Quick Presets */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Presets</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handlePresetSelect('this-weekend')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      presetType === 'this-weekend'
                        ? 'border-foreground bg-foreground/5'
                        : 'border-foreground/20 hover:border-foreground/40'
                    }`}
                  >
                    <div className="font-medium mb-1">This Weekend</div>
                    <div className="text-sm text-foreground/60">Sat 10am, Sat 2pm, Sun 11am</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('next-weekend')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      presetType === 'next-weekend'
                        ? 'border-foreground bg-foreground/5'
                        : 'border-foreground/20 hover:border-foreground/40'
                    }`}
                  >
                    <div className="font-medium mb-1">Next Weekend</div>
                    <div className="text-sm text-foreground/60">Next Sat/Sun times</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('weekday')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      presetType === 'weekday'
                        ? 'border-foreground bg-foreground/5'
                        : 'border-foreground/20 hover:border-foreground/40'
                    }`}
                  >
                    <div className="font-medium mb-1">Weekday Evenings</div>
                    <div className="text-sm text-foreground/60">Mon, Wed, Thu 7pm</div>
                  </button>
                </div>
              </Card>

              {/* Custom Times */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Custom Times</h2>
                  <button
                    onClick={handleCustomToggle}
                    className="text-sm text-foreground/60 hover:text-foreground"
                  >
                    {useCustom ? 'Using custom times' : 'Switch to custom'}
                  </button>
                </div>

                {useCustom && (
                  <div className="space-y-4">
                    {customSlots.map((slot, index) => (
                      <div key={slot.id} className="flex gap-3 items-start">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            className="mt-8"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}

                    {customSlots.length < 10 && (
                      <Button variant="secondary" onClick={addCustomSlot} className="w-full">
                        Add Time Slot ({customSlots.length}/10)
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {step === 'event-details' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold">Event Details</h1>
                <p className="text-foreground/60">Tell everyone what you&apos;re planning</p>
              </div>

              <Card className="p-6">
                <div className="space-y-6">
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
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-foreground/10 sm:hidden z-50 safe-area-bottom">
        <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {step === 'time-selection' ? (
            <Button size="lg" onClick={handleNextStep} className="w-full min-h-[44px]">
              Next: Event Details
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setStep('time-selection')}
                className="flex-1 min-h-[44px]"
              >
                Back
              </Button>
              <Button 
                size="lg" 
                onClick={handleCreateEvent} 
                isLoading={isLoading}
                className="flex-1 min-h-[44px]"
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

