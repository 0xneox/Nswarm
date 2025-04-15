# Deploying neuroSwarm on Replit

This guide provides detailed instructions for deploying the neuroSwarm application on Replit.

## Prerequisites

1. A Replit account
2. (Optional) Supabase account for database services
3. (Optional) Solana wallet/account for testing on testnet

## Deployment Steps

### 1. Fork or Create the Project on Replit

- Create a new Replit project by importing this repository
- Alternatively, use the "Import from GitHub" option in Replit

### 2. Configure Environment Variables

Set up the following secrets in your Replit project:

1. Go to the "Secrets" tab in your Replit project
2. Add the following key-value pairs:
   - `VITE_NETWORK`: Set to `testnet` or `mainnet` depending on your deployment target
   - `VITE_PROGRAM_ID`: Your Solana program ID (smart contract address)
   - `VITE_SUPABASE_URL`: Your Supabase project URL (if using Supabase)
   - `VITE_SUPABASE_KEY`: Your Supabase public API key (if using Supabase)

### 3. Configure the Run Button

1. In your Replit project, go to the `.replit` file
2. Set the run command to use the Python server:
   ```
   run = "python3 simple_server.py"
   ```

### 4. Install Dependencies

The project should automatically install dependencies when you first run it, but if there are issues:

1. Use the Replit Packager to install any missing Node.js dependencies
2. For Python dependencies, ensure that the standard library packages are available

### 5. Run the Project

1. Click the "Run" button in Replit
2. The server should start and provide a URL for accessing your application
3. The application should be available at the Replit-provided domain

### 6. Persistent Deployment

For a persistent deployment:

1. Click the "Deploy" button in your Replit project
2. Configure the deployment settings:
   - Set the deployment name
   - Choose a custom domain if needed
   - Configure environment variables
3. Complete the deployment process

## Troubleshooting

### Server Won't Start

If the server fails to start:

1. Check that port 5000 is available (the server will attempt to find an available port if 5000 is in use)
2. Ensure all required environment variables are set
3. Check the console logs for specific error messages

### Wallet Connection Issues

If the wallet connection doesn't work:

1. Ensure you're running on a network that supports Solana (testnet or mainnet)
2. Check that the correct program ID is set in the environment variables
3. Verify that your wallet is configured for the same network

### Database Connection Issues

If using Supabase and experiencing connection issues:

1. Verify that your Supabase URL and key are correct
2. Check that your Supabase project is active and accessible
3. Ensure that the necessary tables and schemas are set up in your Supabase project

## Updating the Deployment

To update your deployment:

1. Make changes to your project files
2. Test the changes locally
3. Click "Deploy" to update your deployment

## Scaling Considerations

For handling increased user load:

1. Consider upgrading to a higher tier Replit plan for better performance
2. Optimize database queries if using Supabase
3. Implement caching strategies for frequently accessed data
4. Consider using a dedicated database service for production deployments