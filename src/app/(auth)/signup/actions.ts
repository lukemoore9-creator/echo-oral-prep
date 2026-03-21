'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface SignupState {
  error?: string;
  success?: string;
  errors?: {
    fullName?: string;
    email?: string;
    password?: string;
  };
}

export async function signup(
  _prevState: SignupState | undefined,
  formData: FormData
): Promise<SignupState> {
  const supabase = await createClient();

  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate fields
  const errors: SignupState['errors'] = {};

  if (!fullName || fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (!email) {
    errors.email = 'Email is required.';
  }

  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      'Account created! Check your email for a confirmation link to complete sign-up.',
  };
}

export async function signupWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback`,
    },
  });

  if (error) {
    redirect('/signup?error=Could+not+authenticate+with+Google');
  }

  if (data.url) {
    redirect(data.url);
  }
}
