<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
<<<<<<< HEAD
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

import fitnesImg from '@/assets/fitnes.png'
import pilatesImg from '@/assets/pilates.png'
import yogaImg from '@/assets/yoga.png'
=======
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { getPlans, subscribe } from '@/api/plans'
import fitnesImg   from '@/assets/fitnes.png'
import pilatesImg  from '@/assets/pilates.png'
import yogaImg     from '@/assets/yoga.png'
>>>>>>> c2414002c786a360498184c8b29ca26b330d6afb
import crossfitImg from '@/assets/crossfit.png'

interface Trainer {
  TrainerID: number
  UserID: number
  FirstName: string
  LastName: string
  Email: string
  Specialization: string
  Bio: string
}

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

const trainers = ref<Trainer[]>([])
const trainersLoading = ref(false)
const selectedTrainer = ref<Trainer | null>(null)
const trainerDialogVisible = ref(false)

const features = [
  { icon: 'pi pi-users', title: '500+ Members', desc: 'A growing community of dedicated athletes.' },
  { icon: 'pi pi-calendar', title: '30+ Classes', desc: 'From strength training to cardio, yoga, and pilates.' },
  { icon: 'pi pi-star', title: 'Expert Trainers', desc: 'Certified coaches with years of professional experience.' },
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

function getInitials(trainer: Trainer) {
  return `${trainer.FirstName?.charAt(0) ?? ''}${trainer.LastName?.charAt(0) ?? ''}`
}

function openTrainerDetails(trainer: Trainer) {
  selectedTrainer.value = trainer
  trainerDialogVisible.value = true
}

function getTrainerExperienceText(index: number) {
  const experiences = ['10+ years experience', 'RYT-200 Certified Coach', 'Performance Specialist']
  return experiences[index % experiences.length]
}

function getTrainerFocus(index: number) {
  const focus = ['Strength & discipline', 'Mobility & control', 'Energy & endurance']
  return focus[index % focus.length]
}

async function loadTrainers() {
  try {
    trainersLoading.value = true
    const response = await api.get('/trainers/public')
    trainers.value = response.data.data.trainers ?? []
  } catch (error) {
    console.error('Failed to load trainers:', error)
    trainers.value = []
  } finally {
    trainersLoading.value = false
  }
}

onMounted(() => {
  loadTrainers()
})
</script>

<template>
  <main>
    <!-- Hero -->
    <section class="hero">
      <div class="hero-badge">
        <i class="pi pi-bolt" />
        Premium Fitness Experience
      </div>

      <h1>TRAIN HARDER.<br />LIVE STRONGER.</h1>
<<<<<<< HEAD
      <p>
        BBros Gym is built for people who want discipline, progress, and professional coaching in every session.
      </p>

=======
      <p>GymCore — where results happen. Join a community built around performance, discipline, and progress.</p>
>>>>>>> c2414002c786a360498184c8b29ca26b330d6afb
      <template v-if="auth.user">
        <p class="welcome">Welcome back, <strong>{{ auth.user.FirstName }}</strong>. Ready for today's session?</p>
      </template>

      <template v-else>
        <RouterLink to="/login">
          <Button label="Join Now" size="large" icon="pi pi-arrow-right" iconPos="right" />
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
        <span>Programs</span>
        <h2>Our Classes</h2>
        <p>Choose the right training program based on your goals and fitness level.</p>
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

    <!-- Trainers -->
    <section class="trainers">
      <div class="section-header">
        <span>Coaching Team</span>
        <h2>Meet Our Trainers</h2>
        <p>
          Our trainers combine experience, motivation, and personal guidance to help every member improve safely and consistently.
        </p>
      </div>

      <p v-if="trainersLoading" class="loading-text">Loading trainers...</p>

      <div v-else class="trainers-grid">
        <Card
          v-for="(trainer, index) in trainers"
          :key="trainer.TrainerID"
          class="trainer-card"
          @click="openTrainerDetails(trainer)"
        >
          <template #content>
            <div class="trainer-top">
              <div class="trainer-avatar">
                {{ getInitials(trainer) }}
              </div>

              <div class="trainer-rating">
                <i class="pi pi-star-fill" />
                <i class="pi pi-star-fill" />
                <i class="pi pi-star-fill" />
                <i class="pi pi-star-fill" />
                <i class="pi pi-star-fill" />
              </div>
            </div>

            <h3>{{ trainer.FirstName }} {{ trainer.LastName }}</h3>

            <Tag :value="trainer.Specialization" severity="warning" class="trainer-tag" />

            <p class="trainer-bio-preview">
              {{ trainer.Bio }}
            </p>

            <div class="trainer-info-row">
              <span><i class="pi pi-check-circle" /> {{ getTrainerExperienceText(index) }}</span>
              <span><i class="pi pi-heart" /> {{ getTrainerFocus(index) }}</span>
            </div>

            <Button label="View Biography" icon="pi pi-user" class="view-btn" text />
          </template>
        </Card>
      </div>
    </section>

   <!-- Trainer Details Dialog -->
<Dialog
  v-model:visible="trainerDialogVisible"
  modal
  class="trainer-dialog"
  :header="selectedTrainer ? `${selectedTrainer.FirstName} ${selectedTrainer.LastName}` : 'Trainer Biography'"
>
  <div v-if="selectedTrainer" class="trainer-details">
    <div class="dialog-avatar">
      {{ getInitials(selectedTrainer) }}
    </div>

    <h2>{{ selectedTrainer.FirstName }} {{ selectedTrainer.LastName }}</h2>
    <Tag :value="selectedTrainer.Specialization" severity="warning" />

    <Divider />

    <div class="dialog-section">
      <h4>Professional Biography</h4>
      <p>{{ selectedTrainer.Bio }}</p>
    </div>

    <div class="dialog-summary">
      <div class="summary-item">
        <i class="pi pi-user" />
        <div>
          <strong>Trainer Role</strong>
          <span>Certified BBros Gym Trainer</span>
        </div>
      </div>

      <div class="summary-item">
        <i class="pi pi-star" />
        <div>
          <strong>Specialization</strong>
          <span>{{ selectedTrainer.Specialization }}</span>
        </div>
      </div>

      <div class="summary-item">
        <i class="pi pi-check-circle" />
        <div>
          <strong>Coaching Approach</strong>
          <span>Personalized training, discipline, and member progress.</span>
        </div>
      </div>
    </div>
  </div>
</Dialog>
  </main>
</template>

<style scoped>
main {
  background: var(--gym-bg);
}

/* Hero */
.hero {
  min-height: 78vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 7rem 2rem 5rem;
  gap: 1.5rem;
  background:
    radial-gradient(circle at 50% 15%, rgba(255, 122, 24, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(255, 122, 24, 0.03), transparent);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--gym-orange);
  border: 1px solid rgba(255, 122, 24, 0.35);
  background: rgba(255, 122, 24, 0.08);
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.hero h1 {
  font-size: clamp(2.7rem, 6vw, 5rem);
  font-weight: 950;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: var(--gym-text);
}

.hero p {
  max-width: 620px;
  color: var(--gym-text-muted);
  font-size: 1.08rem;
  line-height: 1.7;
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
  max-width: 1050px;
  margin: 0 auto;
}

.feature-card {
  background: linear-gradient(180deg, rgba(255, 122, 24, 0.05), var(--gym-surface)) !important;
  border: 1px solid var(--gym-border) !important;
  text-align: center;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: var(--gym-orange) !important;
  box-shadow: 0 20px 45px rgba(255, 122, 24, 0.08);
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

<<<<<<< HEAD
/* Sections */
.classes,
.trainers {
  padding: 3rem 4rem 6rem;
  max-width: 1220px;
=======
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
>>>>>>> c2414002c786a360498184c8b29ca26b330d6afb
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 2.7rem;
}

.section-header span {
  color: var(--gym-orange);
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  font-weight: 900;
}

.section-header h2 {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  color: var(--gym-text);
  margin: 0.45rem 0 0.65rem;
}

.section-header p {
  color: var(--gym-text-muted);
  font-size: 1rem;
  max-width: 650px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Classes */
.classes-grid,
.trainers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 1.6rem;
}

.class-link {
  text-decoration: none;
  color: inherit;
}

.class-card,
.trainer-card {
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.class-link:hover .class-card,
.trainer-card:hover {
  transform: translateY(-5px);
  border-color: var(--gym-orange) !important;
  box-shadow: 0 22px 55px rgba(255, 122, 24, 0.1);
}

.class-img {
  width: 100%;
  height: 210px;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}

.card-body h3 {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.55rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.meta span {
  font-size: 0.82rem;
  color: var(--gym-orange);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.card-body p {
  font-size: 0.9rem;
  color: var(--gym-text-muted);
  line-height: 1.65;
}

<<<<<<< HEAD
/* Trainers */
.trainers {
  background:
    radial-gradient(circle at top left, rgba(255, 122, 24, 0.08), transparent 32%),
    transparent;
}

.trainer-card {
  cursor: pointer;
  text-align: center;
  position: relative;
}

.trainer-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 122, 24, 0.08), transparent 38%);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.trainer-card:hover::before {
  opacity: 1;
}

.trainer-top {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.trainer-avatar {
  width: 82px;
  height: 82px;
  margin: 0 auto 0.9rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gym-orange), #ffb15c);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 950;
  font-size: 1.45rem;
  box-shadow: 0 0 0 7px rgba(255, 122, 24, 0.08);
}

.trainer-rating {
  color: var(--gym-orange);
  font-size: 0.78rem;
  display: flex;
  gap: 0.18rem;
  justify-content: center;
  margin-bottom: 0.8rem;
}

.trainer-card h3 {
  font-size: 1.2rem;
  font-weight: 850;
  color: var(--gym-text);
  margin-bottom: 0.55rem;
}

.trainer-tag {
  margin-bottom: 1rem;
}

.trainer-bio-preview {
  font-size: 0.9rem;
  color: var(--gym-text-muted);
  line-height: 1.65;
  min-height: 72px;
  margin-bottom: 1.1rem;
}

.trainer-info-row {
  display: grid;
  gap: 0.55rem;
  margin: 1rem 0;
  text-align: left;
}

.trainer-info-row span {
  color: var(--gym-text-muted);
  font-size: 0.84rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.trainer-info-row i {
  color: var(--gym-orange);
}

.view-btn {
  color: var(--gym-orange) !important;
  font-weight: 800;
}

.loading-text {
  text-align: center;
  color: var(--gym-text-muted);
}

/* Dialog */
:deep(.trainer-dialog) {
  width: 560px;
  max-width: 92vw;
}

:deep(.p-dialog) {
  background: var(--gym-surface);
  border: 1px solid var(--gym-border);
  color: var(--gym-text);
  border-radius: 20px;
  overflow: hidden;
}

:deep(.p-dialog-header) {
  background: linear-gradient(90deg, rgba(255, 122, 24, 0.15), var(--gym-surface));
  color: var(--gym-text);
  border-bottom: 1px solid var(--gym-border);
}

:deep(.p-dialog-content) {
  background: var(--gym-surface);
  color: var(--gym-text);
}

.trainer-details {
  text-align: center;
}

.dialog-avatar {
  width: 96px;
  height: 96px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gym-orange), #ffb15c);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 950;
  font-size: 1.75rem;
  box-shadow: 0 0 0 9px rgba(255, 122, 24, 0.09);
}

.trainer-details h2 {
  color: var(--gym-text);
  margin-bottom: 0.6rem;
}

.dialog-section {
  text-align: left;
  margin: 1.3rem 0;
}

.dialog-section h4 {
  color: var(--gym-orange);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.82rem;
  margin-bottom: 0.65rem;
}

.dialog-section p {
  color: var(--gym-text-muted);
  line-height: 1.75;
}

.dialog-summary {
  display: grid;
  gap: 0.9rem;
  margin-top: 1.2rem;
}

.summary-item {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid var(--gym-border);
  border-radius: 14px;
  padding: 1rem;
  text-align: left;
}

.summary-item i {
  color: var(--gym-orange);
  font-size: 1.1rem;
  margin-top: 0.2rem;
}

.summary-item strong {
  display: block;
  color: var(--gym-text);
  margin-bottom: 0.25rem;
  font-size: 0.95rem;
}

.summary-item span {
  color: var(--gym-text-muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

@media (max-width: 700px) {
  .features,
  .classes,
  .trainers {
    padding-left: 1.3rem;
    padding-right: 1.3rem;
  }

  .hero {
    padding-top: 5rem;
  }
}
</style>
=======
</style>
>>>>>>> c2414002c786a360498184c8b29ca26b330d6afb
