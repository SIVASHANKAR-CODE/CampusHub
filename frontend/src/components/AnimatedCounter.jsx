import { useCountUp } from '../utils/useScrollReveal';

/**
 * Reusable animated numerical counter component with layout-shift prevention
 * and automatic viewport replay.
 */
export default function AnimatedCounter({
  value,
  start = 0,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  style = {},
  replay = true,
}) {
  const [count, ref] = useCountUp({
    end: Number(value),
    start,
    duration,
    decimals,
    replay,
  });

  const formatted = decimals > 0
    ? count.toFixed(decimals)
    : Math.round(count).toLocaleString();

  return (
    <span
      ref={ref}
      className={`animated-counter ${className}`}
      style={{
        fontVariantNumeric: 'tabular-nums',
        display: 'inline-block',
        ...style,
      }}
      aria-label={`${prefix}${value}${suffix}`}
    >
      {prefix}{formatted}{suffix}
    </span>
  );
}
