export const AuthStorage = {
  save(
    token: string,
    name?: string | null,
    email?: string | null,
    avatarUrl?: string | null,
  ) {
    const safeName =
      typeof name === "string" &&
      name.trim().length > 0 &&
      name !== "undefined" &&
      name !== "null"
        ? name
        : "";

    const safeEmail =
      typeof email === "string" &&
      email.trim().length > 0 &&
      email !== "undefined" &&
      email !== "null"
        ? email
        : "";

    const safeAvatarUrl =
      typeof avatarUrl === "string" &&
      avatarUrl.trim().length > 0 &&
      avatarUrl !== "undefined" &&
      avatarUrl !== "null"
        ? avatarUrl
        : "";

    localStorage.setItem("spotly_token", token); // must be localStorage
    localStorage.setItem("spotly_name", safeName);
    localStorage.setItem("spotly_email", safeEmail);
    localStorage.setItem("spotly_avatar_url", safeAvatarUrl);
  },

  getToken(): string | null {
    return localStorage.getItem("spotly_token");
  },

  getName(): string | null {
    const name = localStorage.getItem("spotly_name");
    if (!name || name === "undefined" || name === "null") return null;
    return name.toString();
  },

  getEmail(): string | null {
    const email = localStorage.getItem("spotly_email");
    if (!email || email === "undefined" || email === "null") return null;
    return email;
  },

  getAvatarUrl(): string | null {
    const avatarUrl = localStorage.getItem("spotly_avatar_url");
    if (!avatarUrl || avatarUrl === "undefined" || avatarUrl === "null") {
      return null;
    }
    return avatarUrl;
  },

  setProfile(name?: string | null, email?: string | null, avatarUrl?: string | null) {
    if (typeof name === "string") {
      localStorage.setItem("spotly_name", name);
    }

    if (typeof email === "string") {
      localStorage.setItem("spotly_email", email);
    }

    if (typeof avatarUrl === "string") {
      localStorage.setItem("spotly_avatar_url", avatarUrl);
    }
  },

  clear() {
    localStorage.removeItem("spotly_token");
    localStorage.removeItem("spotly_name");
    localStorage.removeItem("spotly_email");
    localStorage.removeItem("spotly_avatar_url");
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem("spotly_token");
  },
};
