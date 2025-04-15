import { create } from 'zustand';
// Removed unused PublicKey import

export interface DeviceSpecs {
    cpuModel: string;
    cpuCores: number;
    cpuThreads: number;
    memoryTotal: number;
    gpuModel?: string;
    gpuMemory?: number;
    osType: string;
    osVersion: string;
    browserType: string;
    browserVersion: string;
}

export interface Device {
    id: string;
    name: string;
    type: 'desktop' | 'laptop' | 'mobile' | 'server';
    ownerPublicKey: string;
    specs: DeviceSpecs;
    status: 'online' | 'offline' | 'busy';
    lastSeen: number;
    totalEarnings: number;
    performance: {
        avgCpuUsage: number;
        avgMemoryUsage: number;
        avgGpuUsage?: number;
        taskSuccessRate: number;
        totalTasksCompleted: number;
    };
}

interface DeviceState {
    devices: Map<string, Device>;
    activeDevice: string | null;
    addDevice: (device: Device) => void;
    removeDevice: (deviceId: string) => void;
    updateDeviceStatus: (deviceId: string, status: Device['status']) => void;
    updateDevicePerformance: (deviceId: string, performance: Partial<Device['performance']>) => void;
    setActiveDevice: (deviceId: string | null) => void;
    getDevicesByOwner: (ownerPublicKey: string) => Device[];
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
    devices: new Map(),
    activeDevice: null,

    addDevice: (device) => set((state) => {
        const devices = new Map(state.devices);
        devices.set(device.id, device);
        return { devices };
    }),

    removeDevice: (deviceId) => set((state) => {
        const devices = new Map(state.devices);
        devices.delete(deviceId);
        return { devices };
    }),

    updateDeviceStatus: (deviceId, status) => set((state) => {
        const devices = new Map(state.devices);
        const device = devices.get(deviceId);
        if (device) {
            devices.set(deviceId, {
                ...device,
                status,
                lastSeen: Date.now()
            });
        }
        return { devices };
    }),

    updateDevicePerformance: (deviceId, performance) => set((state) => {
        const devices = new Map(state.devices);
        const device = devices.get(deviceId);
        if (device) {
            devices.set(deviceId, {
                ...device,
                performance: {
                    ...device.performance,
                    ...performance
                }
            });
        }
        return { devices };
    }),

    setActiveDevice: (deviceId) => set({ activeDevice: deviceId }),

    getDevicesByOwner: (ownerPublicKey) => {
        const { devices } = get();
        return Array.from(devices.values())
            .filter(device => device.ownerPublicKey === ownerPublicKey)
            .sort((a, b) => b.lastSeen - a.lastSeen);
    }
}));

export class DeviceDetector {
    static async detectSpecs(): Promise<DeviceSpecs> {
        const ua = navigator.userAgent;
        const browserInfo = this.detectBrowser(ua);
        
        return {
            cpuModel: await this.getCpuModel(),
            cpuCores: navigator.hardwareConcurrency || 1,
            cpuThreads: navigator.hardwareConcurrency || 1,
            memoryTotal: this.getMemorySize(),
            gpuModel: await this.getGpuInfo(),
            osType: this.detectOS(ua),
            osVersion: this.detectOSVersion(ua),
            browserType: browserInfo.type,
            browserVersion: browserInfo.version
        };
    }

    private static async getCpuModel(): Promise<string> {
        try {
            // Use available APIs to detect CPU
            if ('deviceMemory' in navigator) {
                return `${navigator.hardwareConcurrency}-Core Processor`;
            }
            return 'Generic CPU';
        } catch {
            return 'Unknown CPU';
        }
    }

    private static getMemorySize(): number {
        try {
            // @ts-ignore: deviceMemory is not in the navigator type yet
            return navigator.deviceMemory ? navigator.deviceMemory * 1024 : 4096;
        } catch {
            return 4096; // Default to 4GB
        }
    }

    private static async getGpuInfo(): Promise<string | undefined> {
        try {
            const gl = document.createElement('canvas').getContext('webgl');
            if (!gl) return undefined;

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (!debugInfo) return undefined;

            return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        } catch {
            return undefined;
        }
    }

    private static detectOS(ua: string): string {
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac OS')) return 'MacOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        return 'Unknown';
    }

    private static detectOSVersion(ua: string): string {
        const matches = ua.match(/(Windows NT|Mac OS X|Android|iOS) ([0-9._]+)/);
        return matches ? matches[2] : 'Unknown';
    }

    private static detectBrowser(ua: string): { type: string; version: string } {
        if (ua.includes('Chrome')) return { type: 'Chrome', version: this.extractVersion(ua, 'Chrome') };
        if (ua.includes('Firefox')) return { type: 'Firefox', version: this.extractVersion(ua, 'Firefox') };
        if (ua.includes('Safari')) return { type: 'Safari', version: this.extractVersion(ua, 'Safari') };
        if (ua.includes('Edge')) return { type: 'Edge', version: this.extractVersion(ua, 'Edge') };
        return { type: 'Unknown', version: '0.0' };
    }

    private static extractVersion(ua: string, browser: string): string {
        const matches = ua.match(new RegExp(`${browser}\\/([0-9.]+)`));
        return matches ? matches[1] : '0.0';
    }

    static detectDeviceType(): Device['type'] {
        const ua = navigator.userAgent.toLowerCase();
        
        if (ua.includes('mobile')) return 'mobile';
        if (ua.includes('laptop') || ua.includes('macbook')) return 'laptop';
        if (ua.includes('server') || ua.includes('linux')) return 'server';
        return 'desktop';
    }

    static generateDeviceId(ownerPublicKey: string, specs: DeviceSpecs): string {
        const deviceData = `${ownerPublicKey}:${specs.cpuModel}:${specs.memoryTotal}:${specs.browserType}`;
        return btoa(deviceData).slice(0, 32);
    }
}
