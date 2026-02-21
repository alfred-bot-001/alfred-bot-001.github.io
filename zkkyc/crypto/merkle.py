"""Merkle Tree for credential revocation accumulator.

Each leaf is a credential ID hash. The root is published on-chain.
To prove non-revocation, holder proves membership in the valid set.
"""
import hashlib
from typing import Optional


def _hash_node(left: str, right: str) -> str:
    return hashlib.sha256((left + right).encode()).hexdigest()


def _hash_leaf(data: str) -> str:
    return hashlib.sha256(("leaf:" + data).encode()).hexdigest()


class MerkleTree:
    def __init__(self):
        self.leaves: list[str] = []
        self.leaf_data: list[str] = []
        self.layers: list[list[str]] = []
        self.root: str = ""

    def add_leaf(self, data: str):
        """Add a credential ID to the tree."""
        self.leaf_data.append(data)
        self.leaves.append(_hash_leaf(data))

    def build(self):
        """Build the Merkle tree from current leaves."""
        if not self.leaves:
            self.root = hashlib.sha256(b"empty").hexdigest()
            self.layers = []
            return
        # Pad to power of 2
        leaves = list(self.leaves)
        while len(leaves) & (len(leaves) - 1):
            leaves.append(hashlib.sha256(b"padding").hexdigest())
        self.layers = [leaves]
        current = leaves
        while len(current) > 1:
            next_layer = []
            for i in range(0, len(current), 2):
                next_layer.append(_hash_node(current[i], current[i + 1]))
            self.layers.append(next_layer)
            current = next_layer
        self.root = current[0]

    def get_proof(self, data: str) -> Optional[dict]:
        """Get a Merkle proof for a leaf."""
        leaf_hash = _hash_leaf(data)
        if leaf_hash not in self.leaves:
            return None
        idx = self.leaves.index(leaf_hash)
        # Rebuild with padding
        self.build()
        proof_nodes = []
        current_idx = idx
        for layer in self.layers[:-1]:
            if current_idx % 2 == 0:
                sibling_idx = current_idx + 1
                direction = "right"
            else:
                sibling_idx = current_idx - 1
                direction = "left"
            if sibling_idx < len(layer):
                proof_nodes.append({"hash": layer[sibling_idx], "direction": direction})
            current_idx //= 2
        return {
            "leaf": data,
            "leaf_hash": leaf_hash,
            "proof": proof_nodes,
            "root": self.root,
        }

    @staticmethod
    def verify_proof(leaf_data: str, proof_nodes: list, root: str) -> bool:
        """Verify a Merkle proof."""
        current = _hash_leaf(leaf_data)
        for node in proof_nodes:
            if node["direction"] == "right":
                current = _hash_node(current, node["hash"])
            else:
                current = _hash_node(node["hash"], current)
        return current == root

    def remove_leaf(self, data: str) -> bool:
        """Remove a leaf (revoke credential) and rebuild."""
        if data in self.leaf_data:
            idx = self.leaf_data.index(data)
            self.leaf_data.pop(idx)
            self.leaves.pop(idx)
            self.build()
            return True
        return False
