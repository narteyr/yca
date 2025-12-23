import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Add a test job to Firestore to trigger push notification
 * Run this script to test if notifications are working
 */
async function addTestJob() {
  console.log('📝 Adding test job to Firestore...');

  const testJob = {
    source: 'startup',
    title: 'Software Engineering Intern - Test Job',
    company: 'Test Startup Inc',
    location: 'San Francisco, CA',
    remote: false,
    sponsors_visa: false,
    job_type: 'Internship',
    description: 'This is a test job to verify push notifications are working. If you see this notification, everything is set up correctly!',
    requirements: 'Computer Science or related field',
    salary: '$50,000 - $60,000',
    url: 'https://example.com/apply',
    posted_date: '2025-12-23',
    via: 'test',
    benefits: [],
    responsibilities: [],
    thumbnail: '',
    created_at: new Date(),
  };

  try {
    const docRef = await addDoc(collection(db, 'jobs'), testJob);
    console.log('✅ Test job added successfully!');
    console.log('📄 Job ID:', docRef.id);
    console.log('');
    console.log('🔔 Check your phone for a notification in 5-10 seconds!');
    console.log('');
    console.log('📊 To view logs, run:');
    console.log('   firebase functions:log');
    console.log('');
    console.log('Expected logs:');
    console.log('   ✓ New job created: [id] - Software Engineering Intern');
    console.log('   ✓ Processing startup job');
    console.log('   ✓ Found 1 users with push tokens');
    console.log('   ✓ Found 1 users with matching preferences');
    console.log('   ✓ Sent 1 notifications');
  } catch (error) {
    console.error('❌ Error adding test job:', error);
    throw error;
  }
}

// Run the function
addTestJob()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
