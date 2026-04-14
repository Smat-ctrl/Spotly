import { NavLink, useLocation } from "react-router-dom";
import { AuthStorage } from "../../userData/AuthStorage";

export default function SideBar() {
  const location = useLocation();
  const profilePath = AuthStorage.isLoggedIn() ? "/profile" : "/login";

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `w-10 h-10 rounded-xl flex items-center justify-center transition text-black ${
      isActive ? "bg-[#FF2056]" : "bg-gray-300 hover:bg-[#FF2056]"
    }`;

  const isProfileRoute =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/profile";

  const profileClasses = () =>
    `w-10 h-10 rounded-xl flex items-center justify-center transition text-black ${
      isProfileRoute ? "bg-[#FF2056]" : "bg-gray-300 hover:bg-[#FF2056]"
    }`;

  return (
    <aside className="fixed left-0 top-0 w-[80px] h-screen bg-white border-r">
      <div className="h-full flex flex-col items-center pt-5">
        {/* Logo */}
        <div className="flex-col mb-2">
          <NavLink
            to="/discover"
            className="flex items-center gap-1"
            aria-label="Spotly Home"
          >
            <div className="mx-2 w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 21L16.66 16.66"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </NavLink>
          <p className="text-sm text-gray-600 mx-2">Spotly</p>
        </div>

        {/* Main nav icons */}
        <div className="mt-8 mx-5 flex flex-col items-center gap-6">
          {/* Search (Discover) */}
          <NavLink to="/discover" className={linkClasses} aria-label="Search">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.25 19.25L15.2717 15.2717"
                stroke="currentColor"
                strokeWidth="1.83333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.0833 17.4167C14.1334 17.4167 17.4167 14.1334 17.4167 10.0833C17.4167 6.03325 14.1334 2.75 10.0833 2.75C6.03325 2.75 2.75 6.03325 2.75 10.0833C2.75 14.1334 6.03325 17.4167 10.0833 17.4167Z"
                stroke="currentColor"
                strokeWidth="1.83333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </NavLink>
          {/* Map
          <NavLink to="" className={normalLinkClasses} aria-label="Map">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.9305 5.09025C13.185 5.21741 13.4655 5.28361 13.75 5.28361C14.0345 5.28361 14.315 5.21741 14.5695 5.09025L17.9236 3.41275C18.0634 3.34287 18.2189 3.30991 18.375 3.31703C18.5312 3.32414 18.683 3.37108 18.8159 3.45339C18.9488 3.5357 19.0585 3.65064 19.1345 3.78729C19.2105 3.92393 19.2502 4.07774 19.25 4.23409V15.9344C19.2499 16.1046 19.2024 16.2714 19.1129 16.4162C19.0234 16.5609 18.8953 16.6778 18.7431 16.7539L14.5695 18.8412C14.315 18.9683 14.0345 19.0345 13.75 19.0345C13.4655 19.0345 13.185 18.9683 12.9305 18.8412L9.0695 16.9107C8.81503 16.7835 8.53447 16.7173 8.25 16.7173C7.96553 16.7173 7.68497 16.7835 7.4305 16.9107L4.07642 18.5882C3.93649 18.6581 3.781 18.691 3.62473 18.6839C3.46847 18.6767 3.31664 18.6297 3.18369 18.5473C3.05074 18.4649 2.94109 18.3498 2.86518 18.213C2.78926 18.0763 2.74961 17.9223 2.75 17.7659V6.0665C2.75009 5.89631 2.79756 5.72951 2.88709 5.58477C2.97662 5.44003 3.10467 5.32308 3.25692 5.247L7.4305 3.15975C7.68497 3.0326 7.96553 2.9664 8.25 2.9664C8.53447 2.9664 8.81503 3.0326 9.0695 3.15975L12.9305 5.09025Z"
                stroke="currentColor"
                strokeWidth="1.83333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.75 5.28366V19.0337"
                stroke="currentColor"
                strokeWidth="1.83333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.25 2.96634V16.7163"
                stroke="currentColor"
                strokeWidth="1.83333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </NavLink> */}

          {/* Collections */}
          <NavLink to="/saved" className={linkClasses} aria-label="Collections">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.4167 19.25L11 15.5833L4.58333 19.25V4.58333C4.58333 4.0971 4.77649 3.63079 5.1203 3.28697C5.46412 2.94315 5.93044 2.75 6.41667 2.75H15.5833C16.0696 2.75 16.5359 2.94315 16.8797 3.28697C17.2235 3.63079 17.4167 4.0971 17.4167 4.58333V19.25Z"
                stroke="currentColor"
                strokeWidth="1.83333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </NavLink>

          {/* Randomize */}
          <NavLink to="/random" className={linkClasses} aria-label="Randomize">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 11.6667L18.3333 15L15 18.3334"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 1.66669L18.3333 5.00002L15 8.33335"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1.66667 15H3.31083C3.84958 15.0037 4.38118 14.8767 4.86012 14.63C5.33906 14.3833 5.75106 14.0241 6.06083 13.5833L10.6058 6.41668C10.9156 5.97589 11.3276 5.61675 11.8065 5.37002C12.2855 5.1233 12.8171 4.99634 13.3558 5.00002H18.3333"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1.66667 5.00002H3.31C3.93122 4.9957 4.54128 5.16506 5.07136 5.489C5.60145 5.81294 6.03046 6.27857 6.31 6.83335"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.3333 15H13.2992C12.753 14.9944 12.2165 14.8547 11.737 14.5932C11.2575 14.3316 10.8496 13.9562 10.5492 13.5L10.25 13.125"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </NavLink>

          {/* Featured
          <NavLink to="" className={normalLinkClasses} aria-label="Featured">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.18083 2.345C9.21654 2.15384 9.31798 1.98118 9.46758 1.85693C9.61718 1.73269 9.80553 1.66467 10 1.66467C10.1945 1.66467 10.3828 1.73269 10.5324 1.85693C10.682 1.98118 10.7835 2.15384 10.8192 2.345L11.695 6.97667C11.7572 7.30596 11.9172 7.60885 12.1542 7.84581C12.3912 8.08277 12.694 8.2428 13.0233 8.305L17.655 9.18084C17.8462 9.21654 18.0188 9.31798 18.1431 9.46758C18.2673 9.61719 18.3353 9.80553 18.3353 10C18.3353 10.1945 18.2673 10.3828 18.1431 10.5324C18.0188 10.682 17.8462 10.7835 17.655 10.8192L13.0233 11.695C12.694 11.7572 12.3912 11.9172 12.1542 12.1542C11.9172 12.3912 11.7572 12.694 11.695 13.0233L10.8192 17.655C10.7835 17.8462 10.682 18.0188 10.5324 18.1431C10.3828 18.2673 10.1945 18.3353 10 18.3353C9.80553 18.3353 9.61718 18.2673 9.46758 18.1431C9.31798 18.0188 9.21654 17.8462 9.18083 17.655L8.305 13.0233C8.2428 12.694 8.08277 12.3912 7.84581 12.1542C7.60885 11.9172 7.30596 11.7572 6.97667 11.695L2.345 10.8192C2.15384 10.7835 1.98118 10.682 1.85693 10.5324C1.73268 10.3828 1.66467 10.1945 1.66467 10C1.66467 9.80553 1.73268 9.61719 1.85693 9.46758C1.98118 9.31798 2.15384 9.21654 2.345 9.18084L6.97667 8.305C7.30596 8.2428 7.60885 8.08277 7.84581 7.84581C8.08277 7.60885 8.2428 7.30596 8.305 6.97667L9.18083 2.345Z"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.6667 1.66669V5.00002"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.3333 3.33331H15"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.33333 18.3333C4.25381 18.3333 5 17.5871 5 16.6667C5 15.7462 4.25381 15 3.33333 15C2.41286 15 1.66667 15.7462 1.66667 16.6667C1.66667 17.5871 2.41286 18.3333 3.33333 18.3333Z"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </NavLink> */}
        </div>

        {/* Bottom icons */}
        <div className="mt-auto pb-6 flex flex-col items-center gap-6">
          {/* Profile */}
          <NavLink
            to={profilePath}
            className={profileClasses()}
            aria-label="Profile"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.4167 19.25V17.4167C17.4167 16.4442 17.0304 15.5116 16.3427 14.8239C15.6551 14.1363 14.7225 13.75 13.75 13.75H8.25C7.27754 13.75 6.34491 14.1363 5.65727 14.8239C4.96964 15.5116 4.58333 16.4442 4.58333 17.4167V19.25"
                stroke="currentColor"
                strokeWidth="1.83333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 10.0833C13.025 10.0833 14.6667 8.44171 14.6667 6.41667C14.6667 4.39162 13.025 2.75 11 2.75C8.97495 2.75 7.33333 4.39162 7.33333 6.41667C7.33333 8.44171 8.97495 10.0833 11 10.0833Z"
                stroke="currentColor"
                strokeWidth="1.83333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
