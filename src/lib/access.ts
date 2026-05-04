export const TRAINER_EMAILS = ['lukemoore9@icloud.com', 'tdracos98@gmail.com'];

export function isTrainer(email?: string | null): boolean {
  if (!email) return false;
  return TRAINER_EMAILS.includes(email.toLowerCase());
}
