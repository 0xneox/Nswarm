import { PublicKey } from '@solana/web3.js';
import { create } from 'zustand';

interface NodeMetrics {
    taskCount: number;
    successRate: number;
    averageExecutionTime: number;
    totalEarnings: number;
}

interface ResourceUsage {
    cpuUsage: number;
    memoryUsage: number;
    gpuUsage: number;
    networkBandwidth: number;
}

interface NodeState {
    isActive: boolean;
    metrics: NodeMetrics;
    earnings: number;
    publicKey: string | null;
    setActive: (status: boolean) => void;
    updateMetrics: (metrics: Partial<NodeMetrics>) => void;
    updateEarnings: (amount: number) => void;
    setPublicKey: (key: string) => void;
}

// Initialize store with secure defaults
export const useNodeStore = create<NodeState>((set) => ({
    isActive: false,
    metrics: {
        taskCount: 0,
        successRate: 100,
        averageExecutionTime: 0,
        totalEarnings: 0
    },
    earnings: 0,
    publicKey: null,
    setActive: (status) => set({ isActive: status }),
    updateMetrics: (newMetrics) => 
        set((state) => ({ 
            metrics: { ...state.metrics, ...newMetrics }
        })),
    updateEarnings: (amount) => 
        set((state) => ({ 
            earnings: state.earnings + amount,
            metrics: {
                ...state.metrics,
                totalEarnings: state.metrics.totalEarnings + amount
            }
        })),
    setPublicKey: (key) => set({ publicKey: key })
}));

interface Task {
    id: string;
    type: 'compute' | 'storage' | 'inference';
    data: unknown;
    requirements: {
        minCpu: number;
        minMemory: number;
        minGpu?: number;
    };
}

export class ComputeNode {
    private nodeId: string;
    private metrics: NodeMetrics;
    private resourceUsage: ResourceUsage;
    private stake: number;
    private earnings: number;
    private maxLoad: number;
    private ownerKey: PublicKey | null;
    private isActive: boolean;
    private taskHistory: Map<string, { success: boolean; executionTime: number }>;
    private updateInterval: ReturnType<typeof setInterval> | null;

    constructor(nodeId: string) {
        this.nodeId = nodeId;
        this.metrics = {
            taskCount: 0,
            successRate: 100,
            averageExecutionTime: 0,
            totalEarnings: 0
        };
        this.resourceUsage = {
            cpuUsage: 0,
            memoryUsage: 0,
            gpuUsage: 0,
            networkBandwidth: 0
        };
        this.stake = 0;
        this.earnings = 0;
        this.maxLoad = 90;
        this.ownerKey = null;
        this.isActive = true;
        this.taskHistory = new Map();
        this.updateInterval = null;

        this.startMonitoring();
    }

    private startMonitoring(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval as NodeJS.Timeout);
        }

        this.updateInterval = setInterval(() => {
            this.updateResourceUsage();
        }, 1000); // Update every second for smoother UI
    }

    private updateResourceUsage(): void {
        const time = Date.now() / 1000;
        const noise = Math.random() * 5; // Add small random fluctuations

        // Simulate realistic resource patterns with base load + activity + noise
        this.resourceUsage = {
            cpuUsage: 30 + 20 * Math.sin(time / 10) + noise,
            memoryUsage: 40 + 15 * Math.sin(time / 20) + noise,
            gpuUsage: 25 + 35 * Math.sin(time / 15) + noise,
            networkBandwidth: 400 + 200 * Math.sin(time / 30)
        };
    }

    stopMonitoring(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval as NodeJS.Timeout);
            this.updateInterval = null;
        }
        this.isActive = false;
    }

    canAcceptTask(task: Task): boolean {
        if (!this.isActive || !this.ownerKey) return false;

        const { requirements } = task;
        const { cpuUsage, memoryUsage, gpuUsage } = this.resourceUsage;

        return (
            cpuUsage < this.maxLoad - requirements.minCpu &&
            memoryUsage < this.maxLoad - requirements.minMemory &&
            (!requirements.minGpu || gpuUsage < this.maxLoad - requirements.minGpu)
        );
    }

    getResourceUsage(): ResourceUsage {
        return { ...this.resourceUsage };
    }

    getMetrics(): NodeMetrics {
        return { ...this.metrics };
    }

    getStake(): number {
        return this.stake;
    }

    getEarnings(): number {
        return this.earnings;
    }

    getNodeId(): string {
        return this.nodeId;
    }

    setOwner(owner: PublicKey): void {
        this.ownerKey = owner;
    }

    getOwner(): PublicKey | null {
        return this.ownerKey;
    }

    setStake(amount: number): void {
        if (amount < 0) throw new Error('Stake amount cannot be negative');
        this.stake = amount;
    }

    addEarnings(amount: number): void {
        if (amount < 0) throw new Error('Earnings amount cannot be negative');
        this.earnings += amount;
        this.metrics.totalEarnings += amount;
    }

    async executeTask(task: Task): Promise<boolean> {
        if (!this.canAcceptTask(task)) {
            throw new Error('Node cannot accept task');
        }

        try {
            const executionTime = Math.max(
                500,
                task.requirements.minCpu * 10 +
                task.requirements.minMemory * 5 +
                (task.requirements.minGpu || 0) * 15
            );
            
            await new Promise(resolve => setTimeout(resolve, executionTime));
            
            this.metrics.taskCount++;
            this.taskHistory.set(task.id, {
                success: true,
                executionTime
            });
            
            this.metrics.averageExecutionTime = Array.from(this.taskHistory.values())
                .reduce((sum, entry) => sum + entry.executionTime, 0) / this.taskHistory.size;
            
            // Calculate earnings based on task complexity and execution time
            const earnings = (executionTime / 1000) * 0.1; // 0.1 NLOV per second
            this.addEarnings(earnings);
            
            return true;
        } catch (error) {
            this.taskHistory.set(task.id, {
                success: false,
                executionTime: 0
            });
            
            this.metrics.successRate = (Array.from(this.taskHistory.values())
                .filter(entry => entry.success).length / this.taskHistory.size) * 100;
            
            return false;
        }
    }

    verifyTaskSignature(signature: string): boolean {
        if (!signature || typeof signature !== 'string') return false;
        // In production: implement ed25519 signature verification
        return signature.length >= 64; // Minimum signature length
    }

    generateProofOfWork(task: Task, result: unknown): string {
        const timestamp = Date.now();
        const nodeSignature = this.nodeId + timestamp;
        
        // In production: implement proper zero-knowledge proofs
        const proof = {
            taskId: task.id,
            nodeId: this.nodeId,
            timestamp,
            result,
            nodeSignature
        };
        
        return btoa(JSON.stringify(proof));
    }
}
