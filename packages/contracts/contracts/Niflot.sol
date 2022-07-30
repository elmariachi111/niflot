// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { ISuperfluid, ISuperToken, ISuperApp } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import { IConstantFlowAgreementV1 } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import { CFAv1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "hardhat/console.sol";

struct NiflotMetadata {
    address origin;
    address receiver;
    int96 flowrate;
    ISuperToken token;
    uint256 untilTs;
}

contract Niflot is ERC721, Ownable {
    using CFAv1Library for CFAv1Library.InitData;

    ISuperfluid private _host;

    IConstantFlowAgreementV1 private _cfa;
    CFAv1Library.InitData public cfaV1;

    event NFTIssued(uint256 tokenId, address receiver, int96 flowRate);

    mapping(address => int96) public salaryFlowrates;
    mapping(address => uint256) public salaryToToken;
    mapping(uint256 => NiflotMetadata) public niflots;

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

    // function allow(address streamOwner, ISuperToken token) external {
    //     cfaV1.updateFlowOperatorPermissions(flowOperator, token, permissions, flowRateAllowance);
    // }

    function mint(ISuperToken token, address origin) external {
        //check msg.sender is receiver of a cfa
        (, int96 flowrate, , ) = _cfa.getFlow(token, origin, msg.sender);
        require(flowrate > 0, "flowRate must be positive!");

        cfaV1.deleteFlowByOperator(origin, msg.sender, token);
        cfaV1.createFlowByOperator(origin, address(this), token, flowrate);
        niflots[nextId] = NiflotMetadata({
            origin: origin,
            receiver: msg.sender,
            flowrate: flowrate,
            token: token,
            untilTs: 0
        });

        _mint(msg.sender, nextId);
        nextId += 1;
    }

    function burn(uint256 tokenId) external {
        //check that sender owns token or
        //owner is receiver and lending time has passed
        _burn(tokenId);
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
            "New receiver can not be a superApp"
        );

        NiflotMetadata memory meta = niflots[tokenId];
        if (oldReceiver == address(0)) {
            //minted
            cfaV1.createFlow(newReceiver, meta.token, meta.flowrate);
        } else if (newReceiver == address(0)) {
            //burnt
            cfaV1.deleteFlow(address(this), oldReceiver, meta.token);
            //reinstantiate original flow
            cfaV1.createFlowByOperator(
                meta.origin,
                meta.receiver,
                meta.token,
                meta.flowrate
            );
            delete niflots[tokenId];
        } else {
            cfaV1.deleteFlow(address(this), oldReceiver, meta.token);
            cfaV1.createFlow(newReceiver, meta.token, meta.flowrate);
        }
    }

    // function streamSalary(address receiver, int96 flowRate_)
    //     public
    // /*onlyEmployer*/
    // {
    //     //check that stream doesnt exist
    //     (, int96 nftFlowrate, , ) = _cfa.getFlow(
    //         _acceptedToken,
    //         address(this),
    //         receiver
    //     );
    //     if (nftFlowrate > 0) revert("this receiver already receives a salary");

    //     //check that no NFT is out there.
    //     if (salaryToToken[receiver] != 0) {
    //         revert("there is an NFT capturing this salary stream");
    //     }

    //     cfaV1.createFlow(receiver, _acceptedToken, flowRate_);
    //     salaryFlowrates[receiver] = flowRate_;
    // }

    // function issueSalaryNFT(address receiver, uint256 until) external {
    //     if (salaryFlowrates[msg.sender] == 0) {
    //         revert("you must receive a salary to mint an NFT");
    //     }
    //     (, int96 flowRate, , ) = _cfa.getFlow(
    //         _acceptedToken,
    //         address(this),
    //         msg.sender
    //     );
    //     if (flowRate == 0) {
    //         revert("you must receive a salary to mint an NFT");
    //     }

    //     console.logInt(flowRate);
    //     //cancel our current salary stream
    //     cfaV1.deleteFlow(address(this), msg.sender, _acceptedToken);
    //     _issueNFT(msg.sender, receiver, flowRate, until);
    // }

    // //use the common or predefined flow rate _acceptedToken
    // function _issueNFT(
    //     address employee_,
    //     address receiver,
    //     int96 flowRate,
    //     uint256 untilTs_
    // ) internal {
    //     require(flowRate > 0, "flowRate must be positive!");
    //     salaryPledges[nextId] = SalaryPledge({
    //         employee: employee_,
    //         untilTs: untilTs_
    //     });
    //     _mint(receiver, nextId);
    //     salaryToToken[employee_] = nextId;
    //     nextId += 1;
    // }

    // function _beforeTokenTransfer(
    //     address oldReceiver,
    //     address newReceiver,
    //     uint256 tokenId
    // ) internal override {
    //     //blocks transfers to superApps - done for simplicity, but you could support super apps in a new version!
    //     require(
    //         !_host.isApp(ISuperApp(newReceiver)) ||
    //             newReceiver == address(this),
    //         "New receiver can not be a superApp"
    //     );

    //     (, int96 flowRate, , ) = _cfa.getFlow(
    //         _acceptedToken,
    //         address(this),
    //         oldReceiver
    //     );

    //     if (flowRate > 0) {
    //         cfaV1.deleteFlow(address(this), oldReceiver, _acceptedToken);
    //     }
    //     if (newReceiver == address(0)) {
    //         //burnt
    //         address employee = salaryPledges[tokenId].employee;
    //         delete salaryPledges[tokenId];
    //         delete salaryToToken[employee];

    //         //setup old stream flow
    //         streamSalary(employee, flowRate);
    //     } else {
    //         if (flowRate == 0) {
    //             flowRate = salaryFlowrates[salaryPledges[tokenId].employee];
    //         }
    //         cfaV1.createFlow(newReceiver, _acceptedToken, flowRate);
    //     }
    // }

    // function isSalaryClaimable(uint256 tokenId) public view returns (bool) {
    //     return salaryPledges[tokenId].untilTs - block.timestamp < 0;
    // }

    // function claimBackSalary(uint256 tokenId) public exists(tokenId) {
    //     if (!isSalaryClaimable(tokenId)) {
    //         revert("Salary not claimable yet");
    //     }

    //     if (salaryPledges[tokenId].employee != msg.sender) {
    //         revert("youre not the employee that receives this salary");
    //     }

    //     //todo might  fail when owner hasn't approved the collection.
    //     _burn(tokenId);
    // }

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
