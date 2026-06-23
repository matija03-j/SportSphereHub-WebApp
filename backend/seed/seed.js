/**
 * SportSphere Hub — database seed.
 *
 * Run manually with `npm run seed`. This script is the ONLY thing that creates
 * collections; the application itself never creates them (spec requirement).
 *
 * It will:
 *   1. DROP the existing database (full wipe & rebuild).
 *   2. Explicitly createCollection() for every collection.
 *   3. Create unique / TTL indexes.
 *   4. Insert rich demo data covering every feature of the application.
 */
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sportsphere_hub';

// All demo users share this password (valid per spec regex). Admin uses Admin123!.
const DEMO_PASSWORD = 'Lozinka1!';
const ADMIN_PASSWORD = 'Admin123!';
const hash = (pw) => bcrypt.hashSync(pw, 10);

const COLLECTIONS = [
  'sports',
  'users',
  'facilities',
  'reservations',
  'trainers',
  'trainings',
  'promotions',
  'equipment',
  'orders',
  'teammateads',
  'reviews',
  'passwordresettokens',
];

// Time helpers (relative to "now" so demo data is always meaningful).
const now = new Date();
const hours = (h) => new Date(now.getTime() + h * 3600 * 1000);
const days = (d) => new Date(now.getTime() + d * 24 * 3600 * 1000);
/** A Date set to the next/previous full hour offset by `h` hours from now. */
function hourSlot(h) {
  const d = hours(h);
  d.setMinutes(0, 0, 0);
  return d;
}

async function run() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  console.log(`Connected to ${MONGO_URI}`);

  // 1. Drop everything for a clean rebuild.
  await db.dropDatabase();
  console.log('Dropped existing database.');

  // 2. Create every collection explicitly.
  for (const name of COLLECTIONS) {
    await db.createCollection(name);
  }
  console.log('Created collections:', COLLECTIONS.join(', '));

  // 3. Indexes (unique constraints + TTL for reset tokens).
  await db.collection('sports').createIndex({ name: 1 }, { unique: true });
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('facilities').createIndex({ maticniBroj: 1 }, { unique: true });
  await db.collection('facilities').createIndex({ pib: 1 }, { unique: true });
  await db.collection('passwordresettokens').createIndex({ token: 1 }, { unique: true });
  await db
    .collection('passwordresettokens')
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  console.log('Created indexes.');

  // ---- Sports ----
  const sportNames = ['Fudbal', 'Košarka', 'Tenis', 'Odbojka', 'Rukomet', 'Mali fudbal'];
  const sports = sportNames.map((name) => ({ _id: new ObjectId(), name }));
  // References store the sport NAME (the sports collection is just the catalog).
  const S = Object.fromEntries(sports.map((s) => [s.name, s.name]));
  await db.collection('sports').insertMany(sports);

  // ---- Users ----
  const admin = {
    _id: new ObjectId(),
    username: 'admin',
    passwordHash: hash(ADMIN_PASSWORD),
    firstName: 'Sistem',
    lastName: 'Administrator',
    phone: '0600000000',
    email: 'admin@sportsphere.rs',
    profileImage: '/uploads/default-avatar.svg',
    sports: [],
    role: 'admin',
    status: 'approved',
  };

  function athlete(username, first, last, email, sportList, status = 'approved') {
    return {
      _id: new ObjectId(),
      username,
      passwordHash: hash(DEMO_PASSWORD),
      firstName: first,
      lastName: last,
      phone: '06' + Math.floor(10000000 + Math.random() * 89999999),
      email,
      profileImage: '/uploads/default-avatar.svg',
      sports: sportList,
      role: 'athlete',
      status,
    };
  }
  function employee(username, first, last, email, status = 'approved') {
    return {
      _id: new ObjectId(),
      username,
      passwordHash: hash(DEMO_PASSWORD),
      firstName: first,
      lastName: last,
      phone: '06' + Math.floor(10000000 + Math.random() * 89999999),
      email,
      profileImage: '/uploads/default-avatar.svg',
      sports: [],
      role: 'employee',
      status,
    };
  }

  const a1 = athlete('marko', 'Marko', 'Marković', 'marko@example.com', [S['Fudbal'], S['Tenis']]);
  const a2 = athlete('jovana', 'Jovana', 'Jovanović', 'jovana@example.com', [S['Košarka'], S['Odbojka']]);
  const a3 = athlete('nikola', 'Nikola', 'Nikolić', 'nikola@example.com', [S['Tenis'], S['Mali fudbal']]);
  const a4 = athlete('ana', 'Ana', 'Anić', 'ana@example.com', [S['Odbojka'], S['Rukomet']]);
  const aPending = athlete('petar', 'Petar', 'Petrović', 'petar@example.com', [S['Fudbal']], 'pending');

  const e1 = employee('milan', 'Milan', 'Milić', 'milan@example.com'); // SC Beograd (1st)
  const e2 = employee('dragan', 'Dragan', 'Dragić', 'dragan@example.com'); // SC Beograd (2nd) -> shows max 2
  const e3 = employee('sara', 'Sara', 'Sarić', 'sara@example.com'); // Novi Sad
  const ePending = employee('goran', 'Goran', 'Gorić', 'goran@example.com', 'pending'); // pending

  const athletes = [a1, a2, a3, a4, aPending];
  const employees = [e1, e2, e3, ePending];
  await db.collection('users').insertMany([admin, ...athletes, ...employees]);

  // ---- Facilities (with embedded resources) ----
  function res(name, type, capacity, sport, desc = '') {
    return {
      _id: new ObjectId(),
      name,
      type,
      capacity,
      equipmentDescription: desc,
      sport,
    };
  }

  const fBeograd = {
    _id: new ObjectId(),
    name: 'Sportski centar Beograd',
    city: 'Beograd',
    address: 'Bulevar oslobođenja 12',
    maticniBroj: '12345678',
    pib: '123456789',
    employees: [e1.username, e2.username], // two employees -> demonstrates the max-2 rule
    status: 'approved',
    pricePerHour: 2000,
    workingHours: { open: '08:00', close: '22:00' },
    maxNoShows: 3,
    sports: [S['Fudbal'], S['Tenis'], S['Košarka']],
    description: 'Moderan sportski centar u centru grada sa terenima i halama.',
    images: [],
    likes: [a1.username, a2.username, a3.username],
    dislikes: [],
    resources: [
      res('Teren 1', 'open', 10, S['Fudbal'], 'Veštačka trava, reflektori.'),
      res('Teniski teren 2', 'closed', 4, S['Tenis'], 'Šljaka, klima.'),
      res('Hala A', 'hall', 12, S['Košarka'], 'Parket, tribine za 200 ljudi.'),
    ],
  };

  const fNoviSad = {
    _id: new ObjectId(),
    name: 'Arena Novi Sad',
    city: 'Novi Sad',
    address: 'Futoška 45',
    maticniBroj: '23456789',
    pib: '234567890',
    employees: [e3.username],
    status: 'approved',
    pricePerHour: 1800,
    workingHours: { open: '09:00', close: '23:00' },
    maxNoShows: 2,
    sports: [S['Odbojka'], S['Rukomet'], S['Mali fudbal']],
    description: 'Višenamenska arena sa zatvorenim halama.',
    images: [],
    likes: [a2.username, a4.username],
    dislikes: [a1.username],
    resources: [
      res('Teren otvoreni', 'open', 8, S['Mali fudbal'], 'Beton, ograda.'),
      res('Hala 1', 'hall', 14, S['Odbojka'], 'Parket.'),
      res('Hala 2', 'closed', 10, S['Rukomet'], 'Guma, golovi.'),
    ],
  };

  const fNis = {
    _id: new ObjectId(),
    name: 'Čair Niš',
    city: 'Niš',
    address: 'Šumatovačka 1',
    maticniBroj: '34567890',
    pib: '345678901',
    employees: [],
    status: 'approved',
    pricePerHour: 1500,
    workingHours: { open: '08:00', close: '21:00' },
    maxNoShows: 3,
    sports: [S['Tenis'], S['Košarka']],
    description: 'Sportski kompleks Čair.',
    images: [],
    likes: [a3.username],
    dislikes: [],
    resources: [
      res('Teniski teren A', 'closed', 4, S['Tenis'], 'Hard podloga.'),
      res('Otvoreni teren', 'open', 6, S['Košarka'], 'Asfalt.'),
    ],
  };

  // Pending facility (not visible to public until admin approves).
  const fPending = {
    _id: new ObjectId(),
    name: 'Kragujevac Sport',
    city: 'Kragujevac',
    address: 'Kralja Petra 9',
    maticniBroj: '45678901',
    pib: '456789012',
    employees: [ePending.username],
    status: 'pending',
    pricePerHour: 1600,
    workingHours: { open: '08:00', close: '22:00' },
    maxNoShows: 3,
    sports: [S['Fudbal']],
    description: 'Novi objekat koji čeka odobrenje administratora.',
    images: [],
    likes: [],
    dislikes: [],
    resources: [res('Teren 1', 'open', 10, S['Fudbal'], 'Trava.')],
  };

  const facilities = [fBeograd, fNoviSad, fNis, fPending];
  await db.collection('facilities').insertMany(facilities);

  // ---- Reservations (cover all statuses + cancel windows) ----
  const r = (facility, resource, user, sport, start, durH, status) => ({
    _id: new ObjectId(),
    facility: facility._id,
    resourceId: resource._id,
    user: user.username,
    sport,
    start,
    end: new Date(start.getTime() + durH * 3600 * 1000),
    status,
  });

  const reservations = [
    // Past completed (enables reviews for a1 & a2 at Beograd)
    r(fBeograd, fBeograd.resources[0], a1, S['Fudbal'], hourSlot(-72), 1, 'completed'),
    r(fBeograd, fBeograd.resources[2], a2, S['Košarka'], hourSlot(-48), 1, 'completed'),
    // Past no_show (a3 didn't show up at Niš)
    r(fNis, fNis.resources[0], a3, S['Tenis'], hourSlot(-24), 1, 'no_show'),
    // Currently ongoing / just started -> within 10-min confirm window (started 5 min ago)
    {
      _id: new ObjectId(),
      facility: fBeograd._id,
      resourceId: fBeograd.resources[1]._id,
      user: a3.username,
      sport: S['Tenis'],
      start: new Date(now.getTime() - 5 * 60 * 1000),
      end: new Date(now.getTime() + 55 * 60 * 1000),
      status: 'confirmed',
    },
    // Future confirmed, >12h away (cancellable)
    r(fBeograd, fBeograd.resources[0], a2, S['Fudbal'], hourSlot(36), 1, 'confirmed'),
    // Future pending, >12h away (cancellable, unconfirmed)
    r(fNoviSad, fNoviSad.resources[1], a4, S['Odbojka'], hourSlot(48), 1, 'pending'),
    // Future pending, <12h away (NOT cancellable)
    r(fNoviSad, fNoviSad.resources[0], a1, S['Mali fudbal'], hourSlot(6), 1, 'pending'),
    // A cancelled one
    r(fNis, fNis.resources[1], a2, S['Košarka'], hourSlot(-10), 1, 'cancelled'),
    // More completed for a1 at Novi Sad (so a1 can review Novi Sad too)
    r(fNoviSad, fNoviSad.resources[2], a1, S['Rukomet'], hourSlot(-96), 1, 'completed'),
  ];
  await db.collection('reservations').insertMany(reservations);

  // ---- Trainers ----
  const trainers = [
    { _id: new ObjectId(), name: 'Đorđe Trener', specialization: 'Fudbal — tehnika', facility: fBeograd._id, sport: S['Fudbal'], pricePerHour: 2500, active: true },
    { _id: new ObjectId(), name: 'Milica Tenis', specialization: 'Tenis — početnici', facility: fBeograd._id, sport: S['Tenis'], pricePerHour: 3000, active: true },
    { _id: new ObjectId(), name: 'Stefan Košarka', specialization: 'Košarka — šut', facility: fNis._id, sport: S['Košarka'], pricePerHour: 2200, active: true },
    { _id: new ObjectId(), name: 'Ivana Odbojka', specialization: 'Odbojka — kondicija', facility: fNoviSad._id, sport: S['Odbojka'], pricePerHour: 2000, active: false },
  ];
  await db.collection('trainers').insertMany(trainers);

  // ---- Trainings ----
  const trainings = [
    { _id: new ObjectId(), trainer: trainers[0]._id, user: a1.username, facility: fBeograd._id, sport: S['Fudbal'], start: hourSlot(-50), end: hourSlot(-49), status: 'completed' },
    { _id: new ObjectId(), trainer: trainers[1]._id, user: a3.username, facility: fBeograd._id, sport: S['Tenis'], start: hourSlot(72), end: hourSlot(73), status: 'scheduled' },
    { _id: new ObjectId(), trainer: trainers[2]._id, user: a2.username, facility: fNis._id, sport: S['Košarka'], start: hourSlot(96), end: hourSlot(97), status: 'scheduled' },
  ];
  await db.collection('trainings').insertMany(trainings);

  // ---- Promotions (3 current for homepage + 1 expired) ----
  const promotions = [
    { _id: new ObjectId(), name: 'Letnji popust', facility: fBeograd._id, startDate: days(-5), endDate: days(20), discountType: 'percent', value: 20, sport: S['Fudbal'] },
    { _id: new ObjectId(), name: 'Tenis akcija', facility: fBeograd._id, startDate: days(-2), endDate: days(10), discountType: 'fixed', value: 300, sport: S['Tenis'] },
    { _id: new ObjectId(), name: 'Odbojka vikend', facility: fNoviSad._id, startDate: days(-1), endDate: days(7), discountType: 'percent', value: 15, sport: S['Odbojka'] },
    { _id: new ObjectId(), name: 'Stara promocija', facility: fNis._id, startDate: days(-40), endDate: days(-10), discountType: 'percent', value: 10, sport: S['Košarka'] },
  ];
  await db.collection('promotions').insertMany(promotions);

  // ---- Equipment ----
  const equipment = [
    { _id: new ObjectId(), name: 'Fudbalska lopta', sport: S['Fudbal'], price: 2500, stock: 30, image: '/uploads/default-equipment.svg', facility: fBeograd._id },
    { _id: new ObjectId(), name: 'Kopačke', sport: S['Fudbal'], price: 6000, stock: 12, image: '/uploads/default-equipment.svg', facility: fBeograd._id },
    { _id: new ObjectId(), name: 'Teniski reket', sport: S['Tenis'], price: 9000, stock: 8, image: '/uploads/default-equipment.svg', facility: fBeograd._id },
    { _id: new ObjectId(), name: 'Košarkaška lopta', sport: S['Košarka'], price: 3200, stock: 20, image: '/uploads/default-equipment.svg', facility: fNis._id },
    { _id: new ObjectId(), name: 'Odbojkaška lopta', sport: S['Odbojka'], price: 2800, stock: 15, image: '/uploads/default-equipment.svg', facility: fNoviSad._id },
    { _id: new ObjectId(), name: 'Sportska torba', sport: S['Rukomet'], price: 3500, stock: 0, image: '/uploads/default-equipment.svg', facility: fNoviSad._id },
  ];
  await db.collection('equipment').insertMany(equipment);

  // ---- Orders (all statuses) ----
  const orders = [
    { _id: new ObjectId(), user: a1.username, items: [{ equipment: equipment[0]._id, qty: 2, priceAtOrder: 2500 }], total: 5000, status: 'ordered', createdAt: days(-1) },
    { _id: new ObjectId(), user: a1.username, items: [{ equipment: equipment[2]._id, qty: 1, priceAtOrder: 9000 }], total: 9000, status: 'picked_up', createdAt: days(-7) },
    { _id: new ObjectId(), user: a2.username, items: [{ equipment: equipment[3]._id, qty: 1, priceAtOrder: 3200 }], total: 3200, status: 'cancelled', createdAt: days(-3) },
    { _id: new ObjectId(), user: a3.username, items: [{ equipment: equipment[2]._id, qty: 1, priceAtOrder: 9000 }, { equipment: equipment[0]._id, qty: 1, priceAtOrder: 2500 }], total: 11500, status: 'ordered', createdAt: days(-2) },
    { _id: new ObjectId(), user: a4.username, items: [{ equipment: equipment[4]._id, qty: 3, priceAtOrder: 2800 }], total: 8400, status: 'picked_up', createdAt: days(-12) },
  ];
  await db.collection('orders').insertMany(orders);

  // ---- Teammate ads ----
  const teammateAds = [
    {
      _id: new ObjectId(),
      author: a1.username,
      sport: S['Fudbal'],
      city: 'Beograd',
      date: days(3).toISOString().slice(0, 10),
      timeFrom: '18:00',
      timeTo: '19:00',
      neededPlayers: 3,
      status: 'active',
      joinRequests: [
        { _id: new ObjectId(), user: a3.username, status: 'pending' },
        { _id: new ObjectId(), user: a2.username, status: 'approved' },
      ],
    },
    {
      _id: new ObjectId(),
      author: a2.username,
      sport: S['Košarka'],
      city: 'Niš',
      date: days(5).toISOString().slice(0, 10),
      timeFrom: '20:00',
      timeTo: '21:00',
      neededPlayers: 2,
      status: 'active',
      joinRequests: [],
    },
    {
      _id: new ObjectId(),
      author: a4.username,
      sport: S['Odbojka'],
      city: 'Novi Sad',
      date: days(-2).toISOString().slice(0, 10),
      timeFrom: '17:00',
      timeTo: '18:00',
      neededPlayers: 1,
      status: 'inactive',
      joinRequests: [{ _id: new ObjectId(), user: a1.username, status: 'approved' }],
    },
  ];
  await db.collection('teammateads').insertMany(teammateAds);

  // ---- Reviews (within confirmed-reservation quota) ----
  const reviews = [
    { _id: new ObjectId(), user: a1.username, facility: fBeograd._id, reaction: 'like', comment: 'Odličan teren, preporuka!', createdAt: days(-2) },
    { _id: new ObjectId(), user: a2.username, facility: fBeograd._id, reaction: 'like', comment: 'Sjajna hala za košarku.', createdAt: days(-1) },
    { _id: new ObjectId(), user: a1.username, facility: fNoviSad._id, reaction: 'dislike', comment: 'Moglo bi bolje održavanje.', createdAt: days(-3) },
  ];
  await db.collection('reviews').insertMany(reviews);

  console.log('\nSeed complete. Summary:');
  console.log(`  sports:       ${sports.length}`);
  console.log(`  users:        ${1 + athletes.length + employees.length} (1 admin, ${athletes.length} athletes, ${employees.length} employees)`);
  console.log(`  facilities:   ${facilities.length} (${facilities.filter((f) => f.status === 'approved').length} approved, ${facilities.filter((f) => f.status === 'pending').length} pending)`);
  console.log(`  reservations: ${reservations.length}`);
  console.log(`  trainers:     ${trainers.length}`);
  console.log(`  trainings:    ${trainings.length}`);
  console.log(`  promotions:   ${promotions.length}`);
  console.log(`  equipment:    ${equipment.length}`);
  console.log(`  orders:       ${orders.length}`);
  console.log(`  teammateAds:  ${teammateAds.length}`);
  console.log(`  reviews:      ${reviews.length}`);
  console.log('\nLogin credentials:');
  console.log(`  admin:    admin / ${ADMIN_PASSWORD}  (hidden admin login)`);
  console.log(`  athlete:  marko / ${DEMO_PASSWORD}`);
  console.log(`  employee: milan / ${DEMO_PASSWORD}`);

  await client.close();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
