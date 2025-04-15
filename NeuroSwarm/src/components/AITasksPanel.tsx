import { useEffect, useState, useRef, useCallback } from 'react';
import { AITask, TaskType } from '../services/SupabaseService';
import { useNetworkStore } from '../core/ComputeNetwork';
import { Activity, Zap, Clock, ExternalLink } from 'lucide-react';

interface AITasksPanelProps {
    supabaseService: any;
}

interface BlockchainDetails {
    txHash: string;
    blockHeight: number;
    confirmations: number;
    gasUsed: number;
    fee: number;
}

// Mock data generator
const generateMockTask = (id: number): AITask & { blockchain: BlockchainDetails } => {
    const types: TaskType[] = ['image_generation', 'chat', 'image_classification', 'image_editing'];
    const statuses: AITask['status'][] = ['pending', 'processing', 'completed', 'failed'];
    const imageUrls = [
        'https://picsum.photos/800/600',
        'https://picsum.photos/801/600',
        'https://picsum.photos/800/601',
        'https://picsum.photos/801/601'
    ];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate mock blockchain details
    const blockchain: BlockchainDetails = {
        txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        blockHeight: Math.floor(Math.random() * 1000000) + 15000000,
        confirmations: Math.floor(Math.random() * 100) + 1,
        gasUsed: Math.floor(Math.random() * 200000) + 50000,
        fee: Number((Math.random() * 0.01).toFixed(6))
    };
    
    return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        prompt: type === 'image_generation' 
            ? `Generate a beautiful ${['landscape', 'portrait', 'abstract art', 'sci-fi scene'][Math.floor(Math.random() * 4)]}`
            : type === 'chat'
            ? `Tell me about ${['artificial intelligence', 'blockchain', 'quantum computing', 'space exploration'][Math.floor(Math.random() * 4)]}`
            : `Analyze this ${['photo', 'artwork', 'document', 'diagram'][Math.floor(Math.random() * 4)]}`,
        result: type === 'image_generation' && status === 'completed' 
            ? imageUrls[Math.floor(Math.random() * imageUrls.length)]
            : type === 'chat' && status === 'completed'
            ? 'Here is a detailed response about the topic you asked...'
            : '',
        status,
        created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        compute_time: Math.random() * 10 + 1,
        gpu_usage: Math.random() * 60 + 20,
        blockchain
    };
};

export function AITasksPanel({ supabaseService: _ }: AITasksPanelProps) {
    const [tasks, setTasks] = useState<(AITask & { blockchain: BlockchainDetails })[]>([]);
    const [selectedType, setSelectedType] = useState<TaskType>('all');
    const [loading, setLoading] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);
    const updateNetworkStats = useNetworkStore(state => state.updateStats);

    const stats = {
        total_tasks: 1254,
        avg_compute_time: 4.2,
        success_rate: 95.8
    };

    // Load initial mock data
    useEffect(() => {
        const initialTasks = Array.from({ length: 20 }, (_, i) => generateMockTask(i));
        setTasks(initialTasks);
        updateNetworkStats({
            networkLoad: 65,
            networkEfficiency: stats.success_rate,
        });
    }, []);

    // Infinite scroll handler
    const lastTaskElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setLoading(true);
                setTimeout(() => {
                    setTasks(prev => [
                        ...prev,
                        ...Array.from({ length: 10 }, (_, i) => generateMockTask(prev.length + i))
                    ]);
                    setLoading(false);
                }, 500);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading]);

    // Filter tasks by type
    const filteredTasks = tasks.filter(task => 
        selectedType === 'all' || task.type === selectedType
    );

    return (
        <div className="w-full p-6 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">AI Tasks Panel</h2>
                <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as TaskType)}
                    className="bg-gray-900/50 text-white rounded border border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Tasks</option>
                    <option value="image_generation">Image Generation</option>
                    <option value="chat">Uncensored Chat</option>
                    <option value="image_classification">Image Classification</option>
                    <option value="image_editing">Image Editing</option>
                </select>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-md bg-gray-900/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2 text-yellow-500">
                        <Activity className="w-4 h-4" />
                        <span className="text-gray-300">Total Tasks</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.total_tasks}</div>
                </div>
                <div className="p-4 rounded-md bg-gray-900/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2 text-blue-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-gray-300">Avg Time</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.avg_compute_time.toFixed(2)}s</div>
                </div>
                <div className="p-4 rounded-md bg-gray-900/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2 text-green-500">
                        <Zap className="w-4 h-4" />
                        <span className="text-gray-300">Success Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.success_rate.toFixed(1)}%</div>
                </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900/50">
                {filteredTasks.map((task, index) => (
                    <div 
                        key={task.id} 
                        ref={index === filteredTasks.length - 1 ? lastTaskElementRef : null}
                        className="p-4 rounded-md bg-gray-900/50 border border-gray-700/50 transition-all hover:bg-gray-800/50"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-white">{task.prompt}</h3>
                            <span className={`px-2 py-1 rounded text-sm ${
                                task.status === 'completed' ? 'bg-green-900/50 text-green-400 border border-green-700/50' :
                                task.status === 'processing' ? 'bg-blue-900/50 text-blue-400 border border-blue-700/50' :
                                task.status === 'failed' ? 'bg-red-900/50 text-red-400 border border-red-700/50' :
                                'bg-gray-900/50 text-gray-400 border border-gray-700/50'
                            }`}>
                                {task.status}
                            </span>
                        </div>
                        {task.type === 'image_generation' && task.status === 'completed' && task.result && (
                            <div className="mt-2 rounded-md overflow-hidden border border-gray-700/50">
                                <img 
                                    src={task.result} 
                                    alt={task.prompt}
                                    className="w-full h-48 object-cover"
                                    loading="lazy"
                                />
                            </div>
                        )}
                        {task.type === 'chat' && task.status === 'completed' && task.result && (
                            <p className="mt-2 text-gray-400">{task.result}</p>
                        )}
                        
                        {/* Task Metrics */}
                        <div className="mt-2 text-sm text-gray-400 flex justify-between items-center">
                            <div>
                                <span>Compute Time: {task.compute_time.toFixed(1)}s</span>
                                <span className="mx-2 text-gray-600">•</span>
                                <span>GPU Usage: {task.gpu_usage.toFixed(1)}%</span>
                            </div>
                            <span className="text-xs text-gray-500">{new Date(task.created_at).toLocaleString()}</span>
                        </div>

                        {/* Blockchain Details */}
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Transaction Hash</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono text-blue-400 truncate">
                                            {task.blockchain.txHash.slice(0, 16)}...{task.blockchain.txHash.slice(-8)}
                                        </span>
                                        <a 
                                            href={`https://solscan.io/tx/${task.blockchain.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Block Height</div>
                                    <div className="text-sm text-white">#{task.blockchain.blockHeight.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-2">
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Confirmations</div>
                                    <div className="text-sm text-white">{task.blockchain.confirmations}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Gas Used</div>
                                    <div className="text-sm text-white">{task.blockchain.gasUsed.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Fee</div>
                                    <div className="text-sm text-white">{task.blockchain.fee} SOL</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
