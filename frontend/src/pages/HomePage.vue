<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import { useAuthStore } from '@/stores/auth'
import fitnesImg   from '@/assets/fitnes.png'
import pilatesImg  from '@/assets/pilates.png'
import yogaImg     from '@/assets/yoga.png'
import crossfitImg from '@/assets/crossfit.png'

const auth = useAuthStore()

const features = [
  { icon: 'pi pi-users',    title: '500+ Members',    desc: 'A growing community of dedicated athletes.' },
  { icon: 'pi pi-calendar', title: '30+ Classes',     desc: 'From strength training to cardio and yoga.' },
  { icon: 'pi pi-star',     title: 'Expert Trainers', desc: 'Certified coaches with years of experience.' },
]

const classes = [
  {
    image: fitnesImg,
    title: 'Fitness',
    level: 'All levels',
    duration: '60 min',
    desc: 'Full-body strength and conditioning sessions designed to build muscle, burn fat, and boost overall performance.',
  },
  {
    image: pilatesImg,
    title: 'Pilates',
    level: 'Beginner – Intermediate',
    duration: '50 min',
    desc: 'Low-impact core-focused training that improves posture, flexibility, and body awareness.',
  },
  {
    image: yogaImg,
    title: 'Yoga',
    level: 'All levels',
    duration: '60 min',
    desc: 'Breathwork, balance, and mindful movement to increase flexibility and reduce stress.',
  },
  {
    image: crossfitImg,
    title: 'CrossFit',
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
      <p>BBros Gym — where results happen. Join a community built around performance, discipline, and progress.</p>
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

    <!-- Classes -->
    <section class="classes">
      <div class="section-header">
        <h2>Our Classes</h2>
        <p>Find the right class for your goals and fitness level.</p>
      </div>
      <div class="classes-grid">
        <Card v-for="c in classes" :key="c.title" class="class-card">
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

.class-card {
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  overflow: hidden;
}

.class-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
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
