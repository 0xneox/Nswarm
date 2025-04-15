import { useMemo, useState, useEffect } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet
} from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clsx } from 'clsx';
import { Power, Zap, Clock, Server, Activity } from 'lucide-react';
import { ComputeNode } from './core/ComputeNode';
import { useNodeStore } from './core/ComputeNode';
import { DevicePanel } from './components/DevicePanel';
import { NetworkProvider } from './providers/NetworkProvider';
import { useDeviceStore, DeviceDetector, Device } from './core/DeviceManager';
import { AITasksPanel } from './components/AITasksPanel';
import { SupabaseService } from './services/SupabaseService';
import { config } from './config';
import { EarningsPanel } from './components/EarningsPanel';
import { NetworkStats } from './components/NetworkStats';
import { TaskPipeline } from './components/TaskPipeline';
import { ReferralPanel } from './components/ReferralPanel';
import { SolanaService } from './services/SolanaService';
import { Keypair } from '@solana/web3.js';
import { ErrorBoundary } from './components/ErrorBoundary';

// Import styles
import '@solana/wallet-adapter-react-ui/styles.css';
import './index.css';

function NodeControls() {
  const { isActive, setActive, updateMetrics, earnings } = useNodeStore();
  const { wallet } = useWallet();
  const [node, setNode] = useState<ComputeNode | null>(null);
  const { updateDeviceStatus, updateDevicePerformance, devices } = useDeviceStore();
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  
  const toggleNode = async () => {
    if (!wallet?.adapter.publicKey || !activeDeviceId) return;
    
    if (!isActive) {
      const newNode = new ComputeNode(wallet.adapter.publicKey.toBase58());
      setNode(newNode);
      
      // Start monitoring and update metrics
      const updateInterval = setInterval(async () => {
        const nodeMetrics = newNode.getMetrics();
        const resourceUsage = newNode.getResourceUsage();
        
        updateMetrics({
          taskCount: nodeMetrics.taskCount,
          successRate: nodeMetrics.successRate,
          averageExecutionTime: nodeMetrics.averageExecutionTime,
          totalEarnings: nodeMetrics.totalEarnings
        });

        // Update device metrics
        updateDeviceStatus(activeDeviceId, 'online');
        updateDevicePerformance(activeDeviceId, {
          avgCpuUsage: resourceUsage.cpuUsage,
          avgMemoryUsage: resourceUsage.memoryUsage,
          taskSuccessRate: nodeMetrics.successRate,
          totalTasksCompleted: nodeMetrics.taskCount
        });
      }, 1000);

      // Store interval ID for cleanup
      (newNode as any).updateInterval = updateInterval;
    } else if (node) {
      // Cleanup interval on stop
      clearInterval((node as any).updateInterval);
      node.stopMonitoring();
      setNode(null);
      
      // Update device status
      if (activeDeviceId) {
        updateDeviceStatus(activeDeviceId, 'offline');
      }
    }
    
    setActive(!isActive);
  };

  // Auto-detect and register current device
  useEffect(() => {
    const detectAndRegisterDevice = async () => {
      if (!wallet?.adapter.publicKey) return;
      
      const specs = await DeviceDetector.detectSpecs();
      const deviceId = DeviceDetector.generateDeviceId(
        wallet.adapter.publicKey.toBase58(),
        specs
      );

      // Check if device already exists
      const existingDevice = Array.from(devices.values()).find(d => d.id === deviceId);
      if (!existingDevice) {
        const deviceType = DeviceDetector.detectDeviceType();
        const newDevice: Device = {
          id: deviceId,
          name: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Device`,
          type: deviceType,
          ownerPublicKey: wallet.adapter.publicKey.toBase58(),
          specs,
          status: 'offline' as const,
          lastSeen: Date.now(),
          totalEarnings: 0,
          performance: {
            avgCpuUsage: 0,
            avgMemoryUsage: 0,
            taskSuccessRate: 100,
            totalTasksCompleted: 0
          }
        };
        useDeviceStore.getState().addDevice(newDevice);
      }
      
      setActiveDeviceId(deviceId);
    };

    detectAndRegisterDevice();
  }, [wallet?.adapter.publicKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (node) {
        clearInterval((node as any).updateInterval);
        node.stopMonitoring();
      }
    };
  }, [node]);

  return (
    <div className="p-6 rounded-lg bg-gray-800/50 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Node Control Panel</h3>
        {wallet?.adapter.publicKey ? (
          <button 
            onClick={toggleNode}
            disabled={!activeDeviceId}
            className={clsx(
              "px-4 py-2 rounded-lg flex items-center gap-2 transition",
              !activeDeviceId && "opacity-50 cursor-not-allowed",
              isActive ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            )}
          >
            <Power className="w-4 h-4" />
            {isActive ? "Stop Node" : "Start Node"}
          </button>
        ) : (
          <WalletMultiButton />
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-md bg-gray-900/50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>CPU Usage</span>
          </div>
          <div className="text-2xl font-bold">
            {node ? (node.getResourceUsage().cpuUsage).toFixed(1) : '0.0'}%
          </div>
        </div>
        
        <div className="p-4 rounded-md bg-gray-900/50">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-blue-500" />
            <span>Memory</span>
          </div>
          <div className="text-2xl font-bold">
            {node ? (node.getResourceUsage().memoryUsage).toFixed(1) : '0.0'}%
          </div>
        </div>
        
        <div className="p-4 rounded-md bg-gray-900/50">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span>Tasks</span>
          </div>
          <div className="text-2xl font-bold">
            {node ? node.getMetrics().taskCount : 0}
          </div>
        </div>
        
        <div className="p-4 rounded-md bg-gray-900/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>Success Rate</span>
          </div>
          <div className="text-2xl font-bold">
            {node ? node.getMetrics().successRate.toFixed(1) : '100.0'}%
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 rounded-md bg-blue-600/20 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <span className="text-blue-400">Total Earnings</span>
          <span className="text-2xl font-bold">{earnings.toFixed(3)} NLOV</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  console.log('App initializing...');
  
  const endpoint = useMemo(() => {
    const network = import.meta.env.VITE_NETWORK || 'devnet';
    const endpoints = {
      mainnet: 'https://api.mainnet-beta.solana.com',
      testnet: 'https://api.testnet.solana.com',
      devnet: 'https://api.devnet.solana.com'
    };
    const selectedEndpoint = endpoints[network as keyof typeof endpoints] || endpoints.devnet;
    console.log('Using Solana endpoint:', selectedEndpoint, 'for network:', network);
    return selectedEndpoint;
  }, []);

  const wallets = useMemo(() => {
    console.log('Initializing wallet adapters...');
    return [
      new PhantomWalletAdapter({ network: import.meta.env.VITE_NETWORK || 'devnet' }),
      new SolflareWalletAdapter({ network: import.meta.env.VITE_NETWORK || 'devnet' })
    ];
  }, []);

  const supabaseService = useMemo(() => {
    console.log('Initializing Supabase service with URL:', config.SUPABASE_URL);
    return new SupabaseService(config.SUPABASE_URL, config.SUPABASE_KEY);
  }, []);

  const payer = useMemo(() => {
    console.log('Generating new payer keypair...');
    return Keypair.generate();
  }, []);

  const solanaService = useMemo(() => {
    console.log('Initializing Solana service with endpoint:', endpoint);
    return new SolanaService(endpoint, payer, supabaseService);
  }, [endpoint, payer, supabaseService]);

  console.log('App initialized successfully');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <ErrorBoundary>
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                <ErrorBoundary>
                  <NetworkProvider>
                    <header className="mb-8">
                      <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">Swarm Network</h1>
                        <ErrorBoundary>
                          <WalletMultiButton />
                        </ErrorBoundary>
                      </div>
                    </header>

                    <ErrorBoundary>
                      <NetworkStats />
                    </ErrorBoundary>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-8">
                        <ErrorBoundary>
                          <NodeControls />
                        </ErrorBoundary>
                        <ErrorBoundary>
                          <DevicePanel />
                        </ErrorBoundary>
                      </div>
                      <div className="space-y-8">
                        <ErrorBoundary>
                          <TaskPipeline solanaService={solanaService} supabaseService={supabaseService} />
                        </ErrorBoundary>
                        <ErrorBoundary>
                          <EarningsPanel />
                        </ErrorBoundary>
                      </div>
                    </div>

                    <div className="mb-8">
                      <ErrorBoundary>
                        <ReferralPanel />
                      </ErrorBoundary>
                    </div>

                    <ErrorBoundary>
                      <AITasksPanel supabaseService={supabaseService} />
                    </ErrorBoundary>
                  </NetworkProvider>
                </ErrorBoundary>
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;