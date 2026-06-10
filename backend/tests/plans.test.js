import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { signToken } from '../src/utils/jwt.js';
import { pool } from '../src/config/db.js';

// Tokens are minted directly with the app's own signer — the same path `authenticate`
// verifies — so the RBAC/validation tests need no database and no /auth round-trip.
const adminToken = signToken({ sub: 1, role: 'admin', email: 'admin@test.local' });
const memberToken = signToken({ sub: 9001, role: 'member', email: 'member@test.local' });
const trainerToken = signToken({ sub: 9002, role: 'trainer', email: 'trainer@test.local' });
const bearer = (token) => ['Authorization', `Bearer ${token}`];

let dbUp = false;
const createdPlanIds = [];

test.before(async () => {
  try {
    await pool.query('SELECT 1');
    dbUp = true;
  } catch {
    dbUp = false; // DB-dependent tests will skip; security tests still run.
  }
});

test.after(async () => {
  if (dbUp && createdPlanIds.length) {
    const placeholders = createdPlanIds.map(() => '?').join(',');
    await pool.query(`DELETE FROM Membership_Plans WHERE PlanID IN (${placeholders})`, createdPlanIds);
  }
  await pool.end();
});

// ──────────────────────────────────────────────────────────────────────────
// Auth / RBAC on write endpoints (no DB needed — guards run before any model call)
// ──────────────────────────────────────────────────────────────────────────
test('POST /api/plans without a token → 401', async () => {
  const res = await request(app).post('/api/plans').send({ name: 'X', price: 10 });
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('POST /api/plans as a member → 403', async () => {
  const res = await request(app).post('/api/plans').set(...bearer(memberToken)).send({ name: 'X', price: 10 });
  assert.equal(res.status, 403);
});

test('POST /api/plans as a trainer → 403', async () => {
  const res = await request(app).post('/api/plans').set(...bearer(trainerToken)).send({ name: 'X', price: 10 });
  assert.equal(res.status, 403);
});

test('PATCH /api/plans/:id without a token → 401', async () => {
  const res = await request(app).patch('/api/plans/1').send({ name: 'X' });
  assert.equal(res.status, 401);
});

test('PATCH /api/plans/:id as a member → 403', async () => {
  const res = await request(app).patch('/api/plans/1').set(...bearer(memberToken)).send({ name: 'X' });
  assert.equal(res.status, 403);
});

test('DELETE /api/plans/:id without a token → 401', async () => {
  const res = await request(app).delete('/api/plans/1');
  assert.equal(res.status, 401);
});

test('DELETE /api/plans/:id as a member → 403', async () => {
  const res = await request(app).delete('/api/plans/1').set(...bearer(memberToken));
  assert.equal(res.status, 403);
});

test('PATCH /api/plans/:id as a trainer → 403', async () => {
  const res = await request(app).patch('/api/plans/1').set(...bearer(trainerToken)).send({ name: 'X' });
  assert.equal(res.status, 403);
});

test('DELETE /api/plans/:id as a trainer → 403', async () => {
  const res = await request(app).delete('/api/plans/1').set(...bearer(trainerToken));
  assert.equal(res.status, 403);
});

test('write endpoint with an invalid token → 401', async () => {
  const res = await request(app).post('/api/plans').set('Authorization', 'Bearer not.a.real.token').send({ name: 'X', price: 10 });
  assert.equal(res.status, 401);
});

// ──────────────────────────────────────────────────────────────────────────
// Validation (admin authenticated; validate() rejects before the model runs)
// ──────────────────────────────────────────────────────────────────────────
test('POST /api/plans (admin) with an empty body → 400', async () => {
  const res = await request(app).post('/api/plans').set(...bearer(adminToken)).send({});
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'VALIDATION_ERROR');
});

test('POST /api/plans (admin) with a negative price → 400', async () => {
  const res = await request(app).post('/api/plans').set(...bearer(adminToken)).send({ name: 'Bad', price: -5 });
  assert.equal(res.status, 400);
});

test('PATCH /api/plans/:id (admin) with an empty body → 400', async () => {
  const res = await request(app).patch('/api/plans/1').set(...bearer(adminToken)).send({});
  assert.equal(res.status, 400);
});

test('GET /api/plans/:id with a non-numeric id → 400', async () => {
  const res = await request(app).get('/api/plans/abc');
  assert.equal(res.status, 400);
});

test('POST /api/plans (admin) with price = Infinity → 400', async () => {
  const res = await request(app).post('/api/plans').set(...bearer(adminToken)).send({ name: 'Infinite', price: 'Infinity' });
  assert.equal(res.status, 400);
});

// ──────────────────────────────────────────────────────────────────────────
// Public reads + admin happy path (require a live database)
// ──────────────────────────────────────────────────────────────────────────
test('GET /api/plans is public and returns active plans only', async (t) => {
  if (!dbUp) return t.skip('database not available');
  const res = await request(app).get('/api/plans');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.plans));
  assert.ok(res.body.data.plans.length > 0);
  for (const plan of res.body.data.plans) {
    assert.equal(plan.IsActive, 1); // storefront never lists inactive plans
    assert.ok('PlanName' in plan && 'Price' in plan && 'Features' in plan);
  }
});

test('GET /api/plans/:id returns one plan and 404s when missing', async (t) => {
  if (!dbUp) return t.skip('database not available');
  const ok = await request(app).get('/api/plans/1');
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.plan.PlanID, 1);
  // contract: the single-plan response must carry every field the frontend reads
  for (const field of ['PlanName', 'Price', 'DurationMonths', 'IncludesClasses', 'Description', 'Features']) {
    assert.ok(field in ok.body.data.plan, `missing field ${field}`);
  }

  const missing = await request(app).get('/api/plans/999999');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error, 'PLAN_NOT_FOUND');
});

test('admin can create → update → soft-delete a plan, with correct visibility', async (t) => {
  if (!dbUp) return t.skip('database not available');

  // create (201)
  const created = await request(app).post('/api/plans').set(...bearer(adminToken)).send({
    name: 'Test Day Pass',
    price: 9.99,
    durationMonths: 1,
    description: 'Temporary test plan',
    features: ['Single day access'],
    includesClasses: false,
    sortOrder: 99,
  });
  assert.equal(created.status, 201);
  const plan = created.body.data.plan;
  assert.ok(plan.PlanID);
  createdPlanIds.push(plan.PlanID);
  assert.equal(plan.PlanName, 'Test Day Pass');
  assert.deepEqual(plan.Features, ['Single day access']);
  assert.equal(plan.IsActive, 1);
  // contract: frontend-required fields round-trip through create
  assert.equal(plan.DurationMonths, 1);
  assert.equal(plan.IncludesClasses, 0);

  // update (200, partial PATCH)
  const updated = await request(app)
    .patch(`/api/plans/${plan.PlanID}`)
    .set(...bearer(adminToken))
    .send({ price: 12.5, isPopular: true });
  assert.equal(updated.status, 200);
  assert.equal(Number(updated.body.data.plan.Price), 12.5);
  assert.equal(updated.body.data.plan.IsPopular, 1);

  // visible to the public while active
  const listWhileActive = await request(app).get('/api/plans');
  assert.ok(listWhileActive.body.data.plans.some((p) => p.PlanID === plan.PlanID));

  // soft delete (200, IsActive flips to 0 — row is kept)
  const deleted = await request(app).delete(`/api/plans/${plan.PlanID}`).set(...bearer(adminToken));
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.data.plan.IsActive, 0);

  // hidden from the public list and a public GET after soft delete
  const listAfter = await request(app).get('/api/plans');
  assert.ok(!listAfter.body.data.plans.some((p) => p.PlanID === plan.PlanID));
  const publicGet = await request(app).get(`/api/plans/${plan.PlanID}`);
  assert.equal(publicGet.status, 404);

  // still reachable by an admin (?includeInactive=true and by id)
  const adminList = await request(app).get('/api/plans?includeInactive=true').set(...bearer(adminToken));
  assert.ok(adminList.body.data.plans.some((p) => p.PlanID === plan.PlanID));
  const adminGet = await request(app).get(`/api/plans/${plan.PlanID}`).set(...bearer(adminToken));
  assert.equal(adminGet.status, 200);
});

test('?includeInactive=true is ignored for anonymous callers', async (t) => {
  if (!dbUp) return t.skip('database not available');
  // Even with the flag, an unauthenticated caller must not see inactive plans.
  const res = await request(app).get('/api/plans?includeInactive=true');
  assert.equal(res.status, 200);
  for (const plan of res.body.data.plans) {
    assert.equal(plan.IsActive, 1);
  }
});

test('?includeInactive=true is ignored for non-admin tokens (member, trainer)', async (t) => {
  if (!dbUp) return t.skip('database not available');
  // The flag is gated to admins only; member/trainer tokens must still see active plans only.
  for (const token of [memberToken, trainerToken]) {
    const res = await request(app).get('/api/plans?includeInactive=true').set(...bearer(token));
    assert.equal(res.status, 200);
    for (const plan of res.body.data.plans) {
      assert.equal(plan.IsActive, 1);
    }
  }
});

test('POST /api/plans (admin) ignores isActive on create — mass-assignment is blocked', async (t) => {
  if (!dbUp) return t.skip('database not available');
  // Sending isActive:false must NOT create an inactive plan; deactivation is DELETE-only.
  const res = await request(app)
    .post('/api/plans')
    .set(...bearer(adminToken))
    .send({ name: 'Mass Assign Probe', price: 5, isActive: false });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.plan.IsActive, 1); // isActive was stripped — plan is active
  createdPlanIds.push(res.body.data.plan.PlanID);
});

test('PATCH / DELETE on a missing plan → 404 for an admin', async (t) => {
  if (!dbUp) return t.skip('database not available');
  const patch = await request(app).patch('/api/plans/999999').set(...bearer(adminToken)).send({ price: 5 });
  assert.equal(patch.status, 404);
  const del = await request(app).delete('/api/plans/999999').set(...bearer(adminToken));
  assert.equal(del.status, 404);
});
