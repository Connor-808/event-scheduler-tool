import { supabase } from './supabase';

/**
 * Auth utilities for Supabase Phone Authentication
 * Used for organizer accounts only - voters remain anonymous with cookies
 */

export interface AuthUser {
  id: string;
  phone: string;
  created_at: string;
}

/**
 * Send OTP to phone number for login/signup
 */
export async function sendPhoneOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Format phone number to E.164 format (+1XXXXXXXXXX)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('1')) {
      formattedPhone = '1' + formattedPhone;
    }
    formattedPhone = '+' + formattedPhone;

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel: 'sms',
      },
    });

    if (error) {
      console.error('Error sending OTP:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error sending OTP:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
}

/**
 * Verify OTP and complete login/signup
 */
export async function verifyPhoneOTP(
  phoneNumber: string,
  token: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    // Format phone number to E.164 format
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('1')) {
      formattedPhone = '1' + formattedPhone;
    }
    formattedPhone = '+' + formattedPhone;

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'No user returned after verification' };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        phone: data.user.phone || formattedPhone,
        created_at: data.user.created_at,
      },
    };
  } catch (error) {
    console.error('Unexpected error verifying OTP:', error);
    return { success: false, error: 'Failed to verify code' };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      phone: user.phone || '',
      created_at: user.created_at,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error signing out:', error);
    return { success: false, error: 'Failed to sign out' };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        phone: session.user.phone || '',
        created_at: session.user.created_at,
      });
    } else {
      callback(null);
    }
  });
}

