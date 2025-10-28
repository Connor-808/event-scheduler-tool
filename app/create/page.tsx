'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  validateEventTitle,
  validateLocation,
  getUserCookieId,
} from '@/lib/utils';

type Step = 'time-selection' | 'event-details';

interface TimeSlotInput {
  id: string;
  start_time: string; // ISO datetime-local format
}

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('time-selection');
  const [isLoading, setIsLoading] = useState(false);

  // Time Selection State
  const [timeSlots, setTimeSlots] = useState<TimeSlotInput[]>([]);

  // Event Details State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addCustomSlot = () => {
    if (timeSlots.length < 10) {
      setTimeSlots([
        ...timeSlots,
        { id: Date.now().toString(), start_time: '' },
      ]);
    }
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter((slot) => slot.id !== id));
  };

  const updateTimeSlot = (id: string, value: string) => {
    setTimeSlots(
      timeSlots.map((slot) => (slot.id === id ? { ...slot, start_time: value } : slot))
    );
  };

  const validateTimeSelection = (): boolean => {
    const filledSlots = timeSlots.filter((slot) => slot.start_time);
    
    if (filledSlots.length < 2) {
      alert('Please add at least 2 time slots');
      return false;
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
      // Prepare time slots - filter out empty ones and convert to proper format
      const timeSlotsForSubmission = timeSlots
        .filter((slot) => slot.start_time)
        .map((slot) => ({
          start_time: new Date(slot.start_time),
          label: '',
        }));

      const cookieId = getUserCookieId();

      // Create event via API
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          location: location || null,
          notes: notes || null,
          timeSlots: timeSlotsForSubmission,
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
                <p className="text-base sm:text-lg text-foreground/70">Add your time slot options below</p>
              </div>

              {/* Time Slots Display */}
              <Card>
                <div className="mb-4 sm:mb-5">
                  <h2 className="text-lg sm:text-xl font-bold">Time Slots ({timeSlots.length}/10)</h2>
                </div>

                {timeSlots.length === 0 ? (
                  <div className="text-center py-12 sm:py-16 text-foreground/60">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-foreground/5 flex items-center justify-center">
                      <svg className="w-8 h-8 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold mb-2">No time slots yet</p>
                    <p className="text-sm mb-6">Add at least 2 options for your event</p>
                    <Button 
                      variant="secondary" 
                      onClick={addCustomSlot} 
                      className="min-h-[52px] px-6"
                    >
                      + Add First Time Slot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeSlots.map((slot, index) => (
                      <div 
                        key={slot.id} 
                        className="group relative bg-background rounded-2xl border-2 border-foreground/10 hover:border-foreground/20 transition-all duration-200 overflow-hidden"
                      >
                        {/* Slot Number Badge */}
                        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold text-foreground/70 z-10">
                          {index + 1}
                        </div>
                        
                        {/* Main Content */}
                        <div className="pl-16 pr-16 py-4">
                          <Input
                            type="datetime-local"
                            value={slot.start_time}
                            onChange={(e) => updateTimeSlot(slot.id, e.target.value)}
                            className="text-base"
                          />
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => removeTimeSlot(slot.id)}
                          className="absolute top-1/2 -translate-y-1/2 right-4 w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-95 transition-all duration-200 flex items-center justify-center touch-manipulation"
                          aria-label="Remove time slot"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* Add Another Button - Inline with slots */}
                    {timeSlots.length < 10 && (
                      <button
                        onClick={addCustomSlot}
                        className="w-full py-5 rounded-2xl border-2 border-dashed border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5 active:bg-foreground/10 transition-all duration-200 flex items-center justify-center gap-2 text-foreground/70 hover:text-foreground font-medium touch-manipulation"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Another Time Slot
                      </button>
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
        <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {step === 'time-selection' ? (
            <Button 
              size="lg" 
              onClick={handleNextStep} 
              className="w-full min-h-[56px] shadow-lg rounded-2xl font-semibold"
            >
              Continue to Event Details →
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setStep('time-selection')}
                className="flex-1 min-h-[56px] rounded-2xl font-semibold"
              >
                ← Back
              </Button>
              <Button 
                size="lg" 
                onClick={handleCreateEvent} 
                isLoading={isLoading}
                className="flex-[2] min-h-[56px] shadow-lg rounded-2xl font-semibold"
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
              <Button size="lg" onClick={handleNextStep} className="rounded-2xl px-8">
                Continue to Event Details →
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 justify-between">
              <Button 
                variant="secondary" 
                onClick={() => setStep('time-selection')}
                className="rounded-2xl px-6"
              >
                ← Back
              </Button>
              <Button 
                size="lg" 
                onClick={handleCreateEvent} 
                isLoading={isLoading}
                className="rounded-2xl px-8"
              >
                Create Event
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

