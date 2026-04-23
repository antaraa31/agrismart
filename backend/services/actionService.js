/**
 * ACTION SYSTEM
 * Responsible for taking real-world actions based on the Decision Engine's highly-structured output.
 */

const getStatusEmoji = (status) => {
  if (status === 'CRITICAL') return '🔴';
  if (status === 'WARNING') return '🟡';
  return '🟢';
};

const executeActions = (decisions) => {
  if (!decisions || decisions.length === 0) return;

  console.log(`\n=== [ACTION SYSTEM] Generating ${decisions.length} Intelligence Reports ===\n`);

  decisions.forEach((decision) => {
    const emoji = getStatusEmoji(decision.status);
    
    console.log(`${emoji} SYSTEM STATUS: ${decision.status}`);
    console.log(`Location: ${decision.location}`);
    console.log(`Crop: ${decision.crop}\n`);
    
    console.log(`Detected Risk: ${decision.detectedThreat}`);
    console.log(`Confidence: ${decision.confidence}\n`);
    
    console.log(`Why this recommendation:`);
    console.log(`${decision.reasoning}\n`);
    
    console.log(`Recommended Actions:`);
    decision.actions.forEach(act => console.log(`- ${act}`));
    
    // Convert UTC to local time string for display (e.g. 10:32 AM)
    const timeString = new Date(decision.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    console.log(`\nLast Updated: ${timeString}`);
    
    console.log(`\n----------------------------------------------------\n`);
  });
};

module.exports = {
  executeActions
};
