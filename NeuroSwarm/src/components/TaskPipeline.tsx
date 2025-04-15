import { useEffect, useState } from 'react';
import { ISolanaService } from '../services/SolanaService';
import { SupabaseService } from '../services/SupabaseService';
import { TaskRequirements } from '../services/SolanaService';

interface TaskPipelineProps {
    solanaService: ISolanaService;
    supabaseService: SupabaseService;
}

export function TaskPipeline({ solanaService, supabaseService }: TaskPipelineProps) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            setError(null);
            try {
                const tasks = await supabaseService.getRecentTasks(50);
                setTasks(tasks);
            } catch (err) {
                setError('Failed to fetch tasks: ' + (err instanceof Error ? err.message : 'Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
        const interval = setInterval(fetchTasks, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [supabaseService, refreshKey]);

    const processTask = async (taskId: string, requirements: TaskRequirements) => {
        setProcessing(true);
        setError(null);

        try {
            const result = await solanaService.processTaskFromSupabase(
                taskId,
                'ai_processing',
                requirements
            );
            console.log('Task processed:', result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setProcessing(false);
        }
    };

    const retryFetch = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Task Processing Pipeline</h2>
                <button
                    onClick={retryFetch}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
            
            {error && (
                <div className="bg-red-800 text-red-200 p-2 mb-4 rounded">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task.id} className="bg-gray-700 p-3 rounded">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">Task {task.id}</h3>
                                <p className="text-sm">{task.type}</p>
                            </div>
                            <button
                                onClick={() => processTask(task.id, task.requirements)}
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Process Task'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
