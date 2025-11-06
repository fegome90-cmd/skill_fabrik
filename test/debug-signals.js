/**
 * Debug script to verify signal ordering logic
 */

const signals = [
  { id: 'intent-match', cost: 3, strength: 0.9 },
  { id: 'context-match', cost: 2, strength: 0.7 },
  { id: 'file-match', cost: 4, strength: 0.8 }
];

console.log('Original signals:');
signals.forEach(s => {
  console.log(`  ${s.id}: strength=${s.strength}, cost=${s.cost}, ratio=${(s.strength / s.cost).toFixed(3)}`);
});

const optimized = signals.sort((a, b) => (b.strength / b.cost) - (a.strength / a.cost));

console.log('\nOptimized signals:');
optimized.forEach((s, index) => {
  console.log(`  ${index + 1}. ${s.id}: strength=${s.strength}, cost=${s.cost}, ratio=${(s.strength / s.cost).toFixed(3)}`);
});

console.log('\nFirst signal:', optimized[0]);