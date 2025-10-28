'use client';

import { useState, useRef, useEffect } from 'react';
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

interface TimeSlotInputProps {
  slot: TimeSlotInput;
  index: number;
  isNew: boolean;
  onUpdate: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onPickerOpened: () => void;
}

function TimeSlotInput({ slot, index, isNew, onUpdate, onRemove, onPickerOpened }: TimeSlotInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew && inputRef.current) {
      // Small delay to ensure the input is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
        // Try to open the picker (may not work on all browsers/devices)
        try {
          inputRef.current?.showPicker?.();
          onPickerOpened();
        } catch {
          // showPicker() not supported or blocked, just focus
          onPickerOpened();
        }
      }, 100);
    }
  }, [isNew, onPickerOpened]);

  return (
    <div className="group relative">
      {/* Time Slot Card */}
      <div className="relative bg-foreground/[0.03] hover:bg-foreground/[0.05] rounded-xl border border-foreground/10 hover:border-foreground/20 transition-all duration-200">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Slot Number */}
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-foreground/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-foreground/70">{index + 1}</span>
          </div>
          
          {/* Date/Time Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="datetime-local"
              value={slot.start_time}
              onChange={(e) => onUpdate(slot.id, e.target.value)}
              placeholder="Select date and time"
              className="w-full h-10 px-3 text-[15px] font-medium bg-transparent border-none focus:outline-none focus:ring-0 appearance-none transition-colors"
              style={{ colorScheme: 'light dark' }}
            />
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onRemove(slot.id)}
            className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-600 transition-all duration-200 flex items-center justify-center group/delete"
            aria-label="Remove time slot"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('event-details');
  const [isLoading, setIsLoading] = useState(false);

  // Time Selection State
  const [timeSlots, setTimeSlots] = useState<TimeSlotInput[]>([]);
  const [newSlotId, setNewSlotId] = useState<string | null>(null);

  // Event Details State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addCustomSlot = () => {
    if (timeSlots.length < 10) {
      const newId = Date.now().toString();
      setTimeSlots([
        ...timeSlots,
        { id: newId, start_time: '' },
      ]);
      setNewSlotId(newId);
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

  const validateEventDetails = (): boolean => {
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
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (validateEventDetails()) {
      setStep('time-selection');
    }
  };

  const handleCreateEvent = async () => {
    // Validate time slots
    const filledSlots = timeSlots.filter((slot) => slot.start_time);
    
    if (filledSlots.length < 2) {
      alert('Please add at least 2 time slots');
      return;
    }

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
              <div className={`h-2 w-20 sm:w-24 rounded-full transition-all duration-300 ${step === 'event-details' ? 'bg-foreground' : 'bg-foreground/20'}`} />
              <div className={`h-2 w-20 sm:w-24 rounded-full transition-all duration-300 ${step === 'time-selection' ? 'bg-foreground' : 'bg-foreground/20'}`} />
            </div>
            <p className="text-center text-sm sm:text-base text-foreground/70 mt-3 font-medium">
              {step === 'event-details' ? 'Step 1 of 2: Event Details' : 'Step 2 of 2: Choose Times'}
            </p>
          </div>

          {step === 'event-details' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">What are you planning?</h1>
                <p className="text-base sm:text-lg text-foreground/70">Tell us about your event</p>
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

          {step === 'time-selection' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">When works for you?</h1>
                <p className="text-base sm:text-lg text-foreground/70">Add at least 2 time options</p>
              </div>

              {/* Time Slots Display */}
              <Card>
                <div className="mb-4 sm:mb-5">
                  <h2 className="text-lg sm:text-xl font-bold">Time Slots ({timeSlots.length}/10)</h2>
                </div>

                {timeSlots.length === 0 ? (
                  <div className="text-center py-16 sm:py-20 text-foreground/60">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-foreground/5 flex items-center justify-center">
                      <svg className="w-7 h-7 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-base font-medium mb-1 text-foreground/80">No time slots yet</p>
                    <p className="text-sm mb-8 text-foreground/50">Add at least 2 options</p>
                    <Button 
                      onClick={addCustomSlot} 
                      className="min-h-[48px] px-6 rounded-xl"
                    >
                      Add First Time Slot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeSlots.map((slot, index) => (
                      <TimeSlotInput
                        key={slot.id}
                        slot={slot}
                        index={index}
                        isNew={slot.id === newSlotId}
                        onUpdate={updateTimeSlot}
                        onRemove={removeTimeSlot}
                        onPickerOpened={() => setNewSlotId(null)}
                      />
                    ))}

                    {/* Add Another Button */}
                    {timeSlots.length < 10 && (
                      <button
                        onClick={addCustomSlot}
                        className="w-full py-4 rounded-xl border border-dashed border-foreground/20 hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all duration-200 flex items-center justify-center gap-2 text-foreground/60 hover:text-foreground/80 text-sm font-medium touch-manipulation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Another Time Slot
                      </button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 sm:hidden z-50">
        <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {step === 'event-details' ? (
            <Button 
              size="lg" 
              onClick={handleNextStep} 
              className="w-full min-h-[56px] shadow-lg rounded-2xl font-semibold"
            >
              Continue to Time Slots →
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setStep('event-details')}
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
          {step === 'event-details' ? (
            <div className="flex justify-end">
              <Button size="lg" onClick={handleNextStep} className="rounded-2xl px-8">
                Continue to Time Slots →
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 justify-between">
              <Button 
                variant="secondary" 
                onClick={() => setStep('event-details')}
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

