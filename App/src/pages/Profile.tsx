import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import ProfileRow from "../features/profile/components/ProfileRow";
import { fetchProfile, updateProfile } from "../features/profile/api";
import type { Profile as ProfileData } from "../features/profile/types";
import { AuthStorage } from "../userData/AuthStorage";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);

  const locationLabel = useMemo(() => {
    const saved = localStorage.getItem("spotly_location");

    if (!saved) {
      return "No location selected";
    }

    try {
      const parsed = JSON.parse(saved) as { label?: string };
      return parsed.label || "No location selected";
    } catch {
      return "No location selected";
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");
        const nextProfile = await fetchProfile();

        if (!cancelled) {
          setProfile(nextProfile);
          setFullName(
            nextProfile.full_name ||
              nextProfile.email.split("@")[0] ||
              "User",
          );
          setAvatarUrl(nextProfile.avatar_url || "");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const email = profile?.email || AuthStorage.getEmail() || "No email available";
  const name =
    fullName ||
    profile?.full_name ||
    AuthStorage.getName() ||
    (email.includes("@") ? email.split("@")[0] : null) ||
    "User";
  const imageSource =
    avatarUrl ||
    profile?.avatar_url ||
    AuthStorage.getAvatarUrl() ||
    "https://placehold.co/182x152/png?text=Profile";
  const activeSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear().toString()
    : "Unknown";

  function onLogout() {
    AuthStorage.clear();
    navigate("/login", { replace: true });
  }

  async function onSaveProfile() {
    try {
      setSaveBusy(true);
      setError("");
      const updatedProfile = await updateProfile({
        fullName,
        avatarUrl,
      });

      setProfile((current) =>
        current
          ? { ...current, ...updatedProfile, spots_saved: current.spots_saved }
          : { ...updatedProfile, spots_saved: 0 },
      );
      AuthStorage.setProfile(
        updatedProfile.full_name || "",
        updatedProfile.email,
        updatedProfile.avatar_url || "",
      );
      setIsEditing(false);
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : "Could not update profile.",
      );
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="mt-10 flex items-start gap-8">
          <div className="relative">
            <Card className="border-none p-0 shadow-none">
              <img
                src={imageSource}
                alt="Profile Image"
                className="h-[152px] w-[182px] rounded-2xl object-cover"
              />
            </Card>
          </div>

          <div className="flex flex-col">
            <p className="text-3xl font-arial font-semibold leading-tight">
              {name}
            </p>

            <div className="mt-2 flex items-center gap-2 text-gray-500">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.3334 6.66666C13.3334 9.99533 9.64069 13.462 8.40069 14.5327C8.28517 14.6195 8.14455 14.6665 8.00002 14.6665C7.85549 14.6665 7.71487 14.6195 7.59935 14.5327C6.35935 13.462 2.66669 9.99533 2.66669 6.66666C2.66669 5.25217 3.22859 3.89562 4.22878 2.89543C5.22898 1.89523 6.58553 1.33333 8.00002 1.33333C9.41451 1.33333 10.7711 1.89523 11.7713 2.89543C12.7715 3.89562 13.3334 5.25217 13.3334 6.66666Z"
                  stroke="#6A7282"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 8.66667C9.10457 8.66667 10 7.77124 10 6.66667C10 5.5621 9.10457 4.66667 8 4.66667C6.89543 4.66667 6 5.5621 6 6.66667C6 7.77124 6.89543 8.66667 8 8.66667Z"
                  stroke="#6A7282"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm">{locationLabel}</p>
            </div>

            <div className="mt-2 text-sm text-gray-400">{email}</div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing((current) => !current)}
                className="h-[42px] w-[117.2px] rounded-lg bg-black text-sm text-white"
              >
                {isEditing ? "Close Edit" : "Edit Profile"}
              </button>

              <button
                onClick={onLogout}
                className="h-[42px] rounded-lg border border-gray-200 px-4 text-sm text-gray-700 hover:bg-gray-50"
              >
                Log out
              </button>
            </div>
          </div>
        </div>

        {isEditing && (
          <Card className="mt-8 max-w-3xl rounded-3xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
            <div className="mt-6 grid gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Username
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Profile Image URL
                </label>
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <button
                type="button"
                onClick={onSaveProfile}
                disabled={saveBusy}
                className="w-fit rounded-2xl bg-[#FF2056] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saveBusy ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Card>
        )}

        {loading && <p className="mt-8 text-sm text-gray-500">Loading profile...</p>}

        {error && (
          <p className="mt-8 max-w-2xl rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-12 flex justify-center">
          <ProfileRow
            className="max-w-3xl"
            spotsSaved={profile?.spots_saved || 0}
            activeSince={activeSince}
          />
        </div>

        <div className="mt-14 flex justify-center">
          <Card className="w-full max-w-3xl rounded-3xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900">
              Personal Preferences
            </h3>

            <div className="mt-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Notifications
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Get alerts for new spots in your area
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-emerald-500"></div>
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
              </label>
            </div>

            <div className="mt-6 border-t border-gray-100" />

            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Public Profile
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Allow others to see your collections
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-emerald-500"></div>
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
              </label>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
