App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    $("#formAdmin").show();
    $("#formVote").hide();
    $("#formAlreadyVote").hide();
    $("#formLoader").hide();

    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });
  },
    
  uploadCands: function() {
    var electionInstance;
    const candPath = document.getElementById("candPath").files[0];
    $.getJSON(candPath.name, function(data) {
      console.log(data);
     for (i = 0; i < data.length; i++) {
       console.log(i);
       var name = data[i].name;
       var picture = data[i].picture;
       console.log(name);
       App.contracts.Election.deployed().then(function(instance) {
         return instance.addCandidate(name, picture, { from: App.account });
       });
       $('#sumCand').text(i+1);
     }
   });
  },

  start: function(event) {
    console.log("start");
    event.preventDefault();
    $("#formAdmin").hide();
    $("#formLoader").show();
    App.loadCands();
 },
 
 loadCands: function() {
  var electionInstance;
  console.log("loadCands");
  App.contracts.Election.deployed().then(function(instance) {
    electionInstance = instance;
    return electionInstance.candidatesCount();
  }).then(function(candidatesCount) {
    console.log(candidatesCount);
    var candsRow = $('#candsRow');
    var candTemplate = $('#candTemplate');
    for (var i = 1; i <= candidatesCount; i++) {
      console.log(i);
      electionInstance.candidates(i).then(function(candidate) {
        console.log(candidate);
        var id = candidate[0];
        var name = candidate[1];
        var img = candidate[2];
        var voteCount = candidate[3];
        candTemplate.find('.panel-title').text(name);
        candTemplate.find('img').attr('src', img);
        candTemplate.find('.cand-voteCount').text(voteCount);
        candTemplate.find('.cand-vote').attr('data-id', id);
        candsRow.append(candTemplate.html());
      });
    }
    return electionInstance.voters(App.account);
  }).then(function(hasVoted) {
    // Do not allow a user to vote
    if (hasVoted) {
      formVote.hide();
      $("#formAlreadyVote").show();
    }
    $("#formVote").show();
  }).catch(function(error) {
    console.warn(error);
  });
},

 handleVote: function(event) {
  event.preventDefault();
  var candId = parseInt($(event.target).data('id'));
  App.contracts.Election.deployed().then(function(instance) {
    return instance.vote(candId, { from: App.account });
  }).then(function(result) {
    // Wait for votes to update
    $("#formVote").hide();
    $("#formLoader").show();
  }).catch(function(err) {
    console.error(err);
  });
},

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

$("#candPath").change(function(e) {
  App.uploadCands();
});

$(document).on('click', '.btn-start', App.start)
$(document).on('click', '.btn-vote', App.handleVote)