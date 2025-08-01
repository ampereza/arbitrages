export type NetworkType = {
    currentProvider: {
        host: string;
    }
    eth: {
        Contract: new (abi: any, address: string) => any;
        getGasPrice(): Promise<string>;
        estimateGas(txParams: any): Promise<number>;
        getBlockNumber(): Promise<number>;
        getBlock(blockNumber: number): Promise<{
            baseFeePerGas: string;
            [key: string]: any;
        }>;
        abi: {
            encodeFunctionCall(params: {
                name: string;
                type: string;
                inputs: Array<{
                    type: string;
                    name: string;
                }>;
            }, args: any[]): string;
        };
    }
};
