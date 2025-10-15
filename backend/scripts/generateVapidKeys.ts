/**
 * Script to generate VAPID keys for push notifications
 * Run with: npx tsx backend/scripts/generateVapidKeys.ts
 */

import webpush from 'web-push';

console.log('Generating VAPID keys for push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated Successfully!\n');
console.log('Add these to your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:support@smartq.com');
console.log('\nAlso add the public key to your frontend .env file:');
console.log('VITE_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
