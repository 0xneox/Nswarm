import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type TaskType = 'image' | 'video' | 'model' | 'text';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AITask {
    id: string;
    type: TaskType;
    prompt: string;
    result: string;
    status: TaskStatus;
    created_at: string;
    compute_time: number;
    gpu_usage: number;
    blockchain_task_id?: string;
    node_id?: string;
    reward_amount?: number;
    completion_signature?: string;
}

export interface Device {
    id: string;
    status: 'available' | 'busy' | 'offline';
    specs: {
        gpuModel: string;
        vram: number;
        hashRate: number;
    };
    gpuModel: string;
    vram: number;
    hashRate: number;
    owner: string;
    last_seen: string;
}

export interface TaskStats {
    total_tasks: number;
    avg_compute_time: number;
    success_rate: number;
}

export class SupabaseService {
    private client: SupabaseClient;
    private taskUpdateQueue: Map<string, Partial<AITask>>;
    private readonly BATCH_SIZE = 50;
    private readonly UPDATE_INTERVAL = 5000;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.client = createClient(supabaseUrl, supabaseKey);
        this.taskUpdateQueue = new Map();
        this.startUpdateLoop();
    }

    private startUpdateLoop = (): void => {
        setInterval(async () => {
            if (this.taskUpdateQueue.size === 0) return;

            await this.processBatchUpdates();
        }, this.UPDATE_INTERVAL);
    };

    private processBatchUpdates = async (): Promise<void> => {
        const updates = Array.from(this.taskUpdateQueue.entries())
            .slice(0, this.BATCH_SIZE);

        if (updates.length === 0) return;

        try {
            await Promise.all(
                updates.map(async ([taskId, updates]) => {
                    const { error } = await this.client
                        .from('tasks')
                        .update(updates)
                        .eq('id', taskId);

                    if (error) throw error;
                    this.taskUpdateQueue.delete(taskId);
                })
            );
        } catch (error) {
            console.error('Error processing batch updates:', error);
        }
    };

    getRecentTasks = async (limit: number = 50): Promise<AITask[]> => {
        try {
            const { data, error } = await this.client
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                // If table doesn't exist, return mock data
                if (error.code === '42P01') {
                    console.log('Tasks table not found, using mock data');
                    return this.getMockTasks();
                }
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching recent tasks:', error);
            return this.getMockTasks(); // Return mock data on error
        }
    };

    private getMockTasks = (): AITask[] => {
        return [
            {
                id: 'mock-1',
                type: 'image',
                prompt: 'Sample AI task',
                result: '',
                status: 'pending',
                created_at: new Date().toISOString(),
                compute_time: 0,
                gpu_usage: 0
            }
        ];
    };

    getTasksByType = async (type: TaskType, limit: number = 20): Promise<AITask[]> => {
        try {
            const { data, error } = await this.client
                .from('tasks')
                .select('*')
                .eq('type', type)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching tasks by type:', error);
            throw new Error(`Failed to fetch tasks by type: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    getTask = async (taskId: string): Promise<AITask | null> => {
        try {
            const { data, error } = await this.client
                .from('tasks')
                .select('*')
                .eq('id', taskId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching task:', error);
            throw new Error(`Failed to fetch task: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    getAvailableDevices = async (): Promise<Device[]> => {
        try {
            const { data, error } = await this.client
                .from('devices')
                .select('*')
                .eq('status', 'available');

            if (error) {
                // If table doesn't exist, return mock data
                if (error.code === '42P01') {
                    console.log('Devices table not found, using mock data');
                    return this.getMockDevices();
                }
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching available devices:', error);
            return this.getMockDevices(); // Return mock data on error
        }
    };

    private getMockDevices = (): Device[] => {
        return [
            {
                id: 'mock-1',
                status: 'available',
                specs: {
                    gpuModel: 'NVIDIA RTX 4090',
                    vram: 24576,
                    hashRate: 1000
                },
                gpuModel: 'NVIDIA RTX 4090',
                vram: 24576,
                hashRate: 1000,
                owner: 'mock-owner',
                last_seen: new Date().toISOString()
            }
        ];
    };

    updateTaskStatus = async (taskId: string, status: TaskStatus, result?: string): Promise<void> => {
        const updates: Partial<AITask> = { status };
        if (result) updates.result = result;

        try {
            const { error } = await this.client
                .from('tasks')
                .update(updates)
                .eq('id', taskId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating task status:', error);
            throw new Error(`Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    getTaskStats = async (): Promise<TaskStats> => {
        try {
            const { data: tasks, error } = await this.client
                .from('tasks')
                .select('status,compute_time');

            if (error) throw error;

            const total_tasks = tasks.length;
            const completed_tasks = tasks.filter(t => t.status === 'completed').length;
            const compute_times = tasks.map(t => t.compute_time).filter(Boolean);

            return {
                total_tasks,
                avg_compute_time: compute_times.length ? compute_times.reduce((a, b) => a + b) / compute_times.length : 0,
                success_rate: total_tasks ? (completed_tasks / total_tasks) * 100 : 0
            };
        } catch (error) {
            console.error('Error fetching task stats:', error);
            throw new Error(`Failed to fetch task stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    getPendingTasks = async (limit: number = 20): Promise<AITask[]> => {
        try {
            const { data, error } = await this.client
                .from('tasks')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching pending tasks:', error);
            throw new Error(`Failed to fetch pending tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    updateTaskBlockchainDetails = async (taskId: string, updates: Partial<AITask>): Promise<void> => {
        this.taskUpdateQueue.set(taskId, {
            ...this.taskUpdateQueue.get(taskId),
            ...updates
        });
    };

    logTaskProof = async (proofData: { taskId: string; timestamp: number; success: boolean; signature: string }): Promise<void> => {
        try {
            const { error } = await this.client
                .from('task_proofs')
                .insert({
                    task_id: proofData.taskId,
                    timestamp: new Date(proofData.timestamp).toISOString(),
                    success: proofData.success,
                    signature: proofData.signature
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error logging task proof:', error);
            throw new Error(`Failed to log task proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
}
