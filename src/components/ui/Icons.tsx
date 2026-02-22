import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

interface IconBaseProps extends IconProps {
  children: ReactNode;
}

function IconBase({ children, title, ...props }: IconBaseProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function PlayIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M8 5.5v13l10-6.5z" fill="currentColor" />
    </IconBase>
  );
}

export function PauseIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <rect x="7" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="13" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </IconBase>
  );
}

export function VolumeIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M4 10h4l5-4v12l-5-4H4zM16 9a4.5 4.5 0 010 6M18 6a8 8 0 010 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function MuteIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M4 10h4l5-4v12l-5-4H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 9l5 6M21 9l-5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function ThumbUpIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M10 11V5.8c0-.9.7-1.8 1.6-1.8.5 0 .9.2 1.2.5l.2.2c.2.2.3.6.3.9v3.4h4.5c1.1 0 2 .9 2 2l-1.2 7c-.2 1-1 1.7-2 1.7H8c-.9 0-1.7-.8-1.7-1.7V11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <rect x="3" y="10.5" width="4" height="9" rx="1" fill="currentColor" />
    </IconBase>
  );
}

export function ThumbDownIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M10 13v5.2c0 .9.7 1.8 1.6 1.8.5 0 .9-.2 1.2-.5l.2-.2c.2-.2.3-.6.3-.9V15h4.5c1.1 0 2-.9 2-2l-1.2-7c-.2-1-1-1.7-2-1.7H8C7.1 4.3 6.3 5 6.3 6V13z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <rect x="3" y="4.5" width="4" height="9" rx="1" fill="currentColor" />
    </IconBase>
  );
}

export function SunIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2L5.6 5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function MoonIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M15.6 3.2A8.8 8.8 0 1019 18.6 9.2 9.2 0 0115.6 3.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function RequestIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M4 6.5h16M4 12h11M4 17.5h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="19" cy="17.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function CloseIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function XBrandIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M6 5h3.4l3.1 4.4L16.4 5H19l-5.2 6.1L19.5 19h-3.3l-3.6-5-4.3 5H5.7l5.8-6.8z" fill="currentColor" />
    </IconBase>
  );
}

export function InstagramIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.7" cy="7.3" r="1.2" fill="currentColor" />
    </IconBase>
  );
}

export function FacebookIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M13.5 8.5V6.9c0-.8.5-1.3 1.4-1.3h2V3h-2.4c-2.6 0-4.1 1.5-4.1 4.2v1.3H8v2.9h2.4V21h3.1v-9.6H16l.4-2.9z"
        fill="currentColor"
      />
    </IconBase>
  );
}

export function YouTubeIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M20.6 8.5a2.8 2.8 0 00-2-2c-1.7-.5-6.6-.5-6.6-.5s-4.9 0-6.6.5a2.8 2.8 0 00-2 2C3 10.3 3 12 3 12s0 1.7.4 3.5a2.8 2.8 0 002 2c1.7.5 6.6.5 6.6.5s4.9 0 6.6-.5a2.8 2.8 0 002-2c.4-1.8.4-3.5.4-3.5s0-1.7-.4-3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10.4 9.3l5.1 2.7-5.1 2.7z" fill="currentColor" />
    </IconBase>
  );
}

export function LinkedInIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="7.2" y="10.1" width="2.3" height="6.7" rx="0.6" fill="currentColor" />
      <circle cx="8.4" cy="7.7" r="1.3" fill="currentColor" />
      <path d="M11.2 10.1h2.2v1c.4-.7 1.3-1.2 2.5-1.2 2 0 2.9 1.2 2.9 3.4v3.5h-2.3V13.7c0-1-.4-1.6-1.3-1.6s-1.7.7-1.7 2v2.7h-2.3z" fill="currentColor" />
    </IconBase>
  );
}

export function SpotifyIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M6.4 9.3c3.3-1 7-0.6 10 .9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M7.3 12.4c2.5-.7 5.2-.4 7.5.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M8.1 15.2c1.8-.4 3.7-.2 5.3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function AppleMusicIcon(props: IconProps): JSX.Element {
  return (
    <IconBase {...props}>
      <path
        d="M14 6.2v8.7a2.9 2.9 0 11-1.6-2.6V8.4l6.2-1.3v6.3a2.9 2.9 0 11-1.6-2.6V5.1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.6" cy="16.3" r="1.1" fill="currentColor" />
      <circle cx="15.8" cy="14.9" r="1.1" fill="currentColor" />
    </IconBase>
  );
}
