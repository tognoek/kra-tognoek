// main.ts
import { JobQueue } from './jobQueue';

export class JobQueueManager {
    private static instance: JobQueue | null = null;

    static async initialize(
        queueName: string = 'job_queue',
        redisUrl: string = 'redis://127.0.0.1:6379'
    ): Promise<JobQueue> {
        if (JobQueueManager.instance) {
            return JobQueueManager.instance;
        }
        JobQueueManager.instance = new JobQueue(queueName, redisUrl);
        await JobQueueManager.instance.connect();

        return JobQueueManager.instance;
    }

    static getInstance(): JobQueue {
        if (!JobQueueManager.instance) {
            throw new Error('JobQueue not initialized. Call initialize() first.');
        }
        return JobQueueManager.instance;
    }

    static async shutdown(): Promise<void> {
        if (JobQueueManager.instance) {
            await JobQueueManager.instance.disconnect();
            JobQueueManager.instance = null;
        }
    }
}

export const getJobQueue = () => JobQueueManager.getInstance();

async function shutdown() {
    console.log('\n🛑 Shutting down...');
    await JobQueueManager.shutdown();
    process.exit(0);
}

async function main() {
    try {
        const jobQueue = await JobQueueManager.initialize(
            'job_queue',                    
            'redis://127.0.0.1:6379'       
        );
        console.log('✅ Main initialized. Use getJobQueue() in API handlers.\n');

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('SIGHUP', shutdown);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Only auto-run when executed directly (not when imported in API)
if (require.main === module) {
    main();
}