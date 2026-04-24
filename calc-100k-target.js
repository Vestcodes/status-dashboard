const targetPointsPerMinute = 100000;
const pollsPerMinute = 12; // polling every 5 seconds
const avgPointsPerEverything = 22; // points per $everything operation

const targetPointsPerSweep = targetPointsPerMinute / pollsPerMinute;
const requiredPatients = Math.ceil(targetPointsPerSweep / avgPointsPerEverything);

console.log(`Target points per minute: ${targetPointsPerMinute.toLocaleString()}`);
console.log(`Target points per sweep (12x per min): ${targetPointsPerSweep.toLocaleString()}`);
console.log(`Required patients to poll: ${requiredPatients}`);

