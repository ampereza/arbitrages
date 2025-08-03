import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
export type NetworkType = 'arbitrum' | 'mainnet';
export type Web3Instance = Web3;
export interface Web3Contract extends Contract {
    methods: {
        [key: string]: (...args: any[]) => {
            call: (options?: any) => Promise<any>;
            send: (options?: any) => Promise<any>;
            encodeABI: () => string;
        };
    };
    events: {
        [key: string]: {
            (options?: any, cb?: Function): any;
        };
    };
}
