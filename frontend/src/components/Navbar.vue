<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import { useAuthStore } from '@/stores/auth'
import { smoothScrollTo } from '@/composables/useMotion'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const userRole = computed(() => String(auth.user?.Role || '').toLowerCase())

function handleLogout() {
  auth.logout()
  router.push('/home')
}

// Smooth-scroll to a section on the home page. If we're on another route, go to
// /home first, then scroll. Honors prefers-reduced-motion. Navigation only — no
// state/data changes; the /home route and its sections are unchanged.
async function goToSection(id: string) {
  if (route.path !== '/home') {
    await router.push('/home')
    await nextTick()
  }
  smoothScrollTo(document.getElementById(id))
}

function initials() {
  if (!auth.user) return ''
  return `${auth.user.FirstName[0]}${auth.user.LastName[0]}`.toUpperCase()
}

// presentation only: condensed glass header once the page scrolls
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <nav class="navbar" :class="{ scrolled }">
    <RouterLink to="/home" class="brand" aria-label="GymCore — home">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="27" height="27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9v6M6 7v10M18 7v10M21 9v6M8 12h8" stroke="currentColor" stroke-width="2.2"
                stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <span class="brand-text"><span class="brand-gym">GYM</span><span class="brand-core">CORE</span></span>
    </RouterLink>

    <div class="links">
      <RouterLink to="/home">Home</RouterLink>
      <a href="#about" @click.prevent="goToSection('about')">About</a>
      <a href="#programs" @click.prevent="goToSection('programs')">Programs</a>
      <a href="#membership" @click.prevent="goToSection('membership')">Membership</a>
      <a href="#contact" @click.prevent="goToSection('contact')">Contact</a>

      <template v-if="userRole === 'member'">
        <RouterLink to="/bookings">My Schedule</RouterLink>
      </template>

      <template v-if="userRole === 'trainer'">
        <RouterLink to="/trainer/classes">My Classes</RouterLink>
      </template>

      <template v-if="userRole === 'admin'">
        <RouterLink to="/admin">Dashboard</RouterLink>
      </template>
    </div>

    <div class="actions">
      <template v-if="auth.user">
        <RouterLink to="/profile" class="profile-link">
          <Avatar :label="initials()" shape="circle" class="avatar" />
          <span class="username">{{ auth.user.FirstName }}</span>
        </RouterLink>
        <Button label="Logout" icon="pi pi-sign-out" class="gym-btn-primary" size="small" @click="handleLogout" />
      </template>
      <template v-else>
        <RouterLink to="/login" class="login-link">
          <Button label="Login" outlined class="gym-btn-outline" size="small" />
        </RouterLink>
        <RouterLink to="/login" class="join-cta">
          <Button label="Join Now" icon="pi pi-arrow-right" iconPos="right" class="gym-btn-primary" size="small" />
        </RouterLink>
      </template>
    </div>
  </nav>
</template>

<style scoped>
/* Fixed so the bar overlays the hero instead of reserving a solid strip above it.
   At rest (top of page) it's fully transparent — the hero image shows through.
   On scroll it condenses into a dark glass bar (see .scrolled). Presentation only:
   the fixed bar is the same 64px the pages already pad for, so layout is unchanged. */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 64px;
  background: transparent;
  border-bottom: 1px solid transparent;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  transition: var(--gym-transition);
}

/* Scrolled: dark glass — translucent near-black + blur, a subtle hairline and the
   header shadow. ~300ms via --gym-transition; reduced-motion is handled globally
   in base.css (transition-duration is clamped, so the state still flips, sans motion). */
.navbar.scrolled {
  height: 56px;
  background: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: var(--gym-shadow-header);
}

/* Two-tone wordmark: an orange dumbbell glyph + "GYM" (white) / "CORE" (orange).
   Bold, tight, uppercase; scales cleanly from nav size down to mobile. Orange only —
   no red. Reuses the brand tokens (--gym-orange / --gym-text). */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  color: var(--gym-orange);
  transition: var(--gym-transition);
}

.brand-mark svg {
  display: block;
}

.brand-gym {
  color: var(--gym-text);
}

.brand-core {
  color: var(--gym-orange);
}

.brand:hover .brand-mark {
  transform: translateY(-1px);
  filter: drop-shadow(0 2px 8px var(--gym-orange-glow));
}

.links {
  display: flex;
  gap: 2rem;
}

.links a {
  position: relative;
  padding: 0.5rem 0.25rem;
  /* Lifted off the dim --gym-text-muted so the links read clearly over the
     transparent header on the hero image; semibold for extra presence. They
     still brighten to full --gym-text on hover/active (see below). */
  color: rgba(245, 245, 245, 0.82);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: var(--gym-transition);
}

/* center-growing orange underline */
.links a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  transform: translateX(-50%);
  background: var(--gym-orange);
  border-radius: 2px;
  transition: var(--gym-transition);
}

.links a:hover,
.links a.router-link-active {
  color: var(--gym-text);
}

.links a:hover::after,
.links a.router-link-active::after {
  width: 60%;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* nav primary CTA wrapper — keep the RouterLink from adding link underline/spacing
   around the orange-gradient Join Now button (logged-out only). */
.join-cta {
  display: inline-flex;
  text-decoration: none;
}

.profile-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: var(--gym-transition);
}

.profile-link:hover {
  transform: translateY(-1px);
}

.profile-link:hover .username {
  color: var(--gym-text);
}

.profile-link:hover .avatar {
  box-shadow: 0 4px 14px var(--gym-orange-glow);
}

.avatar {
  background: var(--gym-orange) !important;
  color: #000 !important;
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  width: 34px !important;
  height: 34px !important;
  cursor: pointer;
  transition: var(--gym-transition);
}

.username {
  font-size: 0.9rem;
  color: var(--gym-text-muted);
  transition: var(--gym-transition);
}

/* Mobile: a logo + five links + two CTAs can't share one phone row, and this nav has
   no menu collapse. So the logo and actions stay pinned at their natural width while
   the link strip becomes horizontally scrollable — every link stays reachable by
   swiping, nothing clips, and the page never side-scrolls. Presentation only; the logo
   stays a touch larger than before (1.2rem vs the old 1.15rem) and remains centered. */
@media (max-width: 640px) {
  .navbar {
    padding: 0 1rem;
    gap: 0.75rem;
  }

  /* Logo + actions hold their width; the link strip absorbs the squeeze and scrolls. */
  .brand,
  .actions {
    flex-shrink: 0;
  }

  .brand {
    font-size: 1.2rem;
    gap: 0.4rem;
  }

  .brand-mark svg {
    width: 23px;
    height: 23px;
  }

  .links {
    flex: 1 1 auto;
    min-width: 0;
    gap: 1.1rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
  }

  .links::-webkit-scrollbar {
    display: none; /* WebKit/Blink — keep the bar clean */
  }

  .links a {
    font-size: 0.82rem;
    padding: 0.5rem 0.15rem;
    white-space: nowrap;
  }

  /* Login and Join Now both route to /login; collapse to the single primary CTA on
     phones to free row space. The profile name hides too (avatar stays) in the
     logged-in state. Presentation only — markup/links are kept, just hidden < 640px. */
  .login-link,
  .username {
    display: none;
  }
}
</style>
