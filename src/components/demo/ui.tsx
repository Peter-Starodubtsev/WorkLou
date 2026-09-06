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
export function Button({
  tone = "",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: string }) {
  return (
    <button
      type="button"
      {...props}
      className={`a2s-matte a2s-btn demo-button ${tone} ${className}`}
    />
  );
}
export function TextButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`demo-link ${props.className || ""}`}
    />
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
