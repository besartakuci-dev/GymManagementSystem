<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import { vReveal, vCountup } from '@/composables/useMotion'

const values = [
  { icon: 'pi pi-bolt',       title: 'Performance First',  desc: 'Every programme, every session, every rep is designed around measurable results.' },
  { icon: 'pi pi-users',      title: 'Community',          desc: 'We train together, push each other, and celebrate every milestone as a team.' },
  { icon: 'pi pi-verified',   title: 'Expert Coaching',    desc: 'All our trainers are certified professionals with years of hands-on experience.' },
  { icon: 'pi pi-heart',      title: 'Inclusive Spaces',   desc: 'From first-timers to seasoned athletes — everyone belongs at BBros Gym.' },
]

const team = [
  { name: 'Petrit Maliqi',    role: 'Head Trainer',       icon: 'pi pi-user', speciality: 'Strength & Conditioning' },
  { name: 'Saranda Krasniqi', role: 'Yoga & Pilates Lead', icon: 'pi pi-user', speciality: 'Yoga · Pilates · Mindfulness' },
  { name: 'Valbona Gashi',    role: 'CrossFit Coach',      icon: 'pi pi-user', speciality: 'CrossFit · HIIT · Endurance' },
]
</script>

<template>
  <main class="about">

    <!-- Hero -->
    <section class="hero">
      <span class="eyebrow">Our Story</span>
      <h1>Built by Athletes,<br />For Athletes.</h1>
      <p>
        BBros Gym was founded with one belief: that a great gym is more than equipment —
        it's the coaches, the culture, and the community that make people come back every day.
      </p>
      <RouterLink to="/login" class="hero-cta">
        <Button label="Join the Community" size="large" />
      </RouterLink>
    </section>

    <!-- Stats bar -->
    <section class="stats-bar">
      <div class="stat">
        <span class="stat-number" v-countup>500+</span>
        <span class="stat-label">Active Members</span>
      </div>
      <div class="divider" />
      <div class="stat">
        <span class="stat-number" v-countup>30+</span>
        <span class="stat-label">Weekly Classes</span>
      </div>
      <div class="divider" />
      <div class="stat">
        <span class="stat-number" v-countup>3</span>
        <span class="stat-label">Expert Trainers</span>
      </div>
      <div class="divider" />
      <div class="stat">
        <span class="stat-number" v-countup>5+</span>
        <span class="stat-label">Years Running</span>
      </div>
    </section>

    <!-- Mission -->
    <section class="mission">
      <div class="mission-text" v-reveal>
        <span class="eyebrow">Our Mission</span>
        <h2>We exist to make you stronger — in every sense of the word.</h2>
        <p>
          At BBros Gym, we believe fitness transforms more than just your body. Our programmes
          are built around discipline, consistency, and community. Whether you're stepping into
          a gym for the first time or training for your next competition, we meet you where you are
          and help you get where you want to be.
        </p>
      </div>
      <div class="values-grid">
        <Card v-for="v in values" :key="v.title" class="value-card" v-reveal>
          <template #content>
            <i :class="v.icon" class="value-icon" />
            <h3>{{ v.title }}</h3>
            <p>{{ v.desc }}</p>
          </template>
        </Card>
      </div>
    </section>

    <!-- Team -->
    <section class="team">
      <div class="section-header" v-reveal>
        <span class="eyebrow">The Team</span>
        <h2>Meet Your Coaches</h2>
        <p>Certified, experienced, and genuinely invested in your progress.</p>
      </div>
      <div class="team-grid">
        <Card v-for="member in team" :key="member.name" class="trainer-card" v-reveal>
          <template #content>
            <div class="trainer-avatar">
              <i :class="member.icon" />
            </div>
            <h3>{{ member.name }}</h3>
            <span class="trainer-role">{{ member.role }}</span>
            <p class="trainer-speciality">{{ member.speciality }}</p>
          </template>
        </Card>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta" v-reveal>
      <h2>Ready to start?</h2>
      <p>Create an account and book your first class today — no commitment needed.</p>
      <RouterLink to="/login">
        <Button label="Get Started" size="large" />
      </RouterLink>
    </section>

  </main>
</template>

<style scoped>
.about {
  background: var(--gym-bg);
  color: var(--gym-text);
}

.eyebrow {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--gym-orange);
  background: var(--gym-orange-wash);
  padding: 4px 14px;
  border-radius: 20px;
  margin-bottom: 0.75rem;
}

/* Hero */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 6rem 2rem 5rem;
  gap: 1.25rem;
}

.hero .eyebrow {
  animation: fadeInUp 1s ease both;
}

.hero h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--gym-text);
  animation: fadeInUp 1s ease 0.2s both;
}

.hero p {
  max-width: 520px;
  color: var(--gym-text-muted);
  font-size: 1.05rem;
  line-height: 1.7;
  animation: fadeInUp 1s ease 0.4s both;
}

.hero-cta {
  animation: fadeInUp 1s ease 0.6s both;
}

/* Stats bar */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  padding: 2.5rem 2rem;
  border-top: 1px solid var(--gym-border);
  border-bottom: 1px solid var(--gym-border);
  background: var(--gym-surface);
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-number {
  font-size: 2.25rem;
  font-weight: 900;
  color: var(--gym-orange);
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--gym-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.divider {
  width: 1px;
  height: 48px;
  background: var(--gym-border);
}

/* Mission */
.mission {
  max-width: 1100px;
  margin: 0 auto;
  padding: 5rem 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
}

.mission-text h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--gym-text);
  line-height: 1.3;
  margin-bottom: 1rem;
}

.mission-text p {
  color: var(--gym-text-muted);
  font-size: 0.97rem;
  line-height: 1.8;
}

.values-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.value-card {
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  transition: var(--gym-transition);
}

/* feature-row hover: slide right + orange border tint */
.value-card:hover {
  transform: translateX(5px);
  border-color: var(--gym-orange-border) !important;
}

.value-icon {
  font-size: 1.4rem;
  color: var(--gym-orange);
  margin-bottom: 0.6rem;
  display: block;
}

.value-card h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--gym-text);
  margin-bottom: 0.35rem;
}

.value-card p {
  font-size: 0.83rem;
  color: var(--gym-text-muted);
  line-height: 1.6;
}

/* Team */
.team {
  background: var(--gym-surface);
  border-top: 1px solid var(--gym-border);
  border-bottom: 1px solid var(--gym-border);
  padding: 5rem 2rem;
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

/* orange underline bar beneath the section title */
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
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.trainer-card {
  position: relative;
  overflow: hidden;
  background: var(--gym-surface-raised) !important;
  border: 1px solid var(--gym-border) !important;
  text-align: center;
  transition: var(--gym-transition);
}

/* top accent glow bar, hidden at rest */
.trainer-card::before {
  content: '';
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

.trainer-card:hover {
  transform: translateY(-8px);
  border-color: var(--gym-orange-border-soft) !important;
  box-shadow: var(--gym-shadow-lift);
}

.trainer-card:hover::before {
  opacity: 1;
}

.trainer-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--gym-orange-subtle);
  border: 2px solid var(--gym-orange);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  transition: var(--gym-transition);
}

.trainer-card:hover .trainer-avatar {
  box-shadow: 0 6px 20px var(--gym-orange-glow);
}

.trainer-avatar i {
  font-size: 1.6rem;
  color: var(--gym-orange);
}

.trainer-card h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--gym-text);
  margin-bottom: 0.2rem;
}

.trainer-role {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gym-orange);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  display: block;
  margin-bottom: 0.5rem;
}

.trainer-speciality {
  font-size: 0.83rem;
  color: var(--gym-text-muted);
}

/* CTA */
.cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 5rem 2rem;
  gap: 1rem;
}

.cta h2 {
  font-size: 2.25rem;
  font-weight: 900;
  color: var(--gym-text);
}

.cta p {
  color: var(--gym-text-muted);
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .mission {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .stats-bar { gap: 1.5rem; }
  .divider   { display: none; }
}
</style>
