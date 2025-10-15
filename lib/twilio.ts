/**
 * Twilio SMS Integration
 * Centralized Twilio client and SMS utilities
 */

import twilio from 'twilio';

let twilioClient: ReturnType<typeof twilio> | null = null;

/**
 * Get singleton Twilio client instance
 * Initializes once and reuses across requests
 */
export function getTwilioClient() {
  if (!twilioClient) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
}

/**
 * Send SMS via Twilio with error handling
 * @param to - Phone number in E.164 format (e.g., "+15551234567")
 * @param body - Message body text
 * @returns Result object with success flag and optional error
 */
export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: true; messageSid: string } | { success: false; error: string }> {
  try {
    const client = getTwilioClient();
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('Twilio SMS error:', error);
    return { success: false, error: String(error) };
  }
}
