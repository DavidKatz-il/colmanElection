pragma solidity >=0.4.22 <0.8.0;

import "./openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract Election is ERC20 {
    struct Candidate {
        uint id;
        string name;
        string img;
        uint voteCount;
    }

    uint public timeStart;
    uint public timeEnd;
    uint public candidatesCount;
    bool public votingIsStarted;
    bool public votingIsFinished;

    mapping(address => bool) public allowVoters;
    mapping(address => bool) public voters;
    mapping(uint => Candidate) public candidates;
    
    event votedEvent (
        uint indexed _candidateId
    );
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 initialSupply
        ) ERC20(_name, _symbol) {
        _mint(msg.sender, initialSupply);
	}

    function addCandidate (
        string memory _name,
        string memory _img
        ) public {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _img, 0);
    }

    function addAllowedVoter (
        address _address
        ) public {
        allowVoters[_address] = true;
    }

    function setFinishTime () public {
        votingIsFinished = true;
    }

    function startVoting(uint _duringTime) public {
        votingIsStarted = true;
        timeStart = block.timestamp;
        timeEnd = block.timestamp + _duringTime;
    }

    function vote (uint _candidateId) public {
        // require that it's still time to vote
        require(timeEnd <= block.timestamp, "Time expired");

        // require that they allowed to vote
        require(allowVoters[msg.sender], "Not allowed to vote");

        // require that they haven't voted before
        require(!voters[msg.sender], "Already voted");

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount++;
        
        // trigger voted event
        emit votedEvent(_candidateId);
    }
}
