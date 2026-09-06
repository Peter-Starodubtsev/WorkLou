"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ReactNode, ButtonHTMLAttributes } from "react";
export function Asset({
  name,
  size = 18,
  width,
}: {
  name: string;
  size?: number;
  width?: number;
}) {
  const leaf =
    name === "toggle-off"
      ? [84, 68]
      : name === "check"
        ? [12, 9.5]
        : ["did", "did-not"].includes(name)
          ? [8, 8]
          : [width || size, size];
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        width: width || size,
        height: size,
        flexShrink: 0,
      }}
    >
      <img
        src={`/figma-claude/${name}.svg`}
        alt=""
        width={leaf[0]}
        height={leaf[1]}
        style={{
          width: leaf[0],
          height: leaf[1],
          maxWidth: "none",
          objectFit: "contain",
          ...(name === "toggle-off"
            ? { position: "absolute" as const, left: -24, top: -16 }
            : {}),
        }}
      />
    </span>
  );
}
type ActionIconName =
  "plus" | "edit" | "chat" | "calendar" | "shield" | "file" | "print";
const actionIconPaths: Record<ActionIconName, string> = {
  plus: "M8 2v12M2 8h12",
  edit: "m10.5 2.5 3 3M2 14l3.5-.7L14 4.8 11.2 2 2.7 10.5 2 14Z",
  chat: "M3 2.5h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7l-4 3v-3H3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1ZM5 6h6M5 8.5h4",
  calendar: "M2 4h12v10H2V4ZM5 2v4M11 2v4M2 7h12M5 10h1M10 10h1",
  shield: "M8 1.5 14 4v4c0 3-3 5.5-6 6.5C5 13.5 2 11 2 8V4l6-2.5ZM5 8l2 2 4-4",
  file: "M9 2H3v12h10V6L9 2ZM9 2v4h4M5 9h6M5 11.5h4",
  print: "M4 5V2h8v3M4 11H2V6h12v5h-2M4 9h8v5H4V9Z",
};
export function ActionIcon({ name }: { name: ActionIconName }) {
  return (
    <svg
      className="demo-action-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={actionIconPaths[name]} />
    </svg>
  );
}
export function Button({
  tone = "",
  icon,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: string;
  icon?: ActionIconName;
}) {
  return (
    <button
      type="button"
      {...props}
      className={`a2s-matte a2s-btn demo-button ${tone} ${icon ? "demo-with-icon" : ""} ${className}`}
    >
      {icon && <ActionIcon name={icon} />}
      {icon ? <span>{children}</span> : children}
    </button>
  );
}
export function TextButton({
  icon,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ActionIconName }) {
  return (
    <button
      type="button"
      {...props}
      className={`demo-link ${icon ? "demo-with-icon" : ""} ${props.className || ""}`}
    >
      {icon && <ActionIcon name={icon} />}
      {icon ? <span>{children}</span> : children}
    </button>
  );
}
export function Heading({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <header className="a2s-head demo-heading">
      <div>
        <h1>{title}</h1>
        {sub && <p className="a2s-sub">{sub}</p>}
      </div>
      {children}
    </header>
  );
}
export function QueueRow({
  title,
  detail,
  meta,
  href,
  tone = "",
  onClick,
}: {
  title: string;
  detail?: string;
  meta?: string;
  href?: string;
  tone?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <Asset name="ring" />
      <span className="demo-row-text">
        <b>{title}</b>
        {detail && <small>{detail}</small>}
      </span>
      <span className={`demo-meta ${tone}`}>{meta}</span>
    </>
  );
  return (
    <li>
      {href ? (
        <Link className="demo-row" href={href}>
          {body}
        </Link>
      ) : (
        <button className="demo-row" onClick={onClick}>
          {body}
        </button>
      )}
    </li>
  );
}
export function Rail({
  title,
  detail,
  meta,
  onClick,
}: {
  title: string;
  detail?: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button className="demo-rail" onClick={onClick}>
      <span>
        <b>{title}</b>
        <span>{meta}</span>
      </span>
      {detail && <small>{detail}</small>}
    </button>
  );
}
export function Dialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const d = ref.current;
    d?.showModal();
    return () => {
      d?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`demo-dialog ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            closeRef.current();
        }
      }}
      aria-label={title}
    >
      <header>
        <h2>{title}</h2>
        <TextButton aria-label="Close dialog" onClick={onClose}>
          Close
        </TextButton>
      </header>
      {children}
    </dialog>
  );
}
