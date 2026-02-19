import { ethers } from "hardhat";

async function main() {
    console.log("Deploying InventoryTracker contract...");

    const inventoryTracker = await ethers.deployContract("InventoryTracker");

    await inventoryTracker.waitForDeployment();

    console.log(
        `InventoryTracker deployed to ${inventoryTracker.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
