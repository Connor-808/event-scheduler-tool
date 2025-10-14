'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { LocationPicker } from '@/components/ui/location-picker';
import {
  getThisWeekendTimes,
  getNextWeekendTimes,
  getWeekdayEveningTimes,
  getWeekendWarriorTimes,
  getCoffeeCatchupTimes,
  getLazySundayTimes,
  getUnemployedFriendTimes,
  getChillEveningsTimes,
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
  const [step, setStep] = useState<Step>('event-details');
  const [isLoading, setIsLoading] = useState(false);

  // Time Selection State
  const [presetType, setPresetType] = useState<'this-weekend' | 'next-weekend' | 'weekday' | 'weekend-warrior' | 'coffee-catchup' | 'lazy-sunday' | 'unemployed-friend' | 'chill-evenings' | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlotInput[]>([]);

  // Event Details State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePresetSelect = (type: 'this-weekend' | 'next-weekend' | 'weekday' | 'weekend-warrior' | 'coffee-catchup' | 'lazy-sunday' | 'unemployed-friend' | 'chill-evenings') => {
    setPresetType(type);
    
    // Get preset times and convert to TimeSlotInput format
    const presetMap = {
      'this-weekend': getThisWeekendTimes,
      'next-weekend': getNextWeekendTimes,
      'weekday': getWeekdayEveningTimes,
      'weekend-warrior': getWeekendWarriorTimes,
      'coffee-catchup': getCoffeeCatchupTimes,
      'lazy-sunday': getLazySundayTimes,
      'unemployed-friend': getUnemployedFriendTimes,
      'chill-evenings': getChillEveningsTimes,
    };
    const presetTimes = presetMap[type]();
    
    // Convert to datetime-local format for inputs
    const slots: TimeSlotInput[] = presetTimes.map((slot, index) => ({
      id: `preset-${index}-${Date.now()}`,
      start_time: new Date(slot.start_time).toISOString().slice(0, 16), // datetime-local format
      label: slot.label,
    }));
    
    setTimeSlots(slots);
  };

  const addCustomSlot = () => {
    if (timeSlots.length < 10) {
      setTimeSlots([
        ...timeSlots,
        { id: Date.now().toString(), start_time: '', label: '' },
      ]);
      // Clear preset selection when adding custom slots
      setPresetType(null);
    }
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter((slot) => slot.id !== id));
    // If we remove all slots, clear the preset selection
    if (timeSlots.length === 1) {
      setPresetType(null);
    }
  };

  const updateTimeSlot = (id: string, field: 'start_time' | 'label', value: string) => {
    setTimeSlots(
      timeSlots.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot))
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (including HEIC/HEIF for iPhone)
      const validTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/heic',
        'image/heif'
      ];
      
      const isValidType = file.type.startsWith('image/') || 
                         file.name.toLowerCase().endsWith('.heic') ||
                         file.name.toLowerCase().endsWith('.heif');
      
      if (!isValidType) {
        setErrors({ ...errors, image: 'Please select an image file' });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: 'Image must be less than 5MB' });
        return;
      }

      setHeroImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      const newErrors = { ...errors };
      delete newErrors.image;
      setErrors(newErrors);
    }
  };

  const removeImage = () => {
    setHeroImage(null);
    setHeroImagePreview('');
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

  const validateTimeSelection = (): boolean => {
    const filledSlots = timeSlots.filter((slot) => slot.start_time);
    
    if (filledSlots.length < 2) {
      alert('Please select a preset or add at least 2 time slots');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateEventDetails()) {
      setStep('time-selection');
    }
  };

  const handleCreateEvent = async () => {
    // Validate time slots
    if (!validateTimeSelection()) {
      return;
    }

    setIsLoading(true);

    try {
      let heroImageUrl = null;

      // Upload image if present
      if (heroImage) {
        const formData = new FormData();
        formData.append('image', heroImage);

        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          heroImageUrl = uploadData.url;
        } else {
          console.error('Failed to upload image');
          // Continue without image - it's optional
        }
      }

      // Prepare time slots - filter out empty ones and convert to proper format
      const timeSlotsForSubmission = timeSlots
        .filter((slot) => slot.start_time)
        .map((slot) => ({
          start_time: new Date(slot.start_time),
          label: slot.label || '',
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
          heroImageUrl,
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

                  <LocationPicker
                    label="Location"
                    placeholder="Where should we meet?"
                    value={location}
                    onChange={(value) => setLocation(value)}
                    error={errors.location}
                    maxLength={200}
                    helperText="Optional"
                  />

                  {/* Hero Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-foreground">
                      Event Image <span className="text-foreground/60 font-normal">(Optional)</span>
                    </label>
                    
                    {!heroImagePreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-foreground/20 rounded-lg cursor-pointer hover:border-foreground/40 hover:bg-foreground/5 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-10 h-10 mb-3 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mb-2 text-sm text-foreground/70">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-foreground/60">PNG, JPG, HEIC, GIF up to 5MB</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*,.heic,.heif"
                          onChange={handleImageUpload}
                        />
                      </label>
                    ) : (
                      <div className="relative">
                        <img 
                          src={heroImagePreview} 
                          alt="Event preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-2 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                          aria-label="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {errors.image && (
                      <p className="mt-2 text-sm font-medium text-red-600">{errors.image}</p>
                    )}
                  </div>

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
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">When should we meet?</h1>
                <p className="text-base sm:text-lg text-foreground/70">Select times for friends to vote on</p>
              </div>

              {/* Quick Presets - Compact horizontal layout */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">Quick Start</h2>
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                  {/* Popular presets */}
                  <button
                    onClick={() => handlePresetSelect('weekend-warrior')}
                    className={`relative flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] bg-white ${
                      presetType === 'weekend-warrior'
                        ? 'border-foreground shadow-sm'
                        : 'border-foreground/30 hover:border-foreground/50 hover:shadow-sm'
                    }`}
                  >
                    <div className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                      Popular
                    </div>
                    <div className="text-sm font-bold mb-0.5">Weekend Warrior</div>
                    <div className="text-xs text-foreground/60">Fri & Sat 8pm</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('chill-evenings')}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] bg-white ${
                      presetType === 'chill-evenings'
                        ? 'border-foreground shadow-sm'
                        : 'border-foreground/20 hover:border-foreground/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-sm font-bold mb-0.5">Chill Evenings</div>
                    <div className="text-xs text-foreground/60">Tue, Wed, Thu</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('this-weekend')}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] bg-white ${
                      presetType === 'this-weekend'
                        ? 'border-foreground shadow-sm'
                        : 'border-foreground/20 hover:border-foreground/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-sm font-bold mb-0.5">This Weekend</div>
                    <div className="text-xs text-foreground/60">Sat & Sun</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('next-weekend')}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] bg-white ${
                      presetType === 'next-weekend'
                        ? 'border-foreground shadow-sm'
                        : 'border-foreground/20 hover:border-foreground/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-sm font-bold mb-0.5">Next Weekend</div>
                    <div className="text-xs text-foreground/60">Next Sat & Sun</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('coffee-catchup')}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] bg-white ${
                      presetType === 'coffee-catchup'
                        ? 'border-foreground shadow-sm'
                        : 'border-foreground/20 hover:border-foreground/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-sm font-bold mb-0.5">Coffee & Catchup</div>
                    <div className="text-xs text-foreground/60">Weekday mornings</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('lazy-sunday')}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] bg-white ${
                      presetType === 'lazy-sunday'
                        ? 'border-foreground shadow-sm'
                        : 'border-foreground/20 hover:border-foreground/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-sm font-bold mb-0.5">Lazy Sunday</div>
                    <div className="text-xs text-foreground/60">Brunch & chill</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('unemployed-friend')}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] bg-white ${
                      presetType === 'unemployed-friend'
                        ? 'border-foreground shadow-sm'
                        : 'border-foreground/20 hover:border-foreground/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-sm font-bold mb-0.5">Unemployed Friend</div>
                    <div className="text-xs text-foreground/60">Weekday midday</div>
                  </button>

                  <button
                    onClick={() => handlePresetSelect('weekday')}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] bg-white ${
                      presetType === 'weekday'
                        ? 'border-foreground shadow-sm'
                        : 'border-foreground/20 hover:border-foreground/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-sm font-bold mb-0.5">Weekday Evenings</div>
                    <div className="text-xs text-foreground/60">Mon-Fri 7pm</div>
                  </button>
                </div>
              </div>

              {/* Time Slots Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">Your Schedule</h2>
                  <span className="text-sm text-foreground/60">{timeSlots.length}/10 slots</span>
                </div>

                {timeSlots.length === 0 ? (
                  <Card className="border-dashed">
                    <div className="text-center py-10 text-foreground/60">
                      <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="font-medium mb-1">No time slots yet</p>
                      <p className="text-sm">Choose a quick start option or add a custom slot below</p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {timeSlots.map((slot, index) => (
                      <div key={slot.id} className="group relative">
                        <div className="flex gap-2 items-start p-3 rounded-lg border border-foreground/10 bg-background hover:border-foreground/20 transition-all">
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Date/Time input with calendar icon */}
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none z-10">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <input
                                type="datetime-local"
                                value={slot.start_time}
                                onChange={(e) => updateTimeSlot(slot.id, 'start_time', e.target.value)}
                                className="flex h-[48px] w-full rounded-lg border-2 border-foreground/20 bg-background pl-11 pr-4 py-2.5 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground hover:border-foreground/30 transition-colors duration-200 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                              />
                            </div>
                            
                            {/* Label input with text icon */}
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                              </div>
                              <input
                                type="text"
                                value={slot.label}
                                onChange={(e) => updateTimeSlot(slot.id, 'label', e.target.value)}
                                placeholder="Add a label (optional)"
                                className="flex h-[48px] w-full rounded-lg border-2 border-foreground/20 bg-background pl-11 pr-4 py-2.5 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground hover:border-foreground/30 transition-colors duration-200"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeTimeSlot(slot.id)}
                            className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                            aria-label="Remove time slot"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add slot button - desktop only, mobile has fixed bottom button */}
                    {timeSlots.length < 10 && (
                      <button
                        onClick={addCustomSlot}
                        className="hidden sm:flex w-full items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-foreground/20 text-foreground/60 hover:border-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm font-medium">Add another time slot</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 sm:hidden z-50">
        <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {step === 'event-details' ? (
            <Button size="lg" onClick={handleNextStep} className="w-full min-h-[52px] shadow-lg">
              Next: Choose Times →
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Add Time Slot button - always show if under limit */}
              {timeSlots.length < 10 && (
                <Button 
                  variant="secondary" 
                  onClick={addCustomSlot} 
                  className="w-full min-h-[52px]"
                >
                  + Add Time Slot ({timeSlots.length}/10)
                </Button>
              )}
              
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setStep('event-details')}
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
            </div>
          )}
        </div>
      </div>

      {/* Desktop buttons - hidden on mobile */}
      <div className="hidden sm:block px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {step === 'event-details' ? (
            <div className="flex justify-end">
              <Button size="lg" onClick={handleNextStep}>
                Next: Choose Times
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 justify-between">
              <Button variant="secondary" onClick={() => setStep('event-details')}>
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

