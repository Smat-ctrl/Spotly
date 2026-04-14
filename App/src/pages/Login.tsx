import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { AuthStorage } from "../userData/AuthStorage";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: any = null;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        setErrorMessage(
          data?.error || `Request failed with status ${res.status}`,
        );
        return;
      }

      AuthStorage.save(
        data.token,
        data.user?.name ?? null,
        data.user?.email ?? email,
        data.user?.avatarUrl ?? null,
      );

      navigate("/profile", { replace: true });
    } catch (err: any) {
      console.error("Login request failed:", err);
      setErrorMessage(
        "Could not connect to the server. Make sure backend is running on the correct port.",
      );
    }
  }

  return (
    <MainLayout>
      <div className="w-full flex items-center justify-center py-16">
        <div className="w-full max-w-[520px] flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-sm">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M20 21a8 8 0 1 0-16 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-5xl font-medium tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Sign in to access your saved city memories.
          </p>

          <div className="mt-10 w-full rounded-3xl border border-gray-200 bg-white px-10 py-10 shadow-sm">
            <form onSubmit={onSubmit} className="text-left">
              <label className="block text-[11px] font-semibold tracking-widest text-gray-500">
                EMAIL ADDRESS
              </label>

              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-400"
                >
                  <path
                    d="M4 6h16v12H4V6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m4 7 8 6 8-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="alex@example.com"
                  className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                  autoComplete="email"
                />
              </div>

              <label className="mt-6 block text-[11px] font-semibold tracking-widest text-gray-500">
                PASSWORD
              </label>

              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-400"
                >
                  <path
                    d="M7 11V8a5 5 0 0 1 10 0v3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 11h12v9H6v-9Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="mt-8 w-full rounded-2xl bg-black py-4 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] transition hover:opacity-90"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  Sign In
                  <span aria-hidden>{"->"}</span>
                </span>
              </button>

              <p className="mt-6 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  onClick={() => AuthStorage.clear()}
                  className="font-medium text-gray-900 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>

          <div className="mt-4 min-h-[20px] text-center">
            {errorMessage && (
              <p className="text-xs text-red-500">{errorMessage}</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
