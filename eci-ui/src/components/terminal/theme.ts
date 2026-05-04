export const TermColors = {
  bg: '#0A0E0B',
  panel: '#11160F',
  panelHi: '#161D14',
  border: '#243024',
  borderHi: '#3A4F38',
  text: '#D9E0CF',
  dim: '#7A8771',
  amber: '#E5A848',
  green: '#5FBF5F',
  red: '#E5564B',
  cyan: '#5BC4D6',
}

export function th(cursor?: string): React.CSSProperties {
  return {
    padding: '6px 8px',
    fontWeight: 500,
    fontSize: 10,
    letterSpacing: 1,
    cursor: cursor || 'default',
    userSelect: 'none',
  }
}

export function td(color?: string): React.CSSProperties {
  return {
    padding: '5px 8px',
    color: color || TermColors.text,
    fontVariantNumeric: 'tabular-nums',
  }
}

export function chip(active: boolean): React.CSSProperties {
  return {
    background: active ? TermColors.amber : 'transparent',
    color: active ? TermColors.bg : TermColors.dim,
    border: `1px solid ${active ? TermColors.amber : TermColors.border}`,
    padding: '2px 8px',
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: 'inherit',
    cursor: 'pointer',
  }
}
