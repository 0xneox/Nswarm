import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, Wallet } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction } from '@solana/spl-token';
import { Idl } from '@project-serum/anchor';
import * as IDL from '../idl/swarm_network.json';

export class ContractService {
    public program: Program<Idl>;
    private provider: AnchorProvider;
    private programId: PublicKey;
    
    // PDAs for the program
    private _pdas: {
        state?: PublicKey,
        tokenMint?: PublicKey,
        rewardPool?: PublicKey,
        stakePool?: PublicKey
    } = {};

    constructor(
        connection: Connection,
        wallet: Wallet,
        programId?: string
    ) {
        // Use provided program ID or fallback to environment variable
        const programIdStr = programId || 'Cxkf3LNezaq4NiHMaXom1KiKDUPky1o8xL2WXgfHWxWN';
        if (!programIdStr) {
            throw new Error('Program ID not found');
        }

        console.log('Initializing ContractService with program ID:', programIdStr);
        this.programId = new PublicKey(programIdStr);
        this.provider = new AnchorProvider(connection, wallet, {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed'
        });
        this.program = new Program(IDL as Idl, this.programId, this.provider);
    }

    public async initialize() {
        // Find all PDAs
        const [state, stateBump] = PublicKey.findProgramAddressSync(
            [Buffer.from('state')],
            this.programId
        );
        this._pdas.state = state;

        const [tokenMint] = PublicKey.findProgramAddressSync(
            [Buffer.from('token_mint')],
            this.programId
        );
        this._pdas.tokenMint = tokenMint;

        const [rewardPool] = PublicKey.findProgramAddressSync(
            [Buffer.from('reward_pool')],
            this.programId
        );
        this._pdas.rewardPool = rewardPool;

        const [stakePool] = PublicKey.findProgramAddressSync(
            [Buffer.from('stake_pool')],
            this.programId
        );
        this._pdas.stakePool = stakePool;

        try {
            // Check if state already exists
            try {
                const existingState = await this.program.account.state.fetch(state);
                console.log('State already initialized:', existingState);
                return existingState as any;
            } catch (e) {
                // State doesn't exist, continue with initialization
                console.log('No existing state found, initializing...');
            }

            // Initialize the program
            await this.program.methods
                .initialize(stateBump, 9) // Using actual state bump and 9 decimals
                .accounts({
                    authority: this.provider.wallet.publicKey,
                    state: this._pdas.state!,
                    tokenMint: this._pdas.tokenMint!,
                    rewardPool: this._pdas.rewardPool!,
                    stakePool: this._pdas.stakePool!,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .rpc();

            console.log('Program initialized successfully');
            
            // Fetch and return the initialized state
            const newState = await this.program.account.state.fetch(this._pdas.state!);
            return newState as any;
        } catch (error) {
            console.error('Failed to initialize program:', error);
            throw error;
        }
    }

    async getState() {
        try {
            const [statePda] = PublicKey.findProgramAddressSync(
                [Buffer.from('state')],
                this.programId
            );
            
            try {
                const state = await this.program.account.state.fetch(statePda);
                console.log('Found existing state:', state);
                return state;
            } catch (fetchError) {
                console.log('State account not found, initializing...');
                return await this.initializeState();
            }
        } catch (error) {
            console.error('Error in getState:', error);
            return this.getDefaultState();
        }
    }

    async initializeState() {
        try {
            const [statePda] = PublicKey.findProgramAddressSync(
                [Buffer.from('state')],
                this.programId
            );

            const [rewardPoolPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('reward_pool')],
                this.programId
            );

            // Create token mint first
            const tokenMint = await this.createTokenMint();
            console.log('Created token mint:', tokenMint.toString());

            // Initialize the state account
            const tx = await this.program.methods
                .initialize(0, 9) // bump, decimals
                .accounts({
                    authority: this.provider.wallet.publicKey,
                    state: statePda,
                    tokenMint: tokenMint,
                    rewardPool: rewardPoolPda,
                    stakePool: rewardPoolPda,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY
                })
                .rpc();

            console.log('State initialized with tx:', tx);

            // Fetch the newly created state
            const state = await this.program.account.State.fetch(statePda);
            console.log('New state:', state);
            return state;
        } catch (error) {
            console.error('Error initializing state:', error);
            return this.getDefaultState();
        }
    }

    private async createTokenMint() {
        try {
            // Generate a new keypair for the mint
            const mintKeypair = web3.Keypair.generate();
            console.log('Creating token mint with address:', mintKeypair.publicKey.toString());

            // Calculate the minimum lamports required for rent exemption
            const lamports = await this.provider.connection.getMinimumBalanceForRentExemption(
                82 // Size of a mint account
            );

            // Create the token mint account
            const tx = new web3.Transaction().add(
                web3.SystemProgram.createAccount({
                    fromPubkey: this.provider.wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: 82,
                    lamports,
                    programId: TOKEN_PROGRAM_ID,
                }),
                // Initialize the mint
                createInitializeMintInstruction(
                    mintKeypair.publicKey, // mint
                    9, // decimals
                    this.provider.wallet.publicKey, // mintAuthority
                    this.provider.wallet.publicKey, // freezeAuthority
                    TOKEN_PROGRAM_ID
                )
            );

            // Send and confirm the transaction
            await this.provider.sendAndConfirm(tx, [mintKeypair]);
            console.log('Token mint created successfully');

            return mintKeypair.publicKey;
        } catch (error) {
            console.error('Error creating token mint:', error);
            throw error;
        }
    }

    private getDefaultState() {
        return {
            authority: this.provider.wallet.publicKey,
            totalDevices: new BN(0),
            totalTasks: new BN(0),
            totalRewardsDistributed: new BN(0),
            bump: 0
        };
    }

    async getAllDevices() {
        try {
            const devices = await this.program.account.device.all();
            console.log('Raw devices from chain:', devices);
            
            // Map the account data to match our interface
            return devices.map(d => {
                const account = d.account as any;
                return {
                    owner: account.owner.toString(),
                    specs: {
                        gpuModel: account.specs.gpuModel,
                        vram: account.specs.vram.toNumber(),
                        hashRate: account.specs.hashRate.toNumber()
                    },
                    isActive: account.isActive,
                    totalRewards: account.totalRewards.toNumber(),
                    isBanned: account.isBanned
                };
            });
        } catch (error) {
            console.log('Error fetching devices, using empty list:', error);
            return [];
        }
    }

    async registerDevice(
        gpuModel: string,
        vram: number,
        hashRate: number,
        referrer?: PublicKey
    ) {
        const device = web3.Keypair.generate();
        await this.program.methods
            .registerDevice(gpuModel, new BN(vram), new BN(hashRate), referrer || null)
            .accounts({
                owner: this.provider.wallet.publicKey,
                device: device.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .signers([device])
            .rpc();
        return device.publicKey;
    }

    async createTask(
        taskId: string,
        requirements: {
            minVram: number;
            minHashRate: number;
            minStake: number;
        }
    ) {
        const task = web3.Keypair.generate();
        await this.program.methods
            .createTask(taskId, {
                minVram: new BN(requirements.minVram),
                minHashRate: new BN(requirements.minHashRate),
                minStake: new BN(requirements.minStake),
            })
            .accounts({
                owner: this.provider.wallet.publicKey,
                task: task.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .signers([task])
            .rpc();
        return task.publicKey;
    }

    async assignTask(taskPubkey: PublicKey, devicePubkey: PublicKey) {
        await this.program.methods
            .assignTask()
            .accounts({
                authority: this.provider.wallet.publicKey,
                task: taskPubkey,
                device: devicePubkey,
            })
            .rpc();
    }

    async completeTask(taskPubkey: PublicKey, result: { success: boolean; data: string; error?: string }) {
        await this.program.methods
            .completeTask({
                success: result.success,
                data: result.data,
                error: result.error || null,
            })
            .accounts({
                authority: this.provider.wallet.publicKey,
                task: taskPubkey,
            })
            .rpc();
    }

    async distributeReward(
        devicePubkey: PublicKey,
        deviceOwnerTokenAccount: PublicKey,
        amount: number,
        referrerTokenAccount?: PublicKey
    ) {
        const [statePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('state')],
            this.programId
        );

        // Get reward pool PDA
        const [rewardPoolPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('reward_pool')],
            this.programId
        );

        const accounts: any = {
            authority: this.provider.wallet.publicKey,
            rewardPool: rewardPoolPda,
            deviceOwner: deviceOwnerTokenAccount,
            device: devicePubkey,
            state: statePda,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
        };

        if (referrerTokenAccount) {
            accounts.referrerAccount = referrerTokenAccount;
        }

        await this.program.methods
            .distributeReward(new BN(amount))
            .accounts(accounts)
            .rpc();
    }

    async updateDeviceStatus(devicePubkey: PublicKey, isActive: boolean) {
        await this.program.methods
            .updateDeviceStatus(isActive)
            .accounts({
                owner: this.provider.wallet.publicKey,
                device: devicePubkey,
            })
            .rpc();
    }

    async stakeTokens(
        devicePubkey: PublicKey,
        userTokenAccount: PublicKey,
        amount: number
    ) {
        const [statePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('state')],
            this.programId
        );
        
        // Get stake pool PDA
        const [stakePoolPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('stake_pool')],
            this.programId
        );

        await this.program.methods
            .stakeTokens(new BN(amount))
            .accounts({
                user: this.provider.wallet.publicKey,
                device: devicePubkey,
                state: statePda,
                userTokenAccount,
                stakePool: stakePoolPda,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();
    }

    async claimReferralRewards(
        devicePubkey: PublicKey,
        userTokenAccount: PublicKey
    ) {
        const [statePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('state')],
            this.programId
        );

        // Get reward pool PDA
        const [rewardPoolPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('reward_pool')],
            this.programId
        );

        await this.program.methods
            .claimReferralRewards()
            .accounts({
                user: this.provider.wallet.publicKey,
                device: devicePubkey,
                state: statePda,
                userTokenAccount,
                rewardPool: rewardPoolPda,
                authority: this.provider.wallet.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();
    }
}
