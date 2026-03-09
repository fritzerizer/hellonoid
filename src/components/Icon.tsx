/**
 * FontAwesome Pro 5.15.4 Duotone Icon Component
 * Uses CSS classes instead of React FontAwesome
 * All icons render as duotone (fad) by default
 */

interface IconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  /** Override prefix: 'fad' (duotone, default), 'fas' (solid), 'far' (regular), 'fal' (light), 'fab' (brands) */
  prefix?: 'fad' | 'fas' | 'far' | 'fal' | 'fab';
  /** Spin animation */
  spin?: boolean;
  /** Fixed width */
  fixedWidth?: boolean;
}

// Map FA7 icon names → FA5 names (where they differ)
const nameMap: Record<string, string> = {
  'hand-fist': 'fist-raised',
  'gauge': 'tachometer-alt',
  'pen-to-square': 'edit',
  'shield-halved': 'shield-alt',
  'arrow-up-right-from-square': 'external-link-alt',
  'floppy-disk': 'save',
  'xmark': 'times',
  'magnifying-glass': 'search',
  'circle-info': 'info-circle',
  'triangle-exclamation': 'exclamation-triangle',
  'shirt': 'tshirt',
  'stairs': 'level-up-alt', // closest FA5 equivalent
};

export default function Icon({ 
  name, 
  className = '', 
  style,
  prefix = 'fad', 
  spin = false,
  fixedWidth = false 
}: IconProps) {
  const mappedName = nameMap[name] || name;
  const classes = [
    prefix,
    `fa-${mappedName}`,
    spin ? 'fa-spin' : '',
    fixedWidth ? 'fa-fw' : '',
    className,
  ].filter(Boolean).join(' ');

  return <i className={classes} style={style} />;
}

/**
 * Duotone styling helper
 * Use CSS custom properties to control duotone colors:
 * --fa-primary-color, --fa-secondary-color, --fa-secondary-opacity
 */
export function DuotoneIcon({ 
  name, 
  primaryColor, 
  secondaryColor, 
  secondaryOpacity = 0.4,
  className = '',
  ...props 
}: IconProps & { 
  primaryColor?: string; 
  secondaryColor?: string; 
  secondaryOpacity?: number;
}) {
  return (
    <Icon 
      name={name} 
      className={className}
      style={{
        '--fa-primary-color': primaryColor,
        '--fa-secondary-color': secondaryColor,
        '--fa-secondary-opacity': secondaryOpacity,
      } as React.CSSProperties}
      {...props}
    />
  );
}
