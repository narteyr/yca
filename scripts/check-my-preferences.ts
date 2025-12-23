import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Check your current user preferences
 * Run this to see what job criteria will match
 */
export async function checkMyPreferences() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.log('❌ Not logged in');
    return;
  }

  console.log('🔍 Checking preferences for:', user.email);
  console.log('User ID:', user.uid);

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.log('❌ User document not found');
    return;
  }

  const userData = userSnap.data();
  console.log('\n📋 Your Preferences:');
  console.log('─────────────────────────────────');
  console.log('Push Token:', userData.pushToken ? '✅ Set' : '❌ Not set');
  console.log('Notifications Enabled:', userData.preferences?.notificationsEnabled !== false ? '✅ Yes' : '❌ No');
  console.log('\n🎯 Job Matching Criteria:');
  console.log('─────────────────────────────────');
  console.log('Remote Only:', userData.preferences?.remoteOnly || false);
  console.log('Visa Sponsorship Required:', userData.preferences?.visaSponsorshipRequired || false);
  console.log('Preferred Locations:', userData.preferences?.preferredLocations || 'None');
  console.log('Job Types:', userData.preferences?.jobTypes || 'None');
  console.log('Skills:', userData.preferences?.skills || 'None');
  console.log('Experience Level:', userData.preferences?.experienceLevel || 'None');
  console.log('Graduation Year:', userData.preferences?.graduationYear || 'None');
  console.log('Student Status:', userData.preferences?.studentStatus || 'None');

  console.log('\n✅ To receive notifications, add a job with:');
  console.log('─────────────────────────────────');

  const jobTemplate: any = {
    source: 'startup',
    title: 'Software Engineering Intern',
    company: 'Test Startup',
    job_type: 'Internship',
    description: 'Great opportunity',
    requirements: 'CS student',
    salary: '$50k',
    url: 'https://example.com',
    posted_date: new Date().toISOString().split('T')[0],
    via: 'test',
    benefits: [],
    responsibilities: [],
    thumbnail: '',
  };

  // Match remote preference
  if (userData.preferences?.remoteOnly) {
    jobTemplate.remote = true;
    jobTemplate.location = 'Remote';
    console.log('✓ remote: true');
    console.log('✓ location: "Remote"');
  } else {
    jobTemplate.remote = false;
    jobTemplate.location = userData.preferences?.preferredLocations?.[0] || 'San Francisco, CA';
    console.log('✓ remote: false (or true)');
    console.log(`✓ location: "${jobTemplate.location}"`);
  }

  // Match visa preference
  if (userData.preferences?.visaSponsorshipRequired) {
    jobTemplate.sponsors_visa = true;
    console.log('✓ sponsors_visa: true');
  } else {
    jobTemplate.sponsors_visa = false;
    console.log('✓ sponsors_visa: false (or true)');
  }

  // Match job type
  if (userData.preferences?.jobTypes && userData.preferences.jobTypes.length > 0) {
    jobTemplate.job_type = userData.preferences.jobTypes[0];
    console.log(`✓ job_type: "${jobTemplate.job_type}"`);
  }

  // Match location
  if (userData.preferences?.preferredLocations && userData.preferences.preferredLocations.length > 0 && !userData.preferences?.remoteOnly) {
    jobTemplate.location = userData.preferences.preferredLocations[0];
  }

  console.log('\n📄 Full Job Template (copy to Firestore):');
  console.log('─────────────────────────────────');
  console.log(JSON.stringify(jobTemplate, null, 2));

  return {
    preferences: userData.preferences,
    jobTemplate,
  };
}

// Usage in your app:
// import { checkMyPreferences } from './scripts/check-my-preferences';
// checkMyPreferences();
