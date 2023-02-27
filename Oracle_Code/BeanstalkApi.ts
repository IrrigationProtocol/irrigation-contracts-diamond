// Importing the axios library for making HTTP requests
const axios = require('axios');


// Defining the BeanstalkApi class
export class BeanstalkApi {
    apiKey: string;
    url: string;
    query: string;

    // Constructor function for initializing the class properties
    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.url = 'https://api.thegraph.com/subgraphs/name/beanstalk-protocol/beanstalk?api_key=' + this.apiKey;
        this.query = `{
      seasons(
        first: 24,
        orderBy: season,
        orderDirection: desc
      ) {
        id
        season
        price
        deltaBeans # total change in supply
        rewardBeans # amount from Reward on Sunrise
      }
      fields: fieldHourlySnapshots(
        first: 24,
        where: { 
          field: "0xc1e088fc1323b20bcbee9bd1b9fc9546db5624c5"
        }
        orderBy: season,
        orderDirection: desc
      ) {
        podIndex
        harvestablePods
        harvestedPods
      }
    }`;
    }

    // Function for making a post request to the Beanstalk API endpoint
    async getData() {
        try {
            const response = await axios.post(this.url, { query: this.query });
            return response;
        } catch (error) {
            throw error;
        }
    }
}

//module.exports = BeanstalkApi;
