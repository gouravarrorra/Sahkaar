import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/config/db.js';

const SALT_ROUNDS = 12;

/**
 * Seeds the database with data migrated from the frontend mockData.js.
 * This ensures the frontend continues to work with real data.
 */
async function seed() {
  console.log('🌱 Seeding SAHKAAR database...\n');

  // ═══ COMMUNITY ═══
  const community = await prisma.community.upsert({
    where: { id: 'C001' },
    update: {},
    create: {
      id: 'C001',
      name: 'Chandigarh Workers Cooperative',
      description: 'First SAHKAAR cooperative community in Chandigarh',
      location: 'Chandigarh, India',
    },
  });
  console.log('✅ Community: C001 — Chandigarh Workers Cooperative');

  // ═══ SERVICES (from serviceCategories + serviceSubTypes) ═══
  const services = [
    { id: 'electrician', name: 'Electrician', label: 'electrician', icon: 'Zap', subTypes: ['Wiring Repair', 'Switch/Socket Repair', 'Fan Installation', 'Lighting Setup', 'Other'] },
    { id: 'plumber', name: 'Plumber', label: 'plumber', icon: 'Wrench', subTypes: ['Tap Repair', 'Pipe Repair', 'Leakage Repair', 'Installation', 'Other'] },
    { id: 'carpenter', name: 'Carpenter', label: 'carpenter', icon: 'Hammer', subTypes: ['Furniture Repair', 'Door/Window Repair', 'Custom Furniture', 'Cabinet Work', 'Other'] },
    { id: 'painter', name: 'Painter', label: 'painter', icon: 'Paintbrush', subTypes: ['Wall Painting', 'Touch Up', 'Waterproofing', 'Texture Painting', 'Other'] },
    { id: 'domestic_helper', name: 'Domestic Helper', label: 'domesticHelper', icon: 'Home', subTypes: ['Cooking', 'House Cleaning', 'Laundry', 'Daily Help', 'Other'] },
    { id: 'caregiver', name: 'Caregiver', label: 'caregiver', icon: 'HeartHandshake', subTypes: ['Elderly Care', 'Child Care', 'Patient Care', 'Other'] },
    { id: 'driver', name: 'Driver', label: 'driver', icon: 'Car', subTypes: ['Local Driving', 'Outstation', 'Daily Commute', 'Other'] },
    { id: 'gardener', name: 'Gardener', label: 'gardener', icon: 'Sprout', subTypes: ['Lawn Care', 'Plant Care', 'Garden Setup', 'Tree Trimming', 'Other'] },
    { id: 'cleaner', name: 'Cleaner', label: 'cleaner', icon: 'SprayCan', subTypes: ['Deep Cleaning', 'Bathroom Cleaning', 'Kitchen Cleaning', 'Sofa/Carpet Cleaning', 'Other'] },
    { id: 'technician', name: 'Technician', label: 'technician', icon: 'Settings', subTypes: ['AC Repair', 'Appliance Repair', 'TV Repair', 'Computer Repair', 'Other'] },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: {},
      create: {
        id: svc.id,
        name: svc.name,
        label: svc.label,
        icon: svc.icon,
      },
    });

    for (const stName of svc.subTypes) {
      await prisma.serviceSubType.upsert({
        where: { serviceId_name: { serviceId: svc.id, name: stName } },
        update: {},
        create: { serviceId: svc.id, name: stName },
      });
    }
  }
  console.log('✅ Services: 10 service categories with sub-types');

  // ═══ PRICE BANDS (initial — from context defaults) ═══
  const priceBands = [
    { serviceId: 'electrician', min: 200, ref: 250, max: 325 },
    { serviceId: 'plumber', min: 240, ref: 300, max: 390 },
    { serviceId: 'carpenter', min: 280, ref: 350, max: 455 },
    { serviceId: 'painter', min: 320, ref: 400, max: 520 },
    { serviceId: 'domestic_helper', min: 160, ref: 200, max: 260 },
    { serviceId: 'caregiver', min: 240, ref: 300, max: 390 },
    { serviceId: 'driver', min: 200, ref: 250, max: 325 },
    { serviceId: 'gardener', min: 160, ref: 200, max: 260 },
    { serviceId: 'cleaner', min: 200, ref: 250, max: 325 },
    { serviceId: 'technician', min: 240, ref: 300, max: 390 },
  ];

  for (const band of priceBands) {
    await prisma.priceBand.upsert({
      where: { communityId_serviceId: { communityId: 'C001', serviceId: band.serviceId } },
      update: {},
      create: {
        communityId: 'C001',
        serviceId: band.serviceId,
        minimum: band.min,
        reference: band.ref,
        maximum: band.max,
        effectiveDate: '2026-01-01',
        approvedBy: 'A001',
      },
    });
  }
  console.log('✅ Price Bands: 10 governed price ranges');

  // ═══ ADMIN ═══
  const adminHash = await bcrypt.hash('admin123', SALT_ROUNDS);
  await prisma.admin.upsert({
    where: { id: 'A001' },
    update: {},
    create: {
      id: 'A001',
      communityId: 'C001',
      name: 'Coordinator Singh',
      email: 'admin@sahkaar.coop',
      passwordHash: adminHash,
      mobile: '+91 99887 76655',
      role: 'admin',
    },
  });
  console.log('✅ Admin: A001 — admin@sahkaar.coop / admin123');

  // Create a reviewer (for four-eyes)
  const reviewerHash = await bcrypt.hash('reviewer123', SALT_ROUNDS);
  await prisma.admin.upsert({
    where: { id: 'A002' },
    update: {},
    create: {
      id: 'A002',
      communityId: 'C001',
      name: 'Reviewer Kaur',
      email: 'reviewer@sahkaar.coop',
      passwordHash: reviewerHash,
      mobile: '+91 99887 76656',
      role: 'reviewer',
    },
  });
  console.log('✅ Reviewer: A002 — reviewer@sahkaar.coop / reviewer123');

  // ═══ USER ═══
  const userHash = await bcrypt.hash('user123', SALT_ROUNDS);
  await prisma.user.upsert({
    where: { id: 'U10482' },
    update: {},
    create: {
      id: 'U10482',
      name: 'Amit Sharma',
      mobile: '+91 98765 43210',
      passwordHash: userHash,
    },
  });
  console.log('✅ User: U10482 — +91 98765 43210 / user123');

  // ═══ WORKERS ═══
  const workerHash = await bcrypt.hash('worker123', SALT_ROUNDS);

  const workerData = [
    {
      id: 'W10245', name: 'Ravi Kumar', mobile: '+91 87654 32109', email: 'ravi.kumar@gmail.com',
      skills: ['plumber', 'electrician'], rating: 4.8, reviewCount: 31, totalEarnings: 12450, monthEarnings: 4800,
      baseLocation: 'Sector 22, Chandigarh', serviceRadius: 15,
      availability: {
        monday: { start: '09:00', end: '18:00', off: false },
        tuesday: { start: '10:00', end: '19:00', off: false },
        wednesday: { start: '09:00', end: '18:00', off: false },
        thursday: { start: '09:00', end: '18:00', off: true },
        friday: { start: '09:00', end: '18:00', off: false },
        saturday: { start: '10:00', end: '14:00', off: false },
        sunday: { start: '09:00', end: '18:00', off: true },
      },
    },
    {
      id: 'W10312', name: 'Sunil Verma', mobile: '+91 76543 21098', email: 'sunil.verma@gmail.com',
      skills: ['plumber'], rating: 4.9, reviewCount: 31, totalEarnings: 18200, monthEarnings: 5600,
      baseLocation: 'Sector 35, Chandigarh', serviceRadius: 12,
      availability: {
        monday: { start: '08:00', end: '17:00', off: false },
        tuesday: { start: '08:00', end: '17:00', off: false },
        wednesday: { start: '08:00', end: '17:00', off: false },
        thursday: { start: '08:00', end: '17:00', off: false },
        friday: { start: '08:00', end: '17:00', off: false },
        saturday: { start: '09:00', end: '13:00', off: false },
        sunday: { start: '08:00', end: '17:00', off: true },
      },
    },
    {
      id: 'W10198', name: 'Deepak Singh', mobile: '+91 65432 10987', email: 'deepak.s@gmail.com',
      skills: ['plumber', 'carpenter'], rating: 0, reviewCount: 0, totalEarnings: 3200, monthEarnings: 1400,
      baseLocation: 'Sector 17, Chandigarh', serviceRadius: 10,
      availability: {
        monday: { start: '09:00', end: '18:00', off: false },
        tuesday: { start: '09:00', end: '18:00', off: false },
        wednesday: { start: '09:00', end: '18:00', off: false },
        thursday: { start: '09:00', end: '18:00', off: false },
        friday: { start: '09:00', end: '18:00', off: false },
        saturday: { start: '09:00', end: '18:00', off: true },
        sunday: { start: '09:00', end: '18:00', off: true },
      },
    },
  ];

  for (const w of workerData) {
    const worker = await prisma.worker.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id,
        communityId: 'C001',
        name: w.name,
        mobile: w.mobile,
        email: w.email,
        passwordHash: workerHash,
        baseLocation: w.baseLocation,
        serviceRadius: w.serviceRadius,
        verificationStatus: 'approved',
        rating: w.rating,
        reviewCount: w.reviewCount,
        totalEarnings: w.totalEarnings,
        monthEarnings: w.monthEarnings,
      },
    });

    // Skills
    for (const skillId of w.skills) {
      await prisma.workerSkill.upsert({
        where: { workerId_serviceId: { workerId: w.id, serviceId: skillId } },
        update: {},
        create: { workerId: w.id, serviceId: skillId, level: 'advanced' },
      });
    }

    // Availability
    for (const [day, schedule] of Object.entries(w.availability)) {
      await prisma.workerAvailability.upsert({
        where: { workerId_dayOfWeek: { workerId: w.id, dayOfWeek: day } },
        update: {},
        create: {
          workerId: w.id,
          dayOfWeek: day,
          startTime: schedule.start,
          endTime: schedule.end,
          isOff: schedule.off,
        },
      });
    }

    console.log(`✅ Worker: ${w.id} — ${w.mobile} / worker123`);
  }

  // ═══ BOOKINGS (from mockBookings) ═══
  const bookings = [
    {
      id: 'B102938', userId: 'U10482', workerId: 'W10245', serviceId: 'plumber', subType: 'leakage_repair',
      description: 'Bathroom tap is continuously leaking.', date: '2026-09-18', time: '17:00',
      house: '42-B', street: 'Sector 22, Near Gurudwara', city: 'Chandigarh', state: 'Chandigarh', pin: '160022',
      status: 'confirmed', serviceCharge: 300, travelDistance: 4.2, travelCost: 80,
      total: 650, paymentStatus: 'paid', rating: 5, review: 'Very professional and quick service.',
      materials: [{ name: 'Tap Washer', quantity: 2, unitCost: 40, totalCost: 80 }, { name: 'Flexible Pipe', quantity: 1, unitCost: 230, totalCost: 230 }],
    },
    {
      id: 'B102845', userId: 'U10482', workerId: 'W10312', serviceId: 'electrician', subType: 'switch_repair',
      description: 'Two switches in the living room are not working.', date: '2026-09-20', time: '10:00',
      house: '42-B', street: 'Sector 22, Near Gurudwara', city: 'Chandigarh', state: 'Chandigarh', pin: '160022',
      status: 'worker_selected', serviceCharge: 250, travelDistance: 0, travelCost: 0,
      total: 0, paymentStatus: 'pending', rating: null, review: null, materials: [],
    },
    {
      id: 'B102710', userId: 'U10482', workerId: 'W10245', serviceId: 'plumber', subType: 'pipe_repair',
      description: 'Kitchen sink pipe is broken.', date: '2026-09-10', time: '14:00',
      house: '42-B', street: 'Sector 22, Near Gurudwara', city: 'Chandigarh', state: 'Chandigarh', pin: '160022',
      status: 'completed', serviceCharge: 400, travelDistance: 3.8, travelCost: 70,
      total: 575, paymentStatus: 'paid', rating: 4, review: 'Good service, was a bit late.',
      materials: [{ name: 'PVC Pipe 1ft', quantity: 2, unitCost: 60, totalCost: 120 }, { name: 'Pipe Clamp', quantity: 3, unitCost: 45, totalCost: 135 }],
    },
    {
      id: 'B103001', userId: 'U10482', workerId: 'W10245', serviceId: 'electrician', subType: 'fan_installation',
      description: 'Ceiling fan in bedroom is making noise and needs replacement.', date: '2026-09-18', time: '14:00',
      house: '42-B', street: 'Sector 22, Near Gurudwara', city: 'Chandigarh', state: 'Chandigarh', pin: '160022',
      status: 'in_progress', serviceCharge: 250, travelDistance: 3.2, travelCost: 58,
      total: 0, paymentStatus: 'pending', rating: null, review: null, materials: [],
    },
    {
      id: 'B103045', userId: 'U10482', workerId: 'W10312', serviceId: 'plumber', subType: 'tap_repair',
      description: 'Kitchen sink tap handle is loose and dripping.', date: '2026-09-18', time: '11:00',
      house: '42-B', street: 'Sector 22, Near Gurudwara', city: 'Chandigarh', state: 'Chandigarh', pin: '160022',
      status: 'worker_done', serviceCharge: 300, travelDistance: 4.1, travelCost: 74,
      total: 524, paymentStatus: 'pending', rating: null, review: null,
      materials: [{ name: 'Tap Handle', quantity: 1, unitCost: 120, totalCost: 120 }, { name: 'Teflon Tape', quantity: 2, unitCost: 30, totalCost: 60 }],
    },
  ];

  for (const b of bookings) {
    const materialTotal = b.materials.reduce((s, m) => s + m.totalCost, 0);

    await prisma.booking.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        communityId: 'C001',
        userId: b.userId,
        workerId: b.workerId,
        serviceId: b.serviceId,
        subType: b.subType,
        description: b.description,
        date: b.date,
        time: b.time,
        locationHouse: b.house,
        locationStreet: b.street,
        locationCity: b.city,
        locationState: b.state,
        locationPin: b.pin,
        locationDisplay: `${b.house}, ${b.street}, ${b.city}`,
        status: b.status,
        serviceCharge: b.serviceCharge,
        travelDistance: b.travelDistance,
        travelCost: b.travelCost,
        materialTotal,
        total: b.total,
        paymentStatus: b.paymentStatus,
        rating: b.rating,
        review: b.review,
        priceSource: 'SAHKAAR_GOVERNED',
      },
    });

    // Materials
    for (const m of b.materials) {
      await prisma.materialItem.create({
        data: {
          bookingId: b.id,
          name: m.name,
          quantity: m.quantity,
          unitCost: m.unitCost,
          totalCost: m.totalCost,
          addedBy: b.workerId,
        },
      }).catch(() => {}); // Skip if exists
    }

    // Status history
    await prisma.bookingStatusHistory.create({
      data: { bookingId: b.id, toStatus: b.status, changedBy: 'system', changedByRole: 'system' },
    }).catch(() => {});

    console.log(`✅ Booking: ${b.id} — ${b.serviceId} (${b.status})`);
  }

  // ═══ INSURANCE PLANS ═══
  const planA = await prisma.insurancePlan.upsert({
    where: { id: 'plan-a' },
    update: {},
    create: { id: 'plan-a', communityId: 'C001', name: 'Plan A', coverage: 50000, monthlyPremium: 60 },
  });
  const planB = await prisma.insurancePlan.upsert({
    where: { id: 'plan-b' },
    update: {},
    create: { id: 'plan-b', communityId: 'C001', name: 'Plan B', coverage: 100000, monthlyPremium: 100 },
  });
  console.log('✅ Insurance Plans: Plan A (₹60/mo), Plan B (₹100/mo)');

  // ═══ WELFARE RULE ═══
  await prisma.welfareRule.create({
    data: { communityId: 'C001', percentage: 2.0, effectiveDate: '2026-01-01', approvedBy: 'A001' },
  }).catch(() => {});
  console.log('✅ Welfare Rule: 2% on service charge');

  // ═══ TRAVEL CONFIG ═══
  await prisma.travelConfig.create({
    data: { communityId: 'C001', ratePerKm: 18, effectiveDate: '2026-01-01', approvedBy: 'A001' },
  }).catch(() => {});
  console.log('✅ Travel Config: ₹18/km');

  // ═══ ALGORITHM VERSION ═══
  await prisma.pricingAlgorithmVersion.create({
    data: {
      communityId: 'C001',
      version: '1.0',
      effectiveDate: '2026-01-01',
      changeSummary: 'Initial algorithm parameters',
      approver: 'A001',
      parameters: JSON.stringify({
        historicalWeight: 0.30, complexityWeight: 0.15,
        workerProposalWeight: 0.25, consumerFeedbackWeight: 0.15,
        marketConditionWeight: 0.15, rangeTolerance: 0.15,
      }),
    },
  }).catch(() => {});
  console.log('✅ Pricing Algorithm: v1.0');

  // ═══ PRICING COMMITTEE ═══
  await prisma.pricingCommittee.create({
    data: {
      communityId: 'C001',
      maxMembers: 3,
      rotationDays: 180,
      members: {
        create: [
          { workerId: 'W10245', startDate: '2026-01-01' },
          { workerId: 'W10312', startDate: '2026-01-01' },
        ],
      },
    },
  }).catch(() => {});
  console.log('✅ Pricing Committee: 2 worker members');

  // ═══ MOCK NOTIFICATIONS ═══
  const notifications = [
    { userId: 'U10482', type: 'booking', title: 'Worker Accepted Your Request', body: 'Ravi Kumar accepted your plumbing request.', communityId: 'C001' },
    { userId: 'U10482', type: 'booking', title: 'Booking Confirmed', body: 'Your booking B102938 has been confirmed.', communityId: 'C001', read: true },
    { workerId: 'W10245', type: 'booking', title: 'New Service Request', body: 'Plumbing request in Sector 22, 4.2 km away.', communityId: 'C001' },
    { workerId: 'W10245', type: 'payment', title: 'Payment Received', body: '₹650 received for booking B102938.', communityId: 'C001', read: true },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n }).catch(() => {});
  }
  console.log('✅ Notifications: 4 seeded');

  console.log('\n🎉 Seed complete! All mock data has been migrated to the database.\n');
  console.log('📋 Login credentials:');
  console.log('   Admin:    admin@sahkaar.coop / admin123');
  console.log('   Reviewer: reviewer@sahkaar.coop / reviewer123');
  console.log('   User:     +91 98765 43210 / user123');
  console.log('   Workers:  +91 87654 32109 / worker123 (Ravi)');
  console.log('             +91 76543 21098 / worker123 (Sunil)');
  console.log('             +91 65432 10987 / worker123 (Deepak)\n');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
