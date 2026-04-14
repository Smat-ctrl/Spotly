import Card from "../../../components/ui/Card";

interface ProfileRowProps {
  className?: string;
  spotsSaved: number;
  activeSince: string;
}

export default function ProfileRow({
  className,
  spotsSaved,
  activeSince,
}: ProfileRowProps) {
  const stats = [
    {
      label: "SPOTS SAVED",
      value: spotsSaved,
      elem: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.66669 7.91668C1.6667 6.98935 1.94801 6.08383 2.47346 5.31973C2.99891 4.55563 3.74378 3.96889 4.60969 3.63701C5.4756 3.30513 6.42182 3.24372 7.32336 3.46088C8.22491 3.67805 9.03937 4.16358 9.65919 4.85335C9.70284 4.90002 9.75562 4.93724 9.81425 4.96268C9.87288 4.98812 9.93611 5.00125 10 5.00125C10.0639 5.00125 10.1272 4.98812 10.1858 4.96268C10.2444 4.93724 10.2972 4.90002 10.3409 4.85335C10.9587 4.1591 11.7734 3.66949 12.6764 3.44968C13.5794 3.22988 14.5279 3.2903 15.3957 3.62292C16.2636 3.95553 17.0095 4.54456 17.5343 5.3116C18.0591 6.07864 18.3378 6.98731 18.3334 7.91668C18.3334 9.82501 17.0834 11.25 15.8334 12.5L11.2567 16.9275C11.1014 17.1059 10.91 17.2491 10.6951 17.3478C10.4802 17.4464 10.2467 17.4982 10.0103 17.4997C9.7738 17.5012 9.53973 17.4524 9.32359 17.3565C9.10746 17.2605 8.91421 17.1197 8.75669 16.9433L4.16669 12.5C2.91669 11.25 1.66669 9.83335 1.66669 7.91668Z"
            stroke="#99A1AF"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "ACTIVE SINCE",
      value: activeSince,
      elem: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.66663 1.66666V4.99999"
            stroke="#99A1AF"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.3334 1.66666V4.99999"
            stroke="#99A1AF"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.8333 3.33334H4.16667C3.24619 3.33334 2.5 4.07954 2.5 5.00001V16.6667C2.5 17.5872 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5872 17.5 16.6667V5.00001C17.5 4.07954 16.7538 3.33334 15.8333 3.33334Z"
            stroke="#99A1AF"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.5 8.33334H17.5"
            stroke="#99A1AF"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className={`mx-auto flex h-full w-full gap-8 pt-10 ${className || ""}`}>
      {stats.map((item) => (
        <Card
          key={item.label}
          className="h-[152px] w-[182px] flex-1 rounded-xl border-3 font-arial"
        >
          <div className="mb-2 flex items-center justify-center">{item.elem}</div>
          <div className="pt-3 text-center text-lg font-bold">{item.value}</div>
          <div className="pt-2 text-center text-xs font-semibold tracking-wide text-gray-500">
            {item.label}
          </div>
        </Card>
      ))}
    </div>
  );
}
