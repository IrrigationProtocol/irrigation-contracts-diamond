// Define the inputs for the function
interface PricingInputs {
    ID: number;
    amount_pods: number;
    harvestableIndex: number;
    podIndex: number;
}

export class Pricing_Pods {
    // Define the constructor for the class, which will set the input values
    constructor(private inputs: PricingInputs) { }

    // Define the main function for the class, which will return the BDV_Value_range
    calculateBDV_Value_range(): number {
        // Calculate the fraction
        const fraction = 1 / (this.inputs.podIndex - this.inputs.harvestableIndex);

        // Calculate the median_pod
        const median_pod = ((this.inputs.amount_pods - 1) / 2) * 1000000;

        // Calculate the BDV_median_pod
        const BDV_median_pod = 1 - fraction * (median_pod - this.inputs.harvestableIndex);

        // Calculate the BDV_Value_range
        const BDV_Value_range = BDV_median_pod * this.inputs.amount_pods;

        // Return the result
        return BDV_Value_range;
    }
}
