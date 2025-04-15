import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    Keypair,
    TransactionInstruction,
    sendAndConfirmTransaction,
    TransactionSignature
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from 'bn.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { SwarmNetwork as IDL } from '../idl/swarm_network';
import { SupabaseService } from './SupabaseService';

// Solana endpoints
const ENDPOINTS = {
    MAINNET: 'https://api.mainnet-beta.solana.com',
    DEVNET: 'https://api.devnet.solana.com',
    TESTNET: 'https://api.testnet.solana.com'
} as const;

// Use devnet for testing
const DEFAULT_ENDPOINT = ENDPOINTS.DEVNET;

// Default program ID for development (same as ContractService)
const DEFAULT_PROGRAM_ID = 'Cxkf3LNezaq4NiHMaXom1KiKDUPky1o8xL2WXgfHWxWN';

// Get program ID from env or use default
const SWARM_NETWORK_PROGRAM_ID = new PublicKey(
    import.meta.env.VITE_SWARM_NETWORK_PROGRAM_ID || DEFAULT_PROGRAM_ID
);

// Initialize Anchor program
const initializeProgram = (connection: Connection, wallet: Keypair) => {
    const provider = new AnchorProvider(
        connection,
        {
            publicKey: wallet.publicKey,
            signTransaction: async (tx: Transaction) => {
                tx.sign(wallet);
                return tx;
            },
            signAllTransactions: async (txs: Transaction[]) => {
                txs.forEach(tx => tx.sign(wallet));
                return txs;
            },
        },
        { commitment: 'confirmed' }
    );

    return new Program(IDL, SWARM_NETWORK_PROGRAM_ID, provider) as Program<typeof IDL>;
};

export interface DeviceSpecs {
    gpuModel: string;
    vram: number;
    hashRate: number;
}

export interface TaskRequirements {
    minVram: number;
    minHashRate: number;
    priority: 'low' | 'medium' | 'high';
}

export interface TaskResult {
    taskId: string;
    computeTime: number;
    hashRate: number;
    success: boolean;
}

export interface TaskStatus {
    completed: boolean;
    failed: boolean;
    nodeId?: string;
    reward?: number;
    signature?: string;
}

export interface Device {
    id: string;
    owner: PublicKey;
    stake: number;
    vram: number;
    hashRate: number;
    gpuModel: string;
}

export interface Task {
    id: string;
    owner: PublicKey;
    requirements: TaskRequirements;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    assignedNode?: string;
    result?: TaskResult;
}

export interface ISolanaService {
    validateTransaction(transaction: Transaction): Promise<boolean>;
    waitForConfirmation(signature: TransactionSignature): Promise<boolean>;
    registerDevice(owner: PublicKey, specs: DeviceSpecs, payer: Keypair): Promise<TransactionSignature>;
    registerTask(owner: PublicKey, requirements: TaskRequirements, payer: Keypair): Promise<TransactionSignature>;
    submitTask(owner: PublicKey, taskType: string, requirements: TaskRequirements, payer: Keypair): Promise<TransactionSignature>;
    submitTaskProof(proofData: { taskId: string; timestamp: number; computeTime: number; hashRate: number; success: boolean; }, payer: Keypair): Promise<TransactionSignature>;
    distributeReward(recipient: PublicKey, amount: number, payer: Keypair, tokenAccount: PublicKey): Promise<TransactionSignature>;
    stakeTokens(user: PublicKey, amount: number, payer: Keypair, tokenAccount: PublicKey): Promise<string>;
    getAvailableDevices(): Promise<Device[]>;
    findSuitableGPU(requirements: TaskRequirements): Promise<Device | null>;
    monitorTaskProgress(taskId: string): Promise<string>;
    processTaskFromSupabase(taskId: string, taskType: string, requirements: TaskRequirements): Promise<boolean>;
}

export class SolanaService implements ISolanaService {
    private readonly connection: Connection;
    private readonly program: Program<typeof IDL>;

    constructor(
        endpoint: string = DEFAULT_ENDPOINT,
        private readonly payer: Keypair,
        private readonly supabaseService: SupabaseService
    ) {
        this.connection = new Connection(endpoint, 'confirmed');
        this.program = initializeProgram(this.connection, this.payer);
        console.log('SolanaService initialized with endpoint:', endpoint);
    }

    // Utility methods
    async validateTransaction(transaction: Transaction): Promise<boolean> {
        try {
            const simulation = await this.connection.simulateTransaction(transaction);
            return simulation.value.err === null;
        } catch (error) {
            console.error('Transaction validation failed:', error);
            return false;
        }
    }

    async waitForConfirmation(signature: TransactionSignature): Promise<boolean> {
        try {
            const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
            return !confirmation.value.err;
        } catch (error) {
            console.error('Transaction confirmation failed:', error);
            return false;
        }
    }

    // Device Registration
    async registerDevice(
        owner: PublicKey,
        specs: DeviceSpecs,
        payer: Keypair
    ): Promise<TransactionSignature> {
        try {
            const deviceAccount = Keypair.generate();
            const instruction = new TransactionInstruction({
                keys: [
                    { pubkey: deviceAccount.publicKey, isSigner: true, isWritable: true },
                    { pubkey: owner, isSigner: true, isWritable: false },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: this.program.programId,
                data: Buffer.from([
                    ...new Uint8Array(Buffer.from('register')),
                    ...new Uint8Array(Buffer.from(JSON.stringify(specs)))
                ]),
            });

            const transaction = new Transaction().add(instruction);
            const isValid = await this.validateTransaction(transaction);
            if (!isValid) throw new Error('Transaction validation failed');

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [payer, deviceAccount],
                { commitment: 'confirmed' }
            );

            const confirmed = await this.waitForConfirmation(signature);
            if (!confirmed) throw new Error('Transaction confirmation failed');

            return signature;
        } catch (error) {
            console.error('Device registration failed:', error);
            throw new Error(`Device registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Task Registration
    async registerTask(
        owner: PublicKey,
        requirements: TaskRequirements,
        payer: Keypair
    ): Promise<TransactionSignature> {
        try {
            const taskAccount = Keypair.generate();
            const instruction = new TransactionInstruction({
                keys: [
                    { pubkey: taskAccount.publicKey, isSigner: true, isWritable: true },
                    { pubkey: owner, isSigner: true, isWritable: false },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: this.program.programId,
                data: Buffer.from([
                    ...new Uint8Array(Buffer.from('register')),
                    ...new Uint8Array(Buffer.from(JSON.stringify(requirements)))
                ]),
            });

            const transaction = new Transaction().add(instruction);
            const isValid = await this.validateTransaction(transaction);
            if (!isValid) throw new Error('Transaction validation failed');

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [payer, taskAccount],
                { commitment: 'confirmed' }
            );

            const confirmed = await this.waitForConfirmation(signature);
            if (!confirmed) throw new Error('Transaction confirmation failed');

            return signature;
        } catch (error) {
            console.error('Task registration failed:', error);
            throw new Error(`Task registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Task Submission
    async submitTask(
        owner: PublicKey,
        taskType: string,
        requirements: TaskRequirements,
        payer: Keypair
    ): Promise<TransactionSignature> {
        try {
            const taskAccount = Keypair.generate();
            
            const tx = await this.program.methods
                .submitTask({
                    taskType,
                    requirements: {
                        minVram: new BN(requirements.minVram),
                        minHashRate: new BN(requirements.minHashRate),
                        priority: requirements.priority
                    }
                })
                .accounts({
                    owner: owner,
                    task: taskAccount.publicKey,
                    systemProgram: SystemProgram.programId
                })
                .signers([payer, taskAccount])
                .rpc();

            return tx;
        } catch (error) {
            console.error('Task submission failed:', error);
            throw new Error(`Task submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Task Proof Submission
    async submitTaskProof(
        proofData: {
            taskId: string;
            timestamp: number;
            computeTime: number;
            hashRate: number;
            success: boolean;
        },
        payer: Keypair
    ): Promise<TransactionSignature> {
        try {
            const taskPubkey = new PublicKey(proofData.taskId);
            
            const tx = await this.program.methods
                .submitTaskProof({
                    timestamp: new BN(proofData.timestamp),
                    computeTime: new BN(proofData.computeTime),
                    hashRate: new BN(proofData.hashRate),
                    success: proofData.success
                })
                .accounts({
                    authority: payer.publicKey,
                    task: taskPubkey,
                    systemProgram: SystemProgram.programId
                })
                .signers([payer])
                .rpc();

            // Log task proof submission
            await this.supabaseService.logTaskProof({
                taskId: proofData.taskId,
                timestamp: proofData.timestamp,
                success: proofData.success,
                signature: tx.toString()
            });

            return tx;
        } catch (error) {
            console.error('Error submitting task proof:', error);
            throw error;
        }
    }

    // Reward Distribution
    async distributeReward(
        recipient: PublicKey,
        amount: number,
        payer: Keypair,
        tokenAccount: PublicKey
    ): Promise<TransactionSignature> {
        try {
            const rewardAccount = Keypair.generate();
            const instruction = new TransactionInstruction({
                keys: [
                    { pubkey: rewardAccount.publicKey, isSigner: true, isWritable: true },
                    { pubkey: recipient, isSigner: false, isWritable: true },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: tokenAccount, isSigner: false, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: this.program.programId,
                data: Buffer.from([
                    ...new Uint8Array(Buffer.from('distribute')),
                    ...new Uint8Array(Buffer.from(amount.toString()))
                ]),
            });

            const transaction = new Transaction().add(instruction);
            const isValid = await this.validateTransaction(transaction);
            if (!isValid) throw new Error('Transaction validation failed');

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [payer, rewardAccount],
                { commitment: 'confirmed' }
            );

            const confirmed = await this.waitForConfirmation(signature);
            if (!confirmed) throw new Error('Transaction confirmation failed');

            return signature;
        } catch (error) {
            console.error('Reward distribution failed:', error);
            throw new Error(`Reward distribution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Staking
    async stakeTokens(
        user: PublicKey,
        amount: number,
        payer: Keypair,
        tokenAccount: PublicKey
    ): Promise<string> {
        try {
            const stakeAccount = Keypair.generate();
            const instruction = new TransactionInstruction({
                keys: [
                    { pubkey: stakeAccount.publicKey, isSigner: true, isWritable: true },
                    { pubkey: user, isSigner: true, isWritable: false },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: tokenAccount, isSigner: false, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: this.program.programId,
                data: Buffer.from([
                    ...new Uint8Array(Buffer.from('stake')),
                    ...new Uint8Array(Buffer.from(amount.toString()))
                ]),
            });

            const transaction = new Transaction().add(instruction);
            const isValid = await this.validateTransaction(transaction);
            if (!isValid) throw new Error('Transaction validation failed');

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [payer, stakeAccount],
                { commitment: 'confirmed' }
            );

            const confirmed = await this.waitForConfirmation(signature);
            if (!confirmed) throw new Error('Transaction confirmation failed');

            console.log('Staking successful:', {
                user: user.toBase58(),
                amount,
                signature,
            });

            return signature;
        } catch (error) {
            console.error('Staking failed:', error);
            throw new Error(`Staking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Query methods
    async getAvailableDevices(): Promise<Device[]> {
        try {
            const devices = await this.program.account.device.all();
            
            return devices.map(device => ({
                id: device.publicKey.toBase58(),
                owner: new PublicKey((device.account as { owner: PublicKey }).owner.toBase58()),
                stake: (device.account as any).stakedAmount?.toNumber() || 0,
                vram: (device.account as any).specs?.vram?.toNumber() || 0,
                hashRate: (device.account as any).specs?.hashRate?.toNumber() || 0,
                gpuModel: (device.account as any).specs?.gpuModel || 'Unknown'
            }));
        } catch (error: any) {
            console.error('Error fetching available devices:', error);
            throw new Error(`Failed to fetch available devices: ${error?.message || 'Unknown error'}`);
        }
    }

    async findSuitableGPU(requirements: TaskRequirements): Promise<Device | null> {
        try {
            const devices = await this.getAvailableDevices();
            return devices.find(device => 
                device.vram >= requirements.minVram && 
                device.hashRate >= requirements.minHashRate
            ) || null;
        } catch (error: any) {
            console.error('Error finding suitable GPU:', error);
            throw new Error(`Failed to find suitable GPU: ${error?.message || 'Unknown error'}`);
        }
    }

    async monitorTaskProgress(taskId: string): Promise<string> {
        try {
            let status: 'pending' | 'processing' | 'completed' | 'failed' = 'processing';
            let attempts = 0;
            const maxAttempts = 30;

            while (status === 'processing' && attempts < maxAttempts) {
                const taskPubkey = new PublicKey(taskId);
                const taskAccount = await this.program.account.task.fetch(taskPubkey);
                if (!taskAccount) throw new Error('Task not found');

                status = taskAccount.status as 'pending' | 'processing' | 'completed' | 'failed';

                if (status === 'processing') {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    attempts++;
                }
            }

            if (status === 'completed') {
                return 'Task completed successfully';
            } else if (status === 'failed') {
                return 'Task failed';
            } else {
                return 'Task timed out';
            }
        } catch (error) {
            console.error('Error monitoring task progress:', error);
            return 'failed';
        }
    }

    async processTaskFromSupabase(taskId: string, taskType: string, requirements: TaskRequirements): Promise<boolean> {
        try {
            // Find a suitable GPU for the task
            const device = await this.findSuitableGPU(requirements);
            if (!device) {
                throw new Error('No suitable GPU found for task');
            }

            // Submit the task to the blockchain
            const result = await this.submitTask(
                device.owner,
                taskType,
                requirements,
                this.payer
            );

            // Update task status in Supabase
            await this.supabaseService.updateTaskBlockchainDetails(taskId, {
                blockchain_task_id: result,
                node_id: device.id,
                status: 'processing'
            });

            return true;
        } catch (error) {
            console.error('Error processing task:', error);
            await this.supabaseService.updateTaskStatus(taskId, 'failed');
            return false;
        }
    }

}
