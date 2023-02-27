import { BeanstalkApi } from './BeanstalkApi';
import { ExponentialBackoff } from './ExponentialBackoff_V2';

// Define interface for the data returned from Beanstalk API
interface BeanstalkData {
    data: {
        seasons: {
            id: string;
            season: number;
            price: number;
            deltaBeans: number;
            rewardBeans: number;
        }[];
        fields: {
            podIndex: number;
            harvestablePods: number;
            harvestedPods: number;
        }[];
    };
}

// Define APIInterface class
export class APIInterface {
    // API key for Beanstalk API
    private readonly apiKey: string;
    // BeanstalkApi instance
    private readonly beanstalkApi: BeanstalkApi;

    constructor(apiKey: string) {
        // Initialize API key and BeanstalkApi instance
        this.apiKey = apiKey;
        this.beanstalkApi = new BeanstalkApi(this.apiKey);
    }

    // Method to fetch data from Beanstalk API with retry using ExponentialBackoff
    async fetchDataWithRetry(): Promise<BeanstalkData> {
        // Create ExponentialBackoff instance with fetchData method as argument
        const backoff = new ExponentialBackoff(this.fetchData.bind(this));
        // Execute ExponentialBackoff and return the data
        return backoff.execute();
    }

    // Private method to fetch data from Beanstalk API
    private async fetchData(): Promise<BeanstalkData> {
        // Call BeanstalkApi's getData method to fetch data
        const response = await this.beanstalkApi.getData();
        // Return the response data as BeanstalkData
        return response.data as BeanstalkData;
    }
}
