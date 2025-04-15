import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, History, Calendar } from 'lucide-react';

interface EarningHistory {
    date: string;
    amount: number;
    tasks: number;
}

interface PayoutDetails {
    address: string;
    network: string;
    minPayout: number;
    nextPayout: string;
}

const generateMockEarnings = (): EarningHistory[] => {
    const days = 30;
    const data: EarningHistory[] = [];
    let total = 0;

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const amount = Math.random() * 50 + 20; // Random daily earnings between 20-70 NLOV
        total += amount;
        
        data.push({
            date: date.toISOString().split('T')[0],
            amount,
            tasks: Math.floor(Math.random() * 20 + 10) // Random tasks between 10-30
        });
    }

    return data;
};

export function EarningsPanel() {
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const earningHistory = generateMockEarnings();
    
    const totalEarnings = earningHistory.reduce((sum, day) => sum + day.amount, 0);
    const totalTasks = earningHistory.reduce((sum, day) => sum + day.tasks, 0);
    const avgDailyEarnings = totalEarnings / earningHistory.length;
    
    // Project monthly earnings based on daily average
    const projectedMonthly = avgDailyEarnings * 30;

    const payoutDetails: PayoutDetails = {
        address: '7xKX...9YbG',
        network: 'Solana',
        minPayout: 100,
        nextPayout: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString() // 3 days from now
    };

    return (
        <div className="p-6 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Earnings Dashboard</h2>
                <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
                    className="bg-gray-900/50 text-white rounded border border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-md bg-gray-900/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2 text-blue-500">
                        <Wallet className="w-4 h-4" />
                        <span className="text-gray-300">Total Earnings</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {totalEarnings.toFixed(2)} NLOV
                    </div>
                </div>

                <div className="p-4 rounded-md bg-gray-900/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2 text-green-500">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-gray-300">Projected Monthly</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {projectedMonthly.toFixed(2)} NLOV
                    </div>
                </div>

                <div className="p-4 rounded-md bg-gray-900/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2 text-yellow-500">
                        <History className="w-4 h-4" />
                        <span className="text-gray-300">Total Tasks</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {totalTasks}
                    </div>
                </div>

                <div className="p-4 rounded-md bg-gray-900/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2 text-purple-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-gray-300">Daily Average</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {avgDailyEarnings.toFixed(2)} NLOV
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Earnings Chart */}
                <div className="lg:col-span-2 p-4 rounded-md bg-gray-900/50 border border-gray-700/50">
                    <h3 className="text-white font-medium mb-4">Earnings History</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={earningHistory}>
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#6B7280"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                />
                                <YAxis stroke="#6B7280" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '0.375rem'
                                    }}
                                    labelStyle={{ color: '#E5E7EB' }}
                                    itemStyle={{ color: '#60A5FA' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#60A5FA" 
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payout Details */}
                <div className="p-4 rounded-md bg-gray-900/50 border border-gray-700/50">
                    <h3 className="text-white font-medium mb-4">Payout Details</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="text-gray-400 text-sm">Wallet Address</div>
                            <div className="text-white font-mono">{payoutDetails.address}</div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-sm">Network</div>
                            <div className="text-white">{payoutDetails.network}</div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-sm">Minimum Payout</div>
                            <div className="text-white">{payoutDetails.minPayout} NLOV</div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-sm">Next Payout Date</div>
                            <div className="text-white">{payoutDetails.nextPayout}</div>
                        </div>
                        <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors">
                            Withdraw Earnings
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="mt-6 p-4 rounded-md bg-gray-900/50 border border-gray-700/50">
                <h3 className="text-white font-medium mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                    {earningHistory.slice(-5).map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                            <div>
                                <div className="text-white">{new Date(day.date).toLocaleDateString()}</div>
                                <div className="text-sm text-gray-400">{day.tasks} tasks completed</div>
                            </div>
                            <div className="text-right">
                                <div className="text-green-400">+{day.amount.toFixed(2)} NLOV</div>
                                <div className="text-sm text-gray-400">≈ ${(day.amount * 2.5).toFixed(2)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
