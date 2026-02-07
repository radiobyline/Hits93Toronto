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
