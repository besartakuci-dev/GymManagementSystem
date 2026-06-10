// Presentation-only motion directives: scroll reveals + stat count-ups.
// No app state, no data, no API — removing this file only removes motion.
import type { Directive } from 'vue'

const REVEAL_STAGGER_MS = 80
// .reveal transition is 600ms; strip helper classes shortly after it ends
const REVEAL_CLEANUP_MS = 700

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Smooth-scroll an element into view, honoring prefers-reduced-motion.
 * Re-issues the scroll at 250ms and 550ms so the landing stays accurate even
 * when async content above the target — e.g. the membership grid replacing its
 * "Loading…" placeholder — settles and pushes the target down after the first
 * scroll. The follow-up scrolls are no-ops once the target stops moving.
 */
export function smoothScrollTo(el: Element | null): void {
  if (!el) return
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
  const go = () => el.scrollIntoView({ behavior, block: 'start' })
  go()
  window.setTimeout(go, 250)
  window.setTimeout(go, 550)
}

let revealObserver: IntersectionObserver | null = null

function getRevealObserver(): IntersectionObserver {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        let batchIndex = 0
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          window.setTimeout(() => {
            el.classList.add('reveal-visible')
            window.setTimeout(
              () => el.classList.remove('reveal', 'reveal-visible'),
              REVEAL_CLEANUP_MS,
            )
          }, batchIndex * REVEAL_STAGGER_MS)
          revealObserver?.unobserve(el)
          batchIndex++
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    )
  }
  return revealObserver
}

/** v-reveal — fade + 30px rise when the element scrolls into view, ~80ms sibling stagger. */
export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return
    el.classList.add('reveal')
    getRevealObserver().observe(el)
  },
  unmounted(el) {
    revealObserver?.unobserve(el)
  },
}

const countupCleanups = new WeakMap<HTMLElement, () => void>()

/** v-countup — counts a leading integer in the element's text up from 0 on first view. */
export const vCountup: Directive<HTMLElement> = {
  mounted(el) {
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return
    const match = (el.textContent ?? '').match(/^(\d+)([\s\S]*)$/)
    if (!match?.[1]) return
    const target = parseInt(match[1], 10)
    if (!target) return
    const suffix = match[2] ?? ''
    let timer: number | undefined

    el.textContent = `0${suffix}`
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        const increment = target / 60
        let current = 0
        timer = window.setInterval(() => {
          current += increment
          if (current >= target) {
            current = target
            window.clearInterval(timer)
          }
          el.textContent = `${Math.floor(current)}${suffix}`
        }, 25)
      },
      { rootMargin: '0px 0px -20% 0px' },
    )
    io.observe(el)

    countupCleanups.set(el, () => {
      io.disconnect()
      if (timer !== undefined) window.clearInterval(timer)
    })
  },
  unmounted(el) {
    countupCleanups.get(el)?.()
    countupCleanups.delete(el)
  },
}
