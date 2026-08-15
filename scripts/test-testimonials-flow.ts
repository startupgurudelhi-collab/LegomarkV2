import { testimonialRepository } from '../server/repositories/testimonial.repository';

async function runTestimonialsAudit() {
  console.log('--- STARTING PHASE 5: REVIEWS & TESTIMONIALS AUDIT ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Initial State & Seed Data
    const initialRes = await testimonialRepository.getAdminTestimonials();
    assert(initialRes.total >= 2, 'Initial testimonials exist (Rahul Sharma, Dr. Priya Nair)');
    assert(initialRes.stats.total >= 2, 'Total stats match count');
    assert(initialRes.stats.published >= 2, 'Published stats count matches');

    // 2. Public Read
    const publicItems = await testimonialRepository.getPublicTestimonials();
    assert(publicItems.length >= 2, 'Public endpoint returns active testimonials');
    assert(publicItems.every((t) => t.isActive), 'All public testimonials are active');

    // 3. Create Testimonial with Native Media
    const created = await testimonialRepository.create({
      clientName: 'Vikramaditya Singhania',
      company: 'Singhania Logistics Ltd',
      designation: 'Managing Director',
      quote: 'Seamless multi-state GST registrations and compliance structuring. Highly recommended corporate team.',
      rating: 5,
      avatarUrl: '/uploads/testimonials/avatar-12345.jpg',
      videoUrl: '/uploads/testimonials/video-12345.mp4',
      isActive: true,
      displayOrder: 99,
    });
    assert(created.id !== undefined && created.id.length > 0, 'Created testimonial with valid ID');
    assert(created.clientName === 'Vikramaditya Singhania', 'Client name matches');
    assert(created.avatarUrl === '/uploads/testimonials/avatar-12345.jpg', 'Native avatar URL saved');
    assert(created.videoUrl === '/uploads/testimonials/video-12345.mp4', 'Native video URL saved');

    // 4. Verify Stats Updated with Video Count
    const statsAfterCreate = await testimonialRepository.getAdminTestimonials();
    assert(statsAfterCreate.stats.withVideo >= 1, 'Stats accurately reflect item with video');

    // 5. Update Testimonial & Toggle Status to Draft
    const updated = await testimonialRepository.update(created.id, {
      quote: 'Updated quote for testing purposes.',
      isActive: false,
    });
    assert(updated !== null && updated.isActive === false, 'Updated testimonial status to draft');
    assert(updated?.quote === 'Updated quote for testing purposes.', 'Updated quote persisted');

    // 6. Verify Public endpoint does not return draft item
    const publicItemsAfterDraft = await testimonialRepository.getPublicTestimonials();
    assert(
      !publicItemsAfterDraft.some((t) => t.id === created.id),
      'Draft testimonial is excluded from public endpoint'
    );

    // 7. Reorder Sequence
    const reordered = await testimonialRepository.updateDisplayOrders([
      { id: created.id, displayOrder: 1 },
    ]);
    assert(reordered === true, 'Reordering sequence succeeds');

    // 8. Delete Testimonial
    const deleted = await testimonialRepository.delete(created.id);
    assert(deleted === true, 'Deleted testimonial successfully');

    // 9. Verify Cleanup
    const finalCheck = await testimonialRepository.getById(created.id);
    assert(finalCheck === null, 'Testimonial removed completely from repository');

    console.log(`\n========================================`);
    console.log(`PHASE 5 TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Audit execution error:', err);
    process.exit(1);
  }
}

runTestimonialsAudit();
