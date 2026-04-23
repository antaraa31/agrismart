const express = require('express');
const router = express.Router();
const { runAgentCycle } = require('../services/agentService');
const { getDecisionMemory } = require('../services/decisionEngine');

// POST /api/agent/run
// Manually triggers a cycle of the background agent loop
router.post('/run', async (req, res) => {
  try {
    // Manual trigger bypasses the 2h cooldown
    await runAgentCycle(true);
    
    res.status(200).json({
      status: 'success',
      message: 'Autonomous agent cycle completed successfully.'
    });
  } catch (error) {
    console.error('Agent Run Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to run autonomous agent cycle.'
    });
  }
});

// GET /api/agent/logs
// Retrieves the memory state of the agent's recent decisions/actions
router.get('/logs', (req, res) => {
  try {
    const memory = getDecisionMemory();
    res.status(200).json({
      status: 'success',
      data: memory
    });
  } catch (error) {
    console.error('Agent Logs Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve agent logs.'
    });
  }
});

module.exports = router;
