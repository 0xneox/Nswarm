# Team Testing Guide

## Setup Instructions

### 1. Local Development
```bash
# Clone the repository
git clone <repo-url>
cd project

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### 2. Team Member Roles

#### Node Operators (2-3 team members)
- Run compute nodes
- Process tasks
- Earn rewards
- Monitor performance

#### Task Submitters (2-3 team members)
- Submit compute tasks
- Verify results
- Test different priorities
- Monitor completion times

#### Network Monitors (1-2 team members)
- Monitor network health
- Track node performance
- Verify security measures
- Report issues

### 3. Test Scenarios

#### Basic Operations
1. Node Registration
```typescript
// Register as a node operator
await computeToken.registerNode({
  stake: 1000,
  capabilities: ['gpu', 'cpu']
});
```

2. Task Submission
```typescript
// Submit test tasks
const task = await taskScheduler.submitTask(
  testData,
  testShader,
  'high'
);
```

3. Result Verification
```typescript
// Verify task results
const result = await computeToken.getTaskResult(task.id);
console.assert(validateResult(result));
```

#### Security Testing
1. Rate Limiting
```typescript
// Test rate limits
for (let i = 0; i < 100; i++) {
  await submitTask(); // Should be throttled
}
```

2. Node Reputation
```typescript
// Monitor reputation changes
const stats = await computeToken.getNodeReputationStats();
```

3. Emergency Controls
```typescript
// Test emergency pause
await securityService.emergencyPause();
// Verify network stops accepting tasks
```

#### Performance Testing
1. Load Testing
```bash
# Run load test script
npm run test:load
```

2. Latency Testing
```bash
# Run latency test
npm run test:latency
```

### 4. Common Issues & Solutions

1. Node Connection Issues
- Check network connectivity
- Verify wallet connection
- Confirm stake amount
- Check for rate limiting

2. Task Processing Issues
- Verify WebGPU/WebGL support
- Check input data format
- Monitor resource usage
- Verify proof submission

3. Security Alerts
- Check rate limit violations
- Monitor for suspicious patterns
- Verify proof validations
- Track reputation changes

### 5. Reporting Issues

Use the following template for bug reports:
```markdown
**Issue Type:** [Security/Performance/Functionality]
**Severity:** [High/Medium/Low]
**Description:**
[Detailed description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Logs/Screenshots:**
[Attach relevant data]
```

### 6. Monitoring Dashboard

Access the monitoring dashboard at:
```
http://localhost:5173/dashboard
```

Key metrics to monitor:
- Node count and health
- Task success rate
- Network latency
- Resource utilization
- Security incidents

