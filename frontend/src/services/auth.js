import { supabase } from './supabase';

export async function signUp(email, password, profileData = {}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: profileData.full_name || '',
        username: profileData.username || '',
        date_of_birth: profileData.date_of_birth || '',
        phone: profileData.phone || '',
        business_name: profileData.business_name || '',
        bank_account_last4: profileData.bank_account_last4 || '',
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signIn(email, password) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function getSession() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to get session:', error);
    return null;
  }

  return data.session;
}

export function onAuthStateChange(callback) {
  if (!supabase) {
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  }

  return supabase.auth.onAuthStateChange(callback);
}

export async function updateProfile(profileData = {}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: profileData.full_name || '',
      username: profileData.username || '',
      phone: profileData.phone || '',
      date_of_birth: profileData.date_of_birth || '',
      business_name: profileData.business_name || '',
      bank_account_last4:
        profileData.bank_account_last4 || '',
    },
  });

  if (error) {
    throw error;
  }

  return data;
}