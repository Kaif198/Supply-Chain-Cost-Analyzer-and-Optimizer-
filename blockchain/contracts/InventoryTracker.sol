// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract InventoryTracker {
    struct Movement {
        string itemId;
        string fromLocation;
        string toLocation;
        uint256 quantity;
        string movementType; // DISPATCHED, IN_TRANSIT, ARRIVED, QUALITY_CHECKED, STORED, DELIVERED
        address handler;
        uint256 timestamp;
        string ipfsHash; // Optional: specific document hash (BOL, packing list)
    }

    // Mapping from Item ID to list of movements
    mapping(string => Movement[]) private movementHistory;
    
    // Mapping from Item ID to authorized handlers (simplified for this demo)
    mapping(string => mapping(address => bool)) public authorizedHandlers;

    event InventoryMoved(
        string indexed itemId,
        string indexed fromLocation,
        string indexed toLocation,
        uint256 quantity,
        string movementType,
        address handler,
        uint256 timestamp
    );

    event AlertRaised(
        string indexed itemId,
        string alertType,
        string description
    );

    constructor() {}

    function recordMovement(
        string memory _itemId,
        string memory _fromLocation,
        string memory _toLocation,
        uint256 _quantity,
        string memory _movementType,
        string memory _ipfsHash
    ) public {
        // In a real system, we'd check authorization here
        // require(authorizedHandlers[_itemId][msg.sender], "Unauthorized handler");

        Movement memory newMovement = Movement({
            itemId: _itemId,
            fromLocation: _fromLocation,
            toLocation: _toLocation,
            quantity: _quantity,
            movementType: _movementType,
            handler: msg.sender,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash
        });

        movementHistory[_itemId].push(newMovement);

        emit InventoryMoved(
            _itemId,
            _fromLocation,
            _toLocation,
            _quantity,
            _movementType,
            msg.sender,
            block.timestamp
        );
    }

    function getMovementHistory(string memory _itemId) public view returns (Movement[] memory) {
        return movementHistory[_itemId];
    }

    function verifyIntegrity(string memory _itemId, bytes32 _expectedHash) public view returns (bool) {
        // Simplified integrity check: hash the entire history and compare
        // In production, this would be more granular (Merkle tree root, etc.)
        bytes32 historyHash = keccak256(abi.encode(movementHistory[_itemId]));
        return historyHash == _expectedHash;
    }
    
    function getLatestLocation(string memory _itemId) public view returns (string memory) {
        uint256 len = movementHistory[_itemId].length;
        if (len == 0) return "";
        return movementHistory[_itemId][len - 1].toLocation;
    }
}
