import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Hardcoded for local Hardhat node
const LOCAL_RPC_URL = 'http://127.0.0.1:8545';
// This assumes the first account from Hardhat node is used as the deployer/signer
// In a real app, this would be a secure private key from .env
// Hardhat Account #0 (Deterministic for local node)
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export class InventoryChainService {
    private static provider: ethers.JsonRpcProvider;
    private static signer: ethers.Wallet;
    private static contract: ethers.Contract;
    // Address from deployment
    private static contractAddress: string = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

    // ABI extracted from compilation (simplified for this demo)
    private static abi = [
        "function recordMovement(string memory _itemId, string memory _fromLocation, string memory _toLocation, uint256 _quantity, string memory _movementType, string memory _ipfsHash) public",
        "function getMovementHistory(string memory _itemId) public view returns (tuple(string itemId, string fromLocation, string toLocation, uint256 quantity, string movementType, address handler, uint256 timestamp, string ipfsHash)[])",
        "event InventoryMoved(string indexed itemId, string indexed fromLocation, string indexed toLocation, uint256 quantity, string movementType, address handler, uint256 timestamp)"
    ];

    static async initialize() {
        try {
            this.provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
            // Ensure network is ready
            await this.provider.getNetwork();

            this.signer = new ethers.Wallet(PRIVATE_KEY, this.provider);
            this.contract = new ethers.Contract(this.contractAddress, this.abi, this.signer);
            console.log('InventoryChainService initialized with contract:', this.contractAddress);
        } catch (error) {
            console.error("Failed to initialize InventoryChainService", error);
        }
    }

    static async recordMovement(data: {
        deliveryId: string;
        itemId: string;
        fromLocation: string;
        toLocation: string;
        quantity: number;
        movementType: string;
    }) {
        // 1. Write to Blockchain
        try {
            if (!this.contract) throw new Error('Contract not initialized');

            console.log(`Recording movement for ${data.itemId} on-chain...`);
            const tx = await this.contract.recordMovement(
                data.itemId,
                data.fromLocation,
                data.toLocation,
                BigInt(Math.floor(data.quantity)),
                data.movementType,
                "QmPlaceholderHash" // Simulated IPFS hash
            );

            console.log('Transaction sent:', tx.hash);
            const receipt = await tx.wait();

            // Calculate a "movement hash" for verification (simplified)
            const movementHash = ethers.keccak256(ethers.toUtf8Bytes(
                `${data.itemId}-${data.fromLocation}-${data.toLocation}-${data.quantity}-${data.movementType}-${receipt.blockNumber}`
            ));

            // 2. Write to Database
            await prisma.inventoryChainRecord.create({
                data: {
                    deliveryId: data.deliveryId,
                    itemId: data.itemId,
                    fromLocation: data.fromLocation,
                    toLocation: data.toLocation,
                    quantity: data.quantity,
                    movementType: data.movementType,
                    txHash: tx.hash,
                    blockNumber: receipt.blockNumber,
                    movementHash: movementHash,
                    verifiedAt: new Date() // In this demo, considered verified upon mining
                }
            });

            return { success: true, txHash: tx.hash };
        } catch (error) {
            console.error('Error recording movement:', error);
            // Create alert
            await prisma.inventoryAlert.create({
                data: {
                    itemId: data.itemId,
                    alertType: 'BLOCKCHAIN_WRITE_FAILED',
                    description: error instanceof Error ? error.message : 'Unknown error',
                    resolved: false
                }
            });
            return { success: false, error };
        }
    }

    static async getHistory(itemId: string) {
        if (!this.contract) return [];
        try {
            const history = await this.contract.getMovementHistory(itemId);
            // Transform struct array to readable objects
            return history.map((m: any) => ({
                itemId: m[0],
                fromLocation: m[1],
                toLocation: m[2],
                quantity: Number(m[3]),
                movementType: m[4],
                handler: m[5],
                timestamp: new Date(Number(m[6]) * 1000).toISOString(),
                ipfsHash: m[7]
            }));
        } catch (e) {
            console.error("Failed to get history", e);
            return [];
        }
    }
}
