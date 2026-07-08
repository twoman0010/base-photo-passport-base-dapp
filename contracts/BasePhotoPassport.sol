// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BasePhotoPassport is ERC721URIStorage, Ownable {
    uint256 public nextTokenId = 1;

    event PassportMinted(address indexed owner, uint256 indexed tokenId, string tokenURI);

    constructor(address initialOwner) ERC721("Base Photo Passport", "BPHOTO") Ownable(initialOwner) {}

    function mint(string calldata tokenURI) external returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit PassportMinted(msg.sender, tokenId, tokenURI);
    }
}
