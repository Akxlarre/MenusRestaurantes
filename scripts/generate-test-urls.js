#!/usr/bin/env node

/**
 * AION Loyalty System - Test URL Generator
 * 
 * Generates URLs for 5 test QR devices (PROTO_001 through PROTO_005)
 * These URLs can be converted to QR codes for MVP testing
 * 
 * Usage:
 *   node generate-test-urls.js
 *   node generate-test-urls.js --base-url https://your-edge-function-url.com
 */

const devices = [
    { id: 'PROTO_001', label: 'Main Counter (Garzón 1)' },
    { id: 'PROTO_002', label: 'Bar Area (Garzón 2)' },
    { id: 'PROTO_003', label: 'Takeout/Delivery' },
    { id: 'PROTO_004', label: 'Manager Device (Testing)' },
    { id: 'PROTO_005', label: 'Spare' },
];

// Parse command line args
const args = process.argv.slice(2);
const baseUrlArg = args.find(arg => arg.startsWith('--base-url='));
const baseUrl = baseUrlArg
    ? baseUrlArg.split('=')[1]
    : 'https://[YOUR_PROJECT].supabase.co/functions/v1/verify-tap';

console.log('\n🎴 AION Loyalty System - Test Device URLs\n');
console.log('═'.repeat(70));
console.log(`Base URL: ${baseUrl}`);
console.log('Mode: DEV (QR Mock)\n');
console.log('═'.repeat(70));

devices.forEach((device, index) => {
    const url = `${baseUrl}?uid=${device.id}&mode=dev`;

    console.log(`\n📱 Device ${index + 1}: ${device.id}`);
    console.log(`   Purpose: ${device.label}`);
    console.log(`   URL: ${url}`);
    console.log(`   QR: Use the HTML generator or https://qr.io/?url=${encodeURIComponent(url)}`);
});

console.log('\n' + '═'.repeat(70));
console.log('\n📋 Next Steps:\n');
console.log('1. Copy these URLs to generate-qr-cards.html');
console.log('2. Open generate-qr-cards.html in your browser');
console.log('3. Print the QR codes on black cardstock');
console.log('4. Test by scanning with your smartphone');
console.log('\n⚠️  Security Note: DEV mode URLs are static and reusable.');
console.log('   Only use for controlled testing with trusted staff.\n');

// Export as JSON for automation
const output = {
    baseUrl,
    mode: 'dev',
    devices: devices.map(d => ({
        id: d.id,
        label: d.label,
        url: `${baseUrl}?uid=${d.id}&mode=dev`,
    })),
    generatedAt: new Date().toISOString(),
};

console.log('\n💾 JSON Output:\n');
console.log(JSON.stringify(output, null, 2));
console.log('\n');
