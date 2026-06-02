<script setup lang="ts">
import Card from 'primevue/card'
import fitnesImg   from '@/assets/fitnes.png'
import pilatesImg  from '@/assets/pilates.png'
import yogaImg     from '@/assets/yoga.png'
import crossfitImg from '@/assets/crossfit.png'

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
  <main class="classes-page">

    <div class="header">
      <h1>Our Classes</h1>
      <p>Find the right class for your goals and fitness level.</p>
    </div>

    <div class="grid">
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

  </main>
</template>

<style scoped>
.classes-page {
  min-height: calc(100vh - 64px);
  background: var(--gym-bg);
  padding: 4rem 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.header p {
  color: var(--gym-text-muted);
  font-size: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
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

.card-body {
  padding: 0.25rem 0;
}

.card-body h3 {
  font-size: 1.2rem;
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
