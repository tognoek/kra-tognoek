// job-queue.ts
import { createClient, RedisClientType } from 'redis';

/**
 * Job interface
 */
export interface Job {
    id: string;
    task: string;
    data: any;
    timestamp: number;
}

export class JobQueue {
    private client: RedisClientType;
    private connected: boolean = false;
    private queueName: string;

    constructor(
        queueName: string = 'job_queue',
        private redisUrl: string = 'redis://127.0.0.1:6379'
    ) {
        this.queueName = queueName;
        
        this.client = createClient({ url: this.redisUrl });
        
        this.client.on('error', (err: any) => {
            console.error('❌ Redis Error:', err);
        });
    }

    async connect(): Promise<void> {
        if (!this.connected) {
            await this.client.connect();
            this.connected = true;
            console.log(`✅ Connected to Redis (queue: ${this.queueName})`);
        }
    }

    async disconnect(): Promise<void> {
        if (this.connected) {
            await this.client.disconnect();
            this.connected = false;
            console.log('👋 Disconnected from Redis');
        }
    }

    async addJob(job: Omit<Job, 'id' | 'timestamp'>): Promise<string> {
        if (!this.connected) {
            throw new Error('Not connected to Redis. Call connect() first.');
        }

        const fullJob: Job = {
            id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...job
        };

        const jobJson = JSON.stringify(fullJob);
        await this.client.rPush(this.queueName, jobJson);

        return fullJob.id;
    }
}