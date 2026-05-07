import { API_BASE, supabase } from "../lib/supabase";

async function parseResponse(response: Response) {
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message ?? "Request failed.");
  }

  return payload.data;
}

export const authApi = {
  async login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(error.message);
    }
  },
  async logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },
  async forgotPassword(email: string) {
    const response = await fetch(`${API_BASE}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        portal: "rm",
      }),
    });

    return parseResponse(response);
  },
  async resetPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw new Error(error.message);
    }

    return { updated: true };
  },
};
