<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { getPlans, subscribe } from '@/api/plans'
import { vReveal, vCountup, smoothScrollTo } from '@/composables/useMotion'
import PaymentModal from '@/components/PaymentModal.vue'
import fitnesImg   from '@/assets/fitnes.png'
import pilatesImg  from '@/assets/pilates.png'
import yogaImg     from '@/assets/yoga.png'
import crossfitImg from '@/assets/crossfit.png'
// Hero background — a dark, moody barbell shot. Swap this one import (or drop a
// replacement at the same path) to change the hero photo; nothing else depends on it.
import heroBg      from '@/assets/Login_Register_Cover.png'
// "Who we are" section photo. Swap this one import to change it.
import aboutImg    from '@/assets/coaches.png'

const auth = useAuthStore()
const toast = useToast()

const plans = ref<any[]>([])
const plansLoading = ref(true)

// Static payment modal: whether it's open, the plan the user clicked, and a
// cosmetic "processing" flag. The card form lives in <PaymentModal> and is never
// read here — confirming runs GymCore's existing mock checkout unchanged.
const paymentVisible = ref(false)
const selectedPlan = ref<any>(null)
const paying = ref(false)

// presentation only: highlight the cheapest plan that includes classes
const popularPlanId = computed(() => plans.value.find((p) => p.IncludesClasses)?.PlanID ?? null)

onMounted(async () => {
  try {
    const { data } = await getPlans()
    plans.value = data.data.plans ?? []
  } catch {
    plans.value = []
  } finally {
    plansLoading.value = false
  }
  if (auth.user) auth.refreshMembership()
})

// A plan CTA now opens the cosmetic payment modal instead of subscribing on the
// spot. Same guard as before — only a signed-in non-member can start a checkout.
function openPayment(plan: any) {
  if (!auth.user || auth.hasMembership) return
  selectedPlan.value = plan
  paymentVisible.value = true
}

// "Pay" in the modal: no card data is validated or sent. After a brief cosmetic
// pause we run GymCore's existing mock checkout (subscribe) so the membership
// still activates — the only thing new here is the modal wrapping it.
async function confirmPayment() {
  const plan = selectedPlan.value
  if (!plan || paying.value) return
  paying.value = true
  // Cosmetic "processing" pause — there is no real gateway; no card data leaves
  // the browser.
  await new Promise((resolve) => setTimeout(resolve, 900))
  try {
    await subscribe(plan.PlanID)
    await auth.refreshMembership()
    toast.add({
      severity: 'success',
      summary: 'Payment successful',
      detail: `You're now on the ${plan.PlanName} plan. You can join classes!`,
      life: 4000,
    })
    paymentVisible.value = false
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Could not activate membership',
      detail: e.response?.data?.message ?? 'Something went wrong',
      life: 4000,
    })
  } finally {
    paying.value = false
  }
}

// presentation only: smooth-scroll the hero's "Explore" cue to the stats bar.
function scrollToNext() {
  smoothScrollTo(document.querySelector('.stats-bar'))
}

// Stats bar — GymCore's real figures (mirrors the About page's stats), number +
// orange "+" suffix split so the suffix can render smaller. Counts up on scroll.
const stats = [
  { value: 500, suffix: '+', label: 'Active Members' },
  { value: 30,  suffix: '+', label: 'Weekly Classes' },
  { value: 3,   suffix: '',  label: 'Expert Trainers' },
  { value: 5,   suffix: '+', label: 'Years Running' },
]

// "Who we are" mission pillars (reused/rebranded from the About page values).
const pillars = [
  { icon: 'pi pi-bolt',     title: 'Performance First', desc: 'Every programme is built around measurable, real-world results.' },
  { icon: 'pi pi-users',    title: 'Community',         desc: 'We train together, push each other, and celebrate every milestone.' },
  { icon: 'pi pi-verified', title: 'Expert Coaching',   desc: 'Certified trainers with years of hands-on experience in your corner.' },
]

const classes = [
  {
    image: fitnesImg,
    title: 'Fitness',
    slug: 'fitness',
    level: 'All levels',
    duration: '60 min',
    desc: 'Full-body strength and conditioning sessions designed to build muscle, burn fat, and boost overall performance.',
  },
  {
    image: pilatesImg,
    title: 'Pilates',
    slug: 'pilates',
    level: 'Beginner – Intermediate',
    duration: '50 min',
    desc: 'Low-impact core-focused training that improves posture, flexibility, and body awareness.',
  },
  {
    image: yogaImg,
    title: 'Yoga',
    slug: 'yoga',
    level: 'All levels',
    duration: '60 min',
    desc: 'Breathwork, balance, and mindful movement to increase flexibility and reduce stress.',
  },
  {
    image: crossfitImg,
    title: 'CrossFit',
    slug: 'crossfit',
    level: 'Intermediate – Advanced',
    duration: '45 min',
    desc: 'High-intensity functional movements combining weightlifting, cardio, and gymnastics.',
  },
]

// OUR PROGRAMS — presentation-only, client-side filterable list. No API, no
// routing, no data-layer: `activeProgramFilter` is the only new state and clicking
// a pill just narrows the local `programs` array below. Categories drive both the
// filter pills and each card's bottom tag.
const programCategories = [
  { key: 'all',         label: 'All' },
  { key: 'strength',    label: 'Strength' },
  { key: 'cardio',      label: 'Cardio' },
  { key: 'flexibility', label: 'Flexibility' },
  { key: 'wellness',    label: 'Wellness' },
] as const

// Made-up but fitting GymCore programmes, two per category so every filter lands
// on a populated grid. `icon` is a primeicons glyph; `category` keys the filter,
// `tag` is its uppercase-rendered label on the card.
const programs = [
  { title: 'Strength Training',  icon: 'pi pi-bolt',       category: 'strength',    tag: 'Strength',    desc: 'Progressive barbell and compound lifts to build raw power and dense, functional muscle.' },
  { title: 'Bodybuilding',       icon: 'pi pi-trophy',     category: 'strength',    tag: 'Strength',    desc: 'Hypertrophy-focused splits and accessory work to sculpt symmetry, size, and definition.' },
  { title: 'HIIT',               icon: 'pi pi-stopwatch',  category: 'cardio',      tag: 'Cardio',      desc: 'Short, intense interval rounds that torch calories and push your conditioning to its limit.' },
  { title: 'Boxing Fitness',     icon: 'pi pi-wave-pulse', category: 'cardio',      tag: 'Cardio',      desc: 'Pad work, footwork, and sharp combinations for an explosive, full-body cardio burn.' },
  { title: 'Yoga & Flow',        icon: 'pi pi-sun',        category: 'flexibility', tag: 'Flexibility', desc: 'Breath-led sequences that build balance, calm, and long-range flexibility.' },
  { title: 'Mobility & Stretch', icon: 'pi pi-sync',       category: 'flexibility', tag: 'Flexibility', desc: 'Targeted joint mobility and deep stretching to move better and recover faster.' },
  { title: 'Nutrition Coaching', icon: 'pi pi-apple',      category: 'wellness',    tag: 'Wellness',    desc: 'One-to-one guidance and tailored meal strategies to fuel training and steady fat loss.' },
  { title: 'Recovery & Wellness',icon: 'pi pi-heart',      category: 'wellness',    tag: 'Wellness',    desc: 'Guided recovery, mobility, and mindset work to keep you training consistently and pain-free.' },
]

const activeProgramFilter = ref<string>('all')
const filteredPrograms = computed(() =>
  activeProgramFilter.value === 'all'
    ? programs
    : programs.filter((p) => p.category === activeProgramFilter.value),
)
</script>

<template>
  <main>

    <!-- Hero -->
    <section class="hero" :style="{ '--hero-image': `url(${heroBg})` }">
      <div class="hero-overlay" aria-hidden="true" />
      <div class="hero-content">
        <span class="hero-badge">Kosovo's Premier Fitness Destination</span>
        <h1>TRAIN HARDER.<br />LIVE <span class="text-stroke">STRONGER.</span></h1>
        <p class="hero-sub">GymCore — where results happen. Join a community built around performance, discipline, and progress.</p>
        <template v-if="auth.user">
          <p class="welcome">Welcome back, <strong>{{ auth.user.FirstName }}</strong>. Ready for today's session?</p>
        </template>
        <div class="hero-actions">
          <RouterLink v-if="!auth.user" to="/login" class="hero-cta">
            <Button label="Join Now" icon="pi pi-arrow-right" iconPos="right" size="large" class="gym-btn-primary" />
          </RouterLink>
          <Button label="Explore" icon="pi pi-chevron-down" iconPos="right" size="large" outlined class="gym-btn-outline" @click="scrollToNext" />
        </div>
      </div>
      <div class="scroll-cue" aria-hidden="true" />
    </section>

    <!-- Stats bar -->
    <section class="stats-bar">
      <div class="stats-inner">
        <div v-for="s in stats" :key="s.label" class="stat" v-reveal>
          <div class="stat-value">
            <span class="stat-number" v-countup>{{ s.value }}</span><span v-if="s.suffix" class="stat-suffix">{{ s.suffix }}</span>
          </div>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </div>
    </section>

    <!-- Who we are -->
    <section id="about" class="who">
      <div class="section-header" v-reveal>
        <span class="eyebrow">Our Story</span>
        <h2>WHO WE <span class="accent">ARE</span></h2>
        <p>More than a gym — a community built on discipline, progress, and the people who show up every day.</p>
      </div>

      <div class="who-body">
        <div class="who-text" v-reveal>
          <h3 class="who-subhead">Our Mission &amp; Philosophy</h3>
          <p>GymCore was founded on one belief: a great gym is more than its equipment — it's the coaches, the culture, and the community that make people come back every day.</p>
          <p>We build our programmes around discipline, consistency, and progress. Whether you're stepping into a gym for the first time or training for your next competition, we meet you where you are and help you get where you want to be.</p>

          <div class="pillars">
            <div v-for="p in pillars" :key="p.title" class="pillar" v-reveal>
              <div class="pillar-icon"><i :class="p.icon" /></div>
              <div class="pillar-copy">
                <h4>{{ p.title }}</h4>
                <p>{{ p.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="who-media" v-reveal>
          <img :src="aboutImg" alt="GymCore coaches in the gym" class="who-img" />
          <div class="who-badge" aria-hidden="true">
            <span class="who-badge-number">5+</span>
            <span class="who-badge-text">Years Strong</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Our programs — filterable, presentation-only program cards -->
    <section id="programs" class="programs">
      <div class="programs-inner">
        <div class="section-header" v-reveal>
          <span class="eyebrow">What We Offer</span>
          <h2>OUR <span class="accent">PROGRAMS</span></h2>
          <p>Diverse training for every goal — find your discipline.</p>
        </div>

        <div class="program-filters" v-reveal role="group" aria-label="Filter programs by category">
          <button
            v-for="cat in programCategories"
            :key="cat.key"
            type="button"
            class="filter-btn"
            :class="{ active: activeProgramFilter === cat.key }"
            :aria-pressed="activeProgramFilter === cat.key"
            @click="activeProgramFilter = cat.key"
          >
            {{ cat.label }}
          </button>
        </div>

        <div class="programs-grid-wrap" v-reveal>
          <TransitionGroup name="program" tag="div" class="programs-grid">
            <article v-for="p in filteredPrograms" :key="p.title" class="program-card">
              <span class="program-card-glow" aria-hidden="true" />
              <div class="program-icon"><i :class="p.icon" /></div>
              <h3>{{ p.title }}</h3>
              <p>{{ p.desc }}</p>
              <span class="program-tag">{{ p.tag }}</span>
            </article>
          </TransitionGroup>
        </div>
      </div>
    </section>

    <!-- Membership plans -->
    <section id="membership" class="memberships">
      <div class="section-header" v-reveal>
        <h2>Membership Plans</h2>
        <p>Choose a plan to unlock the gym and start joining classes.</p>
      </div>

      <p v-if="auth.user && auth.hasMembership" class="membership-banner" v-reveal>
        <i class="pi pi-check-circle" />
        You have an active membership<span v-if="auth.membership?.PlanName"> — <strong>{{ auth.membership.PlanName }}</strong></span>. You're all set to join classes.
      </p>

      <p v-if="plansLoading" class="status">Loading plans...</p>
      <p v-else-if="!plans.length" class="status">No membership plans available right now.</p>

      <div v-else class="plans-grid">
        <Card
          v-for="plan in plans"
          :key="plan.PlanID"
          class="plan-card"
          :class="{
            active: auth.hasMembership && auth.membership?.PlanID === plan.PlanID,
            popular: plan.PlanID === popularPlanId,
          }"
          v-reveal
        >
          <template #content>
            <span v-if="plan.PlanID === popularPlanId" class="ribbon">Most Popular</span>
            <h3>{{ plan.PlanName }}</h3>
            <div class="price">
              <span class="amount">€{{ Number(plan.Price).toFixed(0) }}</span>
              <span class="period">/ {{ plan.DurationMonths }} {{ plan.DurationMonths === 1 ? 'month' : 'months' }}</span>
            </div>
            <p class="plan-desc">{{ plan.Description }}</p>
            <p class="includes">
              <i :class="plan.IncludesClasses ? 'pi pi-check' : 'pi pi-times'" />
              {{ plan.IncludesClasses ? 'Includes group classes' : 'Gym access only' }}
            </p>

            <RouterLink v-if="!auth.user" to="/login">
              <Button label="Sign in to join" outlined fluid />
            </RouterLink>
            <Button
              v-else-if="auth.hasMembership"
              :label="auth.membership?.PlanID === plan.PlanID ? 'Current plan' : 'Already a member'"
              icon="pi pi-check"
              disabled
              fluid
            />
            <Button
              v-else
              label="Get this plan"
              @click="openPayment(plan)"
              fluid
            />
          </template>
        </Card>
      </div>
    </section>

    <!-- Classes -->
    <section class="classes">
      <div class="section-header" v-reveal>
        <h2>Our Classes</h2>
        <p>Find the right class for your goals and fitness level.</p>
      </div>
      <div class="classes-grid">
        <RouterLink v-for="c in classes" :key="c.title" :to="`/classes/${c.slug}`" class="class-link" v-reveal>
          <Card class="class-card">
            <template #header>
              <img :src="c.image" :alt="c.title" class="class-img" />
            </template>
            <template #content>
              <div class="card-body">
                <h3>{{ c.title }}</h3>
                <div class="meta">
                  <span><i class="pi pi-bolt" /> {{ c.level }}</span>
                  <span><i class="pi pi-clock" /> {{ c.duration }}</span>
                </div>
                <p>{{ c.desc }}</p>
              </div>
            </template>
          </Card>
        </RouterLink>
      </div>
    </section>

    <!-- Contact -->
    <section id="contact" class="contact">
      <div class="section-header" v-reveal>
        <span class="eyebrow">Contact</span>
        <h2>GET IN <span class="accent">TOUCH</span></h2>
        <p>Questions about membership, classes, or visiting? Reach out — we're happy to help.</p>
      </div>
      <div class="contact-cards">
        <div class="contact-card" v-reveal>
          <div class="contact-icon"><i class="pi pi-map-marker" /></div>
          <div class="contact-copy">
            <h4>Visit</h4>
            <span>Prishtina, Kosovo</span>
          </div>
        </div>
        <a class="contact-card" href="mailto:info@bbrosgym.com" v-reveal>
          <div class="contact-icon"><i class="pi pi-envelope" /></div>
          <div class="contact-copy">
            <h4>Email</h4>
            <span>info@bbrosgym.com</span>
          </div>
        </a>
        <a class="contact-card" href="tel:+38344000000" v-reveal>
          <div class="contact-icon"><i class="pi pi-phone" /></div>
          <div class="contact-copy">
            <h4>Call</h4>
            <span>+383 44 000 000</span>
          </div>
        </a>
      </div>
    </section>

    <!-- Static, cosmetic payment modal — opens when a plan CTA is clicked. -->
    <PaymentModal
      v-model:visible="paymentVisible"
      :plan="selectedPlan"
      :loading="paying"
      @confirm="confirmPayment"
    />

  </main>
</template>

<style scoped>
main {
  background: var(--gym-bg);
}

/* Hero — full-bleed dark gym photo under a diagonal black overlay */
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-height: min(100vh, 760px);
  padding: 6rem clamp(1.5rem, 6vw, 6rem) 4rem;
  overflow: hidden;
  background-color: var(--gym-bg);
  background-image: var(--hero-image);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

/* dark diagonal gradient overlay — keeps the headline legible over the photo
   (color-neutral black; darkest top-left, under the text). Looks good on its
   own as a fallback if the image is ever missing. */
.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(10, 10, 10, 0.6) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

/* content sits above the overlay */
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  max-width: 720px;
  text-align: left;
}

.hero-badge {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: var(--gym-orange);
  padding: 6px 16px;
  border: 1px solid var(--gym-orange-border);
  border-radius: 30px;
  animation: fadeInUp 1s ease both;
}

.hero h1 {
  font-size: clamp(3rem, 7vw, 5.5rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: 0.01em;
  color: var(--gym-text);
  animation: fadeInUp 1s ease 0.2s both;
}

/* hollow-outline accent word: 2px orange stroke over a barely-there orange body.
   The faint fill (vs. fully transparent) keeps the word legible over bright
   patches of the photo and, crucially, on the image-missing #000 fallback,
   where a transparent interior would otherwise render black-on-black. */
.hero h1 .text-stroke {
  -webkit-text-stroke: 2px var(--gym-orange);
  color: rgba(249, 115, 22, 0.1);
}

/* solid-orange accent word (kept available for a second highlighted word) */
.hero h1 .accent {
  color: var(--gym-orange);
}

.hero p {
  max-width: 540px;
  color: var(--gym-text-muted);
  font-size: 1.05rem;
  line-height: 1.6;
}

.hero-sub {
  animation: fadeInUp 1s ease 0.4s both;
}

.welcome {
  color: var(--gym-text) !important;
  font-size: 1rem !important;
  animation: fadeInUp 1s ease 0.6s both;
}

.welcome strong {
  color: var(--gym-orange);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
  animation: fadeInUp 1s ease 0.6s both;
}

.hero-cta {
  text-decoration: none;
}

/* orange scroll cue at the hero's bottom (gentle pulse; the global
   prefers-reduced-motion block in base.css neutralizes the animation) */
.scroll-cue {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  z-index: 2;
  width: 2px;
  height: 40px;
  margin-left: -1px;
  background: linear-gradient(180deg, var(--gym-orange), transparent);
  transform-origin: top center;
  animation: scrollPulse 2s ease-in-out infinite;
}

/* when motion is reduced, show the cue as a clean, full static line rather than
   freezing on the dimmed resting frame of the pulse */
@media (prefers-reduced-motion: reduce) {
  .scroll-cue {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

/* shared eyebrow pill + two-tone accent word for the new section headers */
.eyebrow {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: var(--gym-orange);
  background: var(--gym-orange-wash);
  padding: 4px 14px;
  border-radius: 20px;
  margin-bottom: 0.75rem;
}

.section-header .accent {
  color: var(--gym-orange);
}

/* Stats bar — subtly lighter near-black band, hairline dividers between stats */
.stats-bar {
  background: linear-gradient(135deg, var(--gym-surface-raised) 0%, var(--gym-surface-band) 100%);
  border-top: 1px solid var(--gym-border);
  border-bottom: 1px solid var(--gym-border);
  scroll-margin-top: 80px;
}

.stats-inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
}

.stat {
  position: relative;
  text-align: center;
  padding: 0.5rem 1rem;
}

/* hairline divider after each stat except the last */
.stat:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  width: 1px;
  height: 56px;
  background: var(--gym-border);
}

.stat-value {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  line-height: 1;
}

.stat-number {
  font-size: clamp(2.25rem, 4vw, 3.25rem);
  font-weight: 900;
  line-height: 1;
  color: var(--gym-orange);
}

.stat-suffix {
  margin-left: 2px;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--gym-orange);
}

.stat-label {
  display: block;
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: var(--gym-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

/* Who we are */
.who {
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 4rem;
  scroll-margin-top: 80px;
}

.who-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  margin-top: 1rem;
}

.who-subhead {
  font-size: 1.3rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--gym-text);
  margin-bottom: 1rem;
}

.who-text > p {
  color: var(--gym-text-muted);
  font-size: 0.97rem;
  line-height: 1.8;
  margin-bottom: 1rem;
}

.pillars {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

/* feature row: icon tile + copy; lifts/slides + orange border on hover */
.pillar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-radius: 8px;
  transition: var(--gym-transition);
}

.pillar:hover {
  transform: translateX(5px);
  border-color: var(--gym-orange-border);
}

.pillar-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--gym-orange-subtle);
  color: var(--gym-orange);
  font-size: 1.2rem;
}

.pillar-copy h4 {
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--gym-text);
  margin-bottom: 0.2rem;
}

.pillar-copy p {
  font-size: 0.85rem;
  color: var(--gym-text-muted);
  line-height: 1.5;
}

.who-media {
  position: relative;
}

.who-img {
  display: block;
  width: 100%;
  min-height: 340px;
  max-height: 460px;
  height: 100%;
  object-fit: cover;
  object-position: left center;
  border: 1px solid var(--gym-border);
  border-radius: 12px;
}

/* floating experience badge — solid orange card + soft orange glow */
.who-badge {
  position: absolute;
  right: -20px;
  bottom: -20px;
  padding: 1.25rem 1.5rem;
  background: var(--gym-orange);
  color: #000;
  border-radius: 12px;
  text-align: center;
  box-shadow: var(--gym-shadow-glow-lg);
}

.who-badge-number {
  display: block;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
}

.who-badge-text {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.9;
}

/* Contact */
.contact {
  max-width: 1100px;
  margin: 0 auto;
  padding: 4rem 4rem 5rem;
  scroll-margin-top: 80px;
}

.contact-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--gym-surface);
  border: 1px solid var(--gym-border);
  border-radius: 12px;
  text-decoration: none;
  transition: var(--gym-transition);
}

.contact-card:hover {
  transform: translateY(-4px);
  border-color: var(--gym-orange-border);
  box-shadow: var(--gym-shadow-lift);
}

.contact-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--gym-orange-subtle);
  color: var(--gym-orange);
  font-size: 1.2rem;
}

.contact-copy h4 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gym-text-muted);
  margin-bottom: 0.25rem;
}

.contact-copy span {
  font-size: 0.95rem;
  color: var(--gym-text);
}

/* Our programs — full-bleed near-black band (subtle R13 layering between the
   pure-black "who" and "memberships" sections), color-neutral; content centered
   in an inner wrapper. */
.programs {
  background: linear-gradient(180deg, var(--gym-surface-raised) 0%, var(--gym-bg) 100%);
  border-top: 1px solid var(--gym-border);
  border-bottom: 1px solid var(--gym-border);
  scroll-margin-top: 80px;
}

.programs-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 4rem;
}

/* Category filter pills: outlined/ghost at rest, drift toward orange on hover;
   the active pill is a solid-orange fill with white text. */
.program-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
}

.filter-btn {
  padding: 8px 24px;
  background: transparent;
  border: 1px solid var(--gym-border);
  color: var(--gym-text-muted);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 30px;
  cursor: pointer;
  transition: var(--gym-transition);
}

.filter-btn:hover {
  background: var(--gym-orange-wash);
  border-color: var(--gym-orange-border);
  color: var(--gym-orange);
}

/* active stays solid orange even while hovered */
.filter-btn.active,
.filter-btn.active:hover {
  background: var(--gym-orange);
  border-color: var(--gym-orange);
  color: #fff;
}

.programs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

/* Resting: flat surface + hairline border with a hidden orange top-glow bar.
   Hover: lifts, border tints orange, soft shadow, glow bar fades in. */
.program-card {
  position: relative;
  overflow: hidden;
  text-align: center;
  padding: 2.25rem 1.75rem;
  background: var(--gym-surface);
  border: 1px solid var(--gym-border);
  border-radius: 12px;
  transition: var(--gym-transition);
}

.program-card-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gym-orange), transparent);
  opacity: 0;
  transition: var(--gym-transition);
}

.program-card:hover {
  transform: translateY(-8px);
  border-color: var(--gym-orange-border);
  box-shadow: var(--gym-shadow-lift);
}

.program-card:hover .program-card-glow {
  opacity: 1;
}

/* bare orange glyph, no tile (matches IronForge program-icon) */
.program-icon {
  font-size: 2.25rem;
  color: var(--gym-orange);
  margin-bottom: 1rem;
  line-height: 1;
}

.program-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.program-card > p {
  font-size: 0.88rem;
  color: var(--gym-text-muted);
  line-height: 1.6;
  margin-bottom: 1.1rem;
}

/* small orange-outlined category tag (also the value the filter keys on) */
.program-tag {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--gym-orange);
  padding: 4px 12px;
  border: 1px solid var(--gym-orange-border);
  border-radius: 20px;
}

/* Filter transition — fade + rise in, fade out, smooth reflow of staying cards.
   ~300–400ms on the shared cubic-bezier; neutralized under reduced-motion below
   (and by the global reduced-motion block in base.css). */
.program-enter-active {
  transition: opacity 0.4s var(--gym-ease), transform 0.4s var(--gym-ease);
}

.program-leave-active {
  transition: opacity 0.3s var(--gym-ease), transform 0.3s var(--gym-ease);
}

.program-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.program-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.program-move {
  transition: transform 0.4s var(--gym-ease);
}

@media (prefers-reduced-motion: reduce) {
  .program-enter-active,
  .program-leave-active,
  .program-move,
  .filter-btn,
  .filter-btn:hover,
  .filter-btn.active {
    transition: none !important;
  }

  .program-enter-from,
  .program-leave-to {
    opacity: 1;
    transform: none;
  }
}

/* Memberships */
.memberships {
  padding: 2rem 4rem 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

.membership-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  max-width: 700px;
  margin: 0 auto 2rem;
  padding: 0.85rem 1.25rem;
  border-radius: 12px;
  background: linear-gradient(180deg, var(--gym-orange-wash) 0%, var(--gym-surface-raised) 100%);
  border: 1px solid var(--gym-orange-border);
  color: var(--gym-text);
  font-size: 0.95rem;
}

.membership-banner i {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--gym-orange-ring);
  color: var(--gym-orange);
  font-size: 1.1rem;
}

.membership-banner strong {
  color: var(--gym-orange);
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.plan-card {
  position: relative;
  overflow: hidden;
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  text-align: center;
  transition: var(--gym-transition);
}

.plan-card:hover {
  transform: translateY(-8px);
  border-color: var(--gym-orange) !important;
  box-shadow: var(--gym-shadow-lift);
}

.plan-card.active {
  border-color: var(--gym-orange) !important;
  box-shadow: 0 0 0 1px var(--gym-orange);
}

/* highlighted plan: orange border + faint orange tint (lift only on hover) */
.plan-card.popular {
  border-color: var(--gym-orange) !important;
  background: linear-gradient(180deg, var(--gym-orange-tint) 0%, var(--gym-surface) 100%) !important;
}

.plan-card.popular h3 {
  color: #fff;
}

.ribbon {
  position: absolute;
  top: 16px;
  right: -30px;
  z-index: 1;
  transform: rotate(45deg);
  background: var(--gym-orange);
  color: #000;
  padding: 4px 40px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.plan-card h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.plan-card .price {
  margin-bottom: 0.75rem;
}

.plan-card .amount {
  font-size: 2rem;
  font-weight: 800;
  color: var(--gym-orange);
}

.plan-card .period {
  font-size: 0.85rem;
  color: var(--gym-text-muted);
}

.plan-desc {
  font-size: 0.88rem;
  color: var(--gym-text-muted);
  line-height: 1.5;
  margin-bottom: 0.75rem;
  min-height: 2.6rem;
}

.includes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--gym-text-muted);
  margin-bottom: 1rem;
}

.includes .pi-check {
  color: var(--gym-orange);
}

.includes .pi-times {
  color: var(--gym-text-muted);
}

.status {
  text-align: center;
  color: var(--gym-text-muted);
}

/* Classes */
.classes {
  padding: 2rem 4rem 5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.section-header h2 {
  display: inline-block;
  font-size: 2rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

/* orange underline bar beneath section titles */
.section-header h2::after {
  content: '';
  display: block;
  width: 50px;
  height: 3px;
  background: var(--gym-orange);
  border-radius: 2px;
  margin: 12px auto 0;
}

.section-header p {
  color: var(--gym-text-muted);
  font-size: 1rem;
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.class-link {
  text-decoration: none;
  color: inherit;
}

.class-card {
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  overflow: hidden;
  transition: var(--gym-transition);
}

.class-link:hover .class-card {
  transform: translateY(-8px);
  border-color: var(--gym-orange) !important;
  box-shadow: var(--gym-shadow-lift);
}

.class-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.class-link:hover .class-img {
  transform: scale(1.05);
}

.card-body h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.meta span {
  font-size: 0.8rem;
  color: var(--gym-orange);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.card-body p {
  font-size: 0.88rem;
  color: var(--gym-text-muted);
  line-height: 1.6;
}

/* Programs grid: 4 across on desktop → 2 on tablet → 1 on mobile */
@media (max-width: 980px) {
  .programs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 540px) {
  .programs-grid {
    grid-template-columns: 1fr;
  }
}

/* Responsive — stack the about columns, collapse the stat dividers, tighten padding */
@media (max-width: 860px) {
  .who-body {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .who,
  .contact,
  .memberships,
  .classes {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .programs-inner {
    padding: 3.5rem 1.5rem;
  }

  .who-badge {
    right: 1rem;
    bottom: -16px;
  }
}

@media (max-width: 768px) {
  .stats-inner {
    grid-template-columns: 1fr 1fr;
    row-gap: 1.75rem;
    padding: 2rem 1.5rem;
  }

  /* hairline dividers only read in a single row — drop them once stats wrap */
  .stat::after {
    display: none;
  }
}
</style>
