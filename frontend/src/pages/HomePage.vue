<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { getPlans, subscribe } from '@/api/plans'
import fitnesImg   from '@/assets/fitnes.png'
import pilatesImg  from '@/assets/pilates.png'
import yogaImg     from '@/assets/yoga.png'
import crossfitImg from '@/assets/crossfit.png'

const auth = useAuthStore()
const toast = useToast()

const plans = ref<any[]>([])
const plansLoading = ref(true)
const buyingPlanId = ref<number | null>(null)

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

async function buyPlan(plan: any) {
  if (!auth.user || auth.hasMembership) return
  buyingPlanId.value = plan.PlanID
  try {
    await subscribe(plan.PlanID)
    await auth.refreshMembership()
    toast.add({
      severity: 'success',
      summary: 'Membership activated',
      detail: `You're now on the ${plan.PlanName} plan. You can join classes!`,
      life: 4000,
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Could not activate membership',
      detail: e.response?.data?.message ?? 'Something went wrong',
      life: 4000,
    })
  } finally {
    buyingPlanId.value = null
  }
}

const features = [
  { icon: 'pi pi-users',    title: '500+ Members',    desc: 'A growing community of dedicated athletes.' },
  { icon: 'pi pi-calendar', title: '30+ Classes',     desc: 'From strength training to cardio and yoga.' },
  { icon: 'pi pi-star',     title: 'Expert Trainers', desc: 'Certified coaches with years of experience.' },
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
</script>

<template>
  <main>

    <!-- Hero -->
    <section class="hero">
      <h1>TRAIN HARDER.<br />LIVE STRONGER.</h1>
      <p>GymCore — where results happen. Join a community built around performance, discipline, and progress.</p>
      <template v-if="auth.user">
        <p class="welcome">Welcome back, <strong>{{ auth.user.FirstName }}</strong>. Ready for today's session?</p>
      </template>
      <template v-else>
        <RouterLink to="/login">
          <Button label="Join Now" size="large" />
        </RouterLink>
      </template>
    </section>

    <!-- Stats -->
    <section class="features">
      <Card v-for="f in features" :key="f.title" class="feature-card">
        <template #content>
          <i :class="f.icon" class="feature-icon" />
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </template>
      </Card>
    </section>

    <!-- Membership plans -->
    <section class="memberships">
      <div class="section-header">
        <h2>Membership Plans</h2>
        <p>Choose a plan to unlock the gym and start joining classes.</p>
      </div>

      <p v-if="auth.user && auth.hasMembership" class="membership-banner">
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
          :class="{ active: auth.hasMembership && auth.membership?.PlanID === plan.PlanID }"
        >
          <template #content>
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
              :loading="buyingPlanId === plan.PlanID"
              :disabled="buyingPlanId !== null"
              @click="buyPlan(plan)"
              fluid
            />
          </template>
        </Card>
      </div>
    </section>

    <!-- Classes -->
    <section class="classes">
      <div class="section-header">
        <h2>Our Classes</h2>
        <p>Find the right class for your goals and fitness level.</p>
      </div>
      <div class="classes-grid">
        <RouterLink v-for="c in classes" :key="c.title" :to="`/classes/${c.slug}`" class="class-link">
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

  </main>
</template>

<style scoped>
main {
  background: var(--gym-bg);
}

/* Hero */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6rem 2rem 4rem;
  gap: 1.5rem;
}

.hero h1 {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--gym-text);
}

.hero p {
  max-width: 500px;
  color: var(--gym-text-muted);
  font-size: 1.05rem;
  line-height: 1.6;
}

.welcome {
  color: var(--gym-text) !important;
  font-size: 1rem !important;
}

.welcome strong {
  color: var(--gym-orange);
}

/* Stats */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  padding: 0 4rem 5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  text-align: center;
}

.feature-icon {
  font-size: 2rem;
  color: var(--gym-orange);
  margin-bottom: 0.75rem;
}

.feature-card h3 {
  font-size: 1.1rem;
  color: var(--gym-text);
  margin-bottom: 0.4rem;
}

.feature-card p {
  font-size: 0.88rem;
  color: var(--gym-text-muted);
  line-height: 1.5;
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
  gap: 0.5rem;
  max-width: 700px;
  margin: 0 auto 2rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: var(--gym-orange-subtle);
  border: 1px solid rgba(249, 115, 22, 0.3);
  color: var(--gym-text);
  font-size: 0.95rem;
}

.membership-banner i {
  color: var(--gym-orange);
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
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  text-align: center;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.plan-card:hover {
  transform: translateY(-2px);
  border-color: var(--gym-orange) !important;
}

.plan-card.active {
  border-color: var(--gym-orange) !important;
  box-shadow: 0 0 0 1px var(--gym-orange);
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
  font-size: 2rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
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
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.class-link:hover .class-card {
  transform: translateY(-2px);
  border-color: var(--gym-orange) !important;
}

.class-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
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

</style>
