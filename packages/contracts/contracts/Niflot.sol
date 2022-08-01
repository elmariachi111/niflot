// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { ISuperfluid, ISuperToken, ISuperApp } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import { IConstantFlowAgreementV1 } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import { CFAv1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "hardhat/console.sol";

struct NiflotMetadata {
    uint256 duration;
    uint256 started;
    address origin;
    address receiver;
    ISuperToken token;
    int96 flowrate;
}

contract Niflot is ERC721, Ownable {
    using CFAv1Library for CFAv1Library.InitData;

    ISuperfluid private _host;

    IConstantFlowAgreementV1 private _cfa;
    CFAv1Library.InitData public cfaV1;

    event NiflotStarted(
        uint256 tokenId,
        address origin,
        address indexed receiver,
        uint256 indexed matureAt
    );

    event NiflotTerminated(
        uint256 tokenId,
        address indexed origin,
        address indexed receiver
    );

    mapping(uint256 => NiflotMetadata) public niflots;

    //todo: unused, do we need it anyway?!
    mapping(ISuperToken => bool) private _acceptedTokens;

    uint256 public nextId;

    constructor(ISuperfluid host) Ownable() ERC721("Niflot", "NFLOT") {
        _host = host;
        nextId = 1;

        assert(address(_host) != address(0));
        _cfa = IConstantFlowAgreementV1(
            address(
                host.getAgreementClass(
                    keccak256(
                        "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
                    )
                )
            )
        );
        cfaV1 = CFAv1Library.InitData(host, _cfa);
    }

    modifier exists(uint256 tokenId) {
        require(_exists(tokenId), "token doesn't exist or has been burnt");
        _;
    }

    function toggleAcceptToken(ISuperToken token, bool accept)
        public
        onlyOwner
    {
        _acceptedTokens[token] = accept;
    }

    function _decreaseFlow(
        ISuperToken token,
        address to,
        int96 by
    ) internal {
        (, int96 curRate, , ) = _cfa.getFlow(token, address(this), to);
        int96 newRate = curRate - by;
        require(newRate >= 0, "new rate would be negative");

        if (newRate == 0) {
            cfaV1.deleteFlow(address(this), to, token);
        } else {
            cfaV1.updateFlow(to, token, newRate);
        }
    }

    function _increaseFlow(
        ISuperToken token,
        address to,
        int96 by
    ) internal {
        (, int96 curRate, , ) = _cfa.getFlow(token, address(this), to);
        int96 newRate = curRate + by;
        require(newRate >= 0, "overflow");
        if (curRate == 0) {
            cfaV1.createFlow(to, token, by);
        } else {
            cfaV1.updateFlow(to, token, newRate);
        }
    }

    function _increaseFlowByOperator(
        ISuperToken token,
        address from,
        address to,
        int96 by
    ) internal {
        (, uint8 permissions, int96 allowance) = _cfa.getFlowOperatorData(
            token,
            from,
            address(this)
        );

        //always true when full control has been given
        require(permissions == 7, "origin hasn't permitted Niflot as operator");
        (, int96 curRate, , ) = _cfa.getFlow(token, from, to);

        int96 newRate = curRate + by;
        require(newRate >= 0, "overflow");
        require(
            newRate < allowance,
            "origin doesn't allow us to allocate that flowrate"
        );

        if (curRate == 0) {
            cfaV1.createFlowByOperator(from, to, token, by);
        } else {
            cfaV1.updateFlowByOperator(from, to, token, newRate);
        }
    }

    function _decreaseFlowByOperator(
        ISuperToken token,
        address from,
        address to,
        int96 by
    ) internal {
        (, int96 curRate, , ) = _cfa.getFlow(token, from, to);
        int96 newRate = curRate - by;
        require(newRate >= 0, "new rate would be negative");

        if (newRate == 0) {
            cfaV1.deleteFlowByOperator(from, to, token);
        } else {
            cfaV1.updateFlowByOperator(from, to, token, newRate);
        }
    }

    function mint(
        ISuperToken token,
        address origin,
        uint256 durationInSeconds
    ) external {
        //todo check if token is in _acceptedTokens
        (, int96 flowrate, , ) = _cfa.getFlow(token, origin, msg.sender);
        require(flowrate > 0, "origin isn't streaming to you");

        //delete original stream
        cfaV1.deleteFlowByOperator(origin, msg.sender, token);
        _increaseFlowByOperator(token, origin, address(this), flowrate);

        niflots[nextId] = NiflotMetadata({
            origin: origin,
            receiver: msg.sender,
            flowrate: flowrate,
            token: token,
            duration: durationInSeconds,
            started: 0
        });

        //will start streaming from niflot to msg.sender / receiver
        _mint(msg.sender, nextId);
        nextId += 1;
    }

    function burn(uint256 tokenId) external {
        //check that sender owns token or
        //owner is receiver and lending time has passed
        require(
            niflots[tokenId].started == 0 || isMature(tokenId),
            "cant burn a non mature niflot"
        );

        _burn(tokenId);

        emit NiflotTerminated(
            tokenId,
            niflots[tokenId].origin,
            niflots[tokenId].receiver
        );
    }

    function _recoverOriginalFlow(uint256 tokenId) internal {
        NiflotMetadata memory meta = niflots[tokenId];
        //reduce flowrate from operator to niflot
        _decreaseFlowByOperator(
            meta.token,
            meta.origin,
            address(this),
            meta.flowrate
        );
        //reinstantiate original flow
        _increaseFlowByOperator(
            meta.token,
            meta.origin,
            meta.receiver,
            meta.flowrate
        );
    }

    function _beforeTokenTransfer(
        address oldReceiver,
        address newReceiver,
        uint256 tokenId
    ) internal override {
        //blocks transfers to superApps - done for simplicity, but you could support super apps in a new version!
        require(
            !_host.isApp(ISuperApp(newReceiver)) ||
                newReceiver == address(this),
            "New receiver cannot be a superApp"
        );

        NiflotMetadata memory meta = niflots[tokenId];
        if (oldReceiver == address(0)) {
            //minted
            _increaseFlow(meta.token, newReceiver, meta.flowrate);
        } else if (newReceiver == address(0)) {
            //burnt
            _decreaseFlow(meta.token, oldReceiver, meta.flowrate);
            _recoverOriginalFlow(tokenId);
            delete niflots[tokenId];
        } else {
            if (newReceiver == meta.origin) {
                revert("can't transfer a niflot to its origin");
            }
            if (meta.started == 0) {
                niflots[tokenId].started = block.timestamp;
                emit NiflotStarted(
                    tokenId,
                    meta.origin,
                    meta.receiver,
                    block.timestamp + meta.duration
                );
            } else {
                if (isMature(tokenId)) {
                    revert("this niflot is mature and can only be burnt");
                }
            }

            //handover flow
            _decreaseFlow(meta.token, oldReceiver, meta.flowrate);
            _increaseFlow(meta.token, newReceiver, meta.flowrate);
        }
    }

    function endsAt(uint256 tokenId) public view returns (uint256) {
        if (niflots[tokenId].started == 0) return 0;

        return niflots[tokenId].started + niflots[tokenId].duration;
    }

    function isMature(uint256 tokenId) public view returns (bool) {
        uint256 _endsAt = endsAt(tokenId);
        if (_endsAt == 0) return false;
        return (_endsAt < block.timestamp);
    }

    function getNiflotData(uint256 tokenId)
        public
        view
        returns (
            address origin,
            address receiver,
            uint256 duration,
            uint256 started,
            uint256 until,
            ISuperToken token,
            int96 flowrate
        )
    {
        require(_exists(tokenId));
        NiflotMetadata memory meta = niflots[tokenId];
        return (
            meta.origin,
            meta.receiver,
            meta.duration,
            meta.started,
            endsAt(tokenId),
            meta.token,
            meta.flowrate
        );
    }
    // function metadata(uint256 tokenId)
    //     public
    //     view
    //     exists(tokenId)
    //     returns (
    //         int96 nftFlowrate,
    //         uint256 dueValue,
    //         uint256 until
    //     )
    // {
    //     (, nftFlowrate, , ) = _cfa.getFlow(
    //         _acceptedToken,
    //         address(this),
    //         ownerOf(tokenId)
    //     );

    //     uint256 secondsToGo = salaryPledges[tokenId].untilTs - block.timestamp;
    //     dueValue = uint256(int256(nftFlowrate)) * secondsToGo;
    //     until = salaryPledges[tokenId].untilTs;
    // }

    // function tokenURI(uint256 tokenId)
    //     public
    //     view
    //     override
    //     exists(tokenId)
    //     returns (string memory)
    // {
    //     (int96 nftFlowrate, uint256 dueValue, uint256 until) = metadata(
    //         tokenId
    //     );
    //     return
    //         _sellaryRenderer.metadata(
    //             tokenId,
    //             _acceptedToken.symbol(),
    //             nftFlowrate,
    //             dueValue,
    //             until
    //         );
    // }
}
