export const CALENDLY_CONSULTATION_URL = 'https://calendly.com/nomaan-forever/20min';

/**
 * Opens the official LEGOMARK INDIA Calendly consultation booking flow
 * in a new browser tab with security flags.
 */
export function openConsultationBooking(_serviceOrTopic?: string): void {
  try {
    window.open(CALENDLY_CONSULTATION_URL, '_blank', 'noopener,noreferrer');
  } catch (e) {
    window.location.href = CALENDLY_CONSULTATION_URL;
  }
}
