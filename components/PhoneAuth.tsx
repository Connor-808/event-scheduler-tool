'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendPhoneOTP, verifyPhoneOTP } from '@/lib/auth';

interface PhoneAuthProps {
  onSuccess?: () => void;
  mode?: 'login' | 'signup';
}

export function PhoneAuth({ onSuccess, mode = 'login' }: PhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
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

    const result = await sendPhoneOTP(phoneNumber.replace(/\D/g, ''));

    if (!result.success) {
      setError(result.error || 'Failed to send code');
      setIsSendingCode(false);
      return;
    }

    setCodeSent(true);
    setIsSendingCode(false);
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    const result = await verifyPhoneOTP(
      phoneNumber.replace(/\D/g, ''),
      verificationCode
    );

    if (!result.success) {
      setError(result.error || 'Invalid code');
      setIsVerifying(false);
      return;
    }

    // Success! Call the onSuccess callback
    if (onSuccess) {
      onSuccess();
    }
    setIsVerifying(false);
  };

  const handleResendCode = async () => {
    setVerificationCode('');
    setCodeSent(false);
    setError('');
    await handleSendCode();
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-foreground/70">
          {mode === 'login' 
            ? 'Access your organizer dashboard' 
            : 'Manage all your events in one place'}
        </p>
      </div>

      {!codeSent ? (
        <div className="space-y-4">
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
            size="lg"
            onClick={handleSendCode}
            isLoading={isSendingCode}
            disabled={!validatePhoneNumber(phoneNumber)}
            className="w-full"
          >
            Send Verification Code
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
            <p className="text-sm text-foreground/80">
              Code sent to <span className="font-semibold">{phoneNumber}</span>
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

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={handleVerifyCode}
              isLoading={isVerifying}
              disabled={verificationCode.length !== 6}
              className="w-full"
            >
              Verify & {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
            <Button
              size="md"
              variant="secondary"
              onClick={handleResendCode}
              disabled={isVerifying || isSendingCode}
              className="w-full"
            >
              Resend Code
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

