'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PhoneVerificationProps {
  eventId: string;
  cookieId: string;
  onVerified?: () => void;
}

export function PhoneVerification({ eventId, cookieId, onVerified }: PhoneVerificationProps) {
  const [wantsNotifications, setWantsNotifications] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // Format phone number as user types: (555) 123-4567
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    
    if (!match) return value;
    
    let formatted = '';
    if (match[1]) {
      formatted = match[1].length === 3 ? `(${match[1]})` : match[1];
    }
    if (match[2]) {
      formatted += ` ${match[2]}`;
    }
    if (match[3]) {
      formatted += `-${match[3]}`;
    }
    
    return formatted;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
    setError('');
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const handleSendCode = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSendingCode(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${eventId}/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          cookieId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      setCodeSent(true);
    } catch (err) {
      console.error('Error sending code:', err);
      setError(err instanceof Error ? err.message : 'Failed to send code. Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${eventId}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          cookieId,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      setIsVerified(true);
      if (onVerified) {
        onVerified();
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setVerificationCode('');
    setCodeSent(false);
    setError('');
    await handleSendCode();
  };

  if (isVerified) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/10 border-2 border-green-600/30 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm sm:text-base font-semibold text-green-800 dark:text-green-400">
              ✓ You&apos;ll get a text when this is finalized
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Checkbox to opt-in */}
      {!wantsNotifications && (
        <button
          onClick={() => setWantsNotifications(true)}
          className="flex items-center gap-3 w-full p-4 rounded-xl border-2 border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5 transition-all text-left touch-manipulation"
        >
          <div className="flex-shrink-0 w-6 h-6 rounded border-2 border-foreground/40" />
          <div className="flex-1">
            <p className="text-sm sm:text-base font-medium">
              Get notified by text when plan is locked in
            </p>
          </div>
        </button>
      )}

      {/* Phone input and verification flow */}
      {wantsNotifications && !isVerified && (
        <div className="p-4 sm:p-5 border-2 border-blue-600/30 bg-blue-600/5 rounded-xl space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm sm:text-base font-semibold">Get notified by text</p>
          </div>

          {!codeSent ? (
            <div className="space-y-3">
              <Input
                type="tel"
                label="Phone Number"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                error={error}
                maxLength={14}
                disabled={isSendingCode}
              />
              <Button
                size="md"
                onClick={handleSendCode}
                isLoading={isSendingCode}
                disabled={!validatePhoneNumber(phoneNumber)}
                className="w-full"
              >
                Send Code
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-background/60 rounded-lg">
                <p className="text-sm text-foreground/70 mb-2">
                  Code sent to {phoneNumber}
                </p>
              </div>

              <Input
                type="text"
                label="Enter 6-digit code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setError('');
                }}
                error={error}
                maxLength={6}
                disabled={isVerifying}
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="md"
                  onClick={handleVerifyCode}
                  isLoading={isVerifying}
                  disabled={verificationCode.length !== 6}
                  className="flex-1"
                >
                  Verify
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={handleResendCode}
                  disabled={isVerifying || isSendingCode}
                  className="flex-1"
                >
                  Resend Code
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

