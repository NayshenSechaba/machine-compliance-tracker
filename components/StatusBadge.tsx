const STYLES: Record<string, string> = {
  ok: "bg-signal-goBg text-signal-go",
  upcoming: "bg-signal-goBg text-signal-go",
  warning: "bg-signal-warnBg text-signal-warn",
  critical: "bg-signal-warnBg text-signal-warn",
  expired: "bg-signal-stopBg text-signal-stop",
  cleared: "bg-signal-goBg text-signal-go",
  blocked: "bg-signal-stopBg text-signal-stop",
  in_service: "bg-fogDark text-steel",
};

const LABELS: Record<string, string> = {
  ok: "OK",
  upcoming: "Due soon",
  warning: "Renew now",
  critical: "Urgent",
  expired: "Expired",
  cleared: "Cleared",
  blocked: "Blocked",
  in_service: "In service",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-semibold tracking-wide uppercase ${
        STYLES[status] ?? "bg-fogDark text-steel"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
