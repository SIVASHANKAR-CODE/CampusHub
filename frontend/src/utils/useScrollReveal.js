import { useEffect, useRef, useState } from 'react';

/**
 * Scroll-reveal hook using IntersectionObserver.
 *
 * Options:
 *   animation  — CSS class specifying animation type (default: 'reveal-fade-up')
 *   delay      — ms delay before animation triggers (default: 0)
 *   threshold  — IntersectionObserver threshold (default: 0.1)
 *   rootMargin — observer root margin (default: '0px 0px -30px 0px')
 *   once       — if true, animation plays only once (default: false — replays on re-entry)
 *   onIntersect— optional callback when intersection status changes: (isIntersecting) => void
 */
export default function useScrollReveal({
  animation = 'reveal-fade-up',
  delay = 0,
  threshold = 0.1,
  rootMargin = '0px 0px -30px 0px',
  once = false,
  onIntersect = null,
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Graceful fallback for older browsers lacking IntersectionObserver
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      el.classList.add('scroll-reveal-visible');
      if (onIntersect) onIntersect(true);
      return;
    }

    // Immediately establish the animation class so the initial transform is in place
    if (animation) {
      el.classList.add(animation);
    }

    // Respect user's motion preferences
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.classList.add('scroll-reveal-visible');
      el.style.transitionDelay = '0ms';
      if (onIntersect) onIntersect(true);
      return;
    }

    let timeoutId = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }

            if (delay > 0) {
              timeoutId = setTimeout(() => {
                el.classList.add('scroll-reveal-visible');
                if (onIntersect) onIntersect(true);
              }, delay);
            } else {
              el.classList.add('scroll-reveal-visible');
              if (onIntersect) onIntersect(true);
            }

            if (once) {
              observer.unobserve(el);
            }
          } else {
            // Replay animation on re-entry if once is false
            if (!once) {
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
              el.classList.remove('scroll-reveal-visible');
              if (onIntersect) onIntersect(false);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [animation, delay, threshold, rootMargin, once, onIntersect]);

  return ref;
}

/**
 * Hook for staggered reveals on grouped child elements.
 * Attach to a container, and all children with `.scroll-reveal-child`
 * will animate sequentially with increasing delays.
 *
 * Supports dynamic children (MutationObserver) and replays reliably on repeated visits.
 */
export function useStaggerReveal({
  animation = 'reveal-fade-up',
  staggerMs = 70,
  threshold = 0.08,
  rootMargin = '0px 0px -20px 0px',
  once = false,
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // Fallback if IntersectionObserver is not supported
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      const children = container.querySelectorAll('.scroll-reveal-child');
      children.forEach((child) => child.classList.add('scroll-reveal-visible'));
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      const children = container.querySelectorAll('.scroll-reveal-child');
      children.forEach((child) => {
        child.classList.add('scroll-reveal-visible');
        child.style.transitionDelay = '0ms';
      });
      return;
    }

    let timeoutIds = [];
    let isCurrentlyIntersecting = false;

    const setupChildren = () => {
      const children = container.querySelectorAll('.scroll-reveal-child');
      children.forEach((child) => {
        if (animation && !child.classList.contains(animation)) {
          child.classList.add(animation);
        }
      });
      return children;
    };

    const triggerStagger = () => {
      timeoutIds.forEach(clearTimeout);
      timeoutIds = [];

      const children = setupChildren();
      children.forEach((child, i) => {
        const id = setTimeout(() => {
          child.classList.add('scroll-reveal-visible');
        }, i * staggerMs);
        timeoutIds.push(id);
      });
    };

    const resetChildren = () => {
      timeoutIds.forEach(clearTimeout);
      timeoutIds = [];

      const children = container.querySelectorAll('.scroll-reveal-child');
      children.forEach((child) => {
        child.classList.remove('scroll-reveal-visible');
      });
    };

    setupChildren();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isCurrentlyIntersecting = true;
            triggerStagger();

            if (once) {
              observer.unobserve(container);
            }
          } else {
            isCurrentlyIntersecting = false;
            if (!once) {
              resetChildren();
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(container);

    // Watch for dynamically added children (e.g. after React Query loads)
    const mutationObserver = new MutationObserver(() => {
      setupChildren();
      if (isCurrentlyIntersecting) {
        const unrevealed = container.querySelectorAll('.scroll-reveal-child:not(.scroll-reveal-visible)');
        unrevealed.forEach((child, i) => {
          const id = setTimeout(() => {
            child.classList.add('scroll-reveal-visible');
          }, i * staggerMs);
          timeoutIds.push(id);
        });
      }
    });

    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      timeoutIds.forEach(clearTimeout);
    };
  }, [animation, staggerMs, threshold, rootMargin, once]);

  return ref;
}

/**
 * Hook to animate numeric values when scrolled into viewport.
 * Resets and replays automatically when scrolled out and back into viewport.
 */
export function useCountUp({
  end = 0,
  start = 0,
  duration = 1400,
  decimals = 0,
  threshold = 0.1,
  rootMargin = '0px 0px -30px 0px',
  replay = true,
} = {}) {
  const [count, setCount] = useState(start);
  const ref = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setCount(end);
      return;
    }

    const startCountAnimation = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const startTime = performance.now();
      const target = Number(end);
      const initial = Number(start);
      const diff = target - initial;

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic curve: fast start, soft stop
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentVal = initial + diff * ease;

        setCount(Number(currentVal.toFixed(decimals)));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setCount(target);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    };

    const resetCount = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setCount(start);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startCountAnimation();
          } else if (replay) {
            resetCount();
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, start, duration, decimals, threshold, rootMargin, replay]);

  return [count, ref];
}
