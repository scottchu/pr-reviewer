import { createElement } from "react";
import { icons } from "./design-system/icons";
import extra from "./design-system/player-icons.json";
// Geometry follows the design system's pinned Lucide revision; see its provenance.
export function Icon({ name, className = "" }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{(icons[name] ?? extra[name]).map((node, index) => createElement(node.tag, { ...Object.fromEntries(Object.entries(node.attributes).map(([key, value]) => [key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value])), key: index }))}</svg>;
}
export function IconButton({ icon, label, className = "", children, ...props }) {
  return <button {...props} className={`icon-button ${className}`} aria-label={label} title={label}><Icon name={icon} />{children}</button>;
}
