# neuroSwarm

A decentralized AI compute network on Solana blockchain.

## Overview

neuroSwarm is a "connect-to-earn" platform that enables users to contribute their computational resources to a decentralized network and earn rewards. The platform leverages Solana blockchain for fast and low-cost transactions, ensuring efficient reward distribution and transparent operations.

## Features

- **Dashboard**: Interactive dashboard to monitor network statistics, tasks, devices, and earnings
- **Wallet Integration**: Connect your Solana wallet to participate in the network
- **Device Management**: Register and manage your compute devices
- **Task Scheduling**: Accept and complete AI compute tasks to earn rewards
- **Earnings Tracking**: Monitor your earnings and view historical data

## Getting Started

### Prerequisites

- Node.js (for development)
- Python 3.x (for the server)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/neuroSwarm.git
   cd neuroSwarm
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables in a `.env` file:
   ```
   VITE_NETWORK=testnet
   VITE_PROGRAM_ID=ComputeNtwrk11111111111111111111111111111
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_key
   PORT=5000
   ```

### Running the Application

#### Local Development
1. Start the development server:
   ```bash
   npm run dev
   ```

#### Testnet Deployment
1. Configure your Solana wallet:
   ```bash
   solana config set --url https://api.testnet.solana.com
   solana config set --keypair path/to/your/keypair.json
   ```

2. Set up environment variables:
   ```bash
   cp .env.testnet .env
   # Edit .env with your specific configuration
   ```

3. Build and deploy programs:
   ```bash
   # Build programs
   cd programs
   cargo build-bpf

   # Deploy programs
   solana program deploy target/deploy/device.so
   solana program deploy target/deploy/task.so
   solana program deploy target/deploy/reward.so
   solana program deploy target/deploy/staking.so
   solana program deploy target/deploy/gpu.so
   ```

4. Update program IDs:
   - Copy the program IDs from the deployment output
   - Update them in `.env` and `config/deployment.json`

5. Deploy frontend:
   ```bash
   npm run build
   npm run deploy:testnet
   ```

6. Initialize program state:
   ```bash
   npm run init:testnet
   ```

7. Verify deployment:
   ```bash
   npm run verify:testnet
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

### Alternative: Running with Node.js

1. Start the Express server:
   ```
   node simple-server.js
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Project Structure

- `/public` - Static assets and HTML files
  - `/app` - Dashboard application files
  - `/app/js` - JavaScript modules for the dashboard
- `/src` - Source code for the React/TypeScript application
- `/programs` - Solana smart contracts
- `/scripts` - Utility scripts for testing and deployment

## API Endpoints

The following API endpoints are available:

- `GET /api/health` - Check server health
- `GET /api/network/stats` - Get network statistics
- `GET /api/tasks/recent` - Get recent tasks
- `GET /api/devices/user` - Get user devices
- `GET /api/earnings/summary` - Get earnings summary
- `GET /api/earnings/history` - Get earnings history
- `GET /api/wallet/status` - Get wallet connection status
- `GET /api/tasks/available` - Get available tasks
- `POST /api/wallet/connect` - Connect wallet
- `POST /api/devices/register` - Register a new device
- `POST /api/tasks/start` - Start a task

## Development

### Building for Production

```
npm run build
```

### Deployment

To deploy to Replit:

1. Create a new Replit project
2. Clone this repository
3. Run `npm install`
4. Configure environment variables in the Replit Secrets tab
5. Deploy using the Replit deployment features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Solana Foundation
- OpenAI
- Replit