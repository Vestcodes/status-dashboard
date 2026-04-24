// 33,000 patients * 22 points average
const totalPatients = 33000;
const avgPointsPerPatient = 22; // based on our earlier measurement

const singleSweepCost = totalPatients * avgPointsPerPatient;
const pollsPerMinute = 12; // Every 5 seconds

const pointsBurnedPerMinute = singleSweepCost * pollsPerMinute;
const pointsBurnedPerHour = pointsBurnedPerMinute * 60;
const pointsBurnedPerDay = pointsBurnedPerHour * 24;

console.log(`Single $everything sweep across all patients: ${singleSweepCost.toLocaleString()} points`);
console.log(`Burn per minute (polling 12x): ${pointsBurnedPerMinute.toLocaleString()} points`);
console.log(`Burn per hour: ${pointsBurnedPerHour.toLocaleString()} points`);
console.log(`Burn per day: ${pointsBurnedPerDay.toLocaleString()} points`);
