import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    unit: string;
    change: number;
}

function StatCard({ title, value, unit, change }: StatCardProps) {
    const isPositive = change >= 0;
    const changeAbs = Math.abs(change);
    
    return (
        <div className="p-4 rounded-xl bg-[#0F1520] relative overflow-hidden">
            <div className="flex flex-col">
                <span className="text-gray-400 text-sm mb-1">{title}</span>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-bold text-white tracking-tight">
                        {typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">{unit}</span>
                </div>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-[#4ADE80]' : 'text-[#F75555]'}`}>
                    {isPositive ? (
                        <ArrowUpIcon className="w-3 h-3" />
                    ) : (
                        <ArrowDownIcon className="w-3 h-3" />
                    )}
                    <span className="text-xs">{changeAbs.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
}

export function NetworkStats() {
    const stats = [
        {
            title: 'Total\nNodes',
            value: 991.49,
            unit: 'nodes',
            change: 5.2
        },
        {
            title: 'Active\nNodes',
            value: 861.82,
            unit: 'nodes',
            change: 3.1
        },
        {
            title: 'Network\nLoad',
            value: 67.87,
            unit: '%',
            change: -2.4
        },
        {
            title: 'Reward\nPool',
            value: '500,000.00',
            unit: 'NLOV',
            change: 7.8
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
                <StatCard
                    key={stat.title}
                    title={stat.title.replace('\n', ' ')}
                    value={stat.value}
                    unit={stat.unit}
                    change={stat.change}
                />
            ))}
        </div>
    );
}
