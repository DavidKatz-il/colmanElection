App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      window.ethereum.enable();
      web3 = new Web3(App.web3Provider);
      return App.initContract();
    }
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
      console.log(web3);
      return App.initContract();
    }
  },

  initContract: async function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      App.render();
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
    var electionInstance;
    var formLoader = $("#formLoader");
    var formAdmin = $("#formAdmin");
    var formVote = $("#formVote");
    var formResults = $("#formResults");
    
    formLoader.show();   
    formAdmin.hide();
    formVote.hide();
    formResults.hide();
    
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("כתובת החשבון שלך: " + account);
      }
    });
    
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.votingIsStarted();
    }).then(function(votingIsStarted) {
      formLoader.hide();   
      if(votingIsStarted) {
        App.contracts.Election.deployed().then(function(instance) {
          electionInstance = instance;
          return electionInstance.timeEnd();
        }).then(function(timeEnd) {
          var timeEnd = new Date((timeEnd.c[0] * 1000));
          var now = new Date();
          if (now <= timeEnd) {
            App.loadCands();
            formVote.show(); 
          } else {
            App.loadResults();
            formResults.show();
          }
        });
      } else { // Start Admin page if the voting didn't start
        formAdmin.show();
      }
    }).catch(function(error) {
      console.warn(error);
    });
  },
    
  uploadCands: function() {
    const candsPath = document.getElementById("candsPath").files[0];
    $.getJSON(candsPath.name, function(data) {
      App.contracts.Election.deployed().then(function(instance) {
        for (i = 0; i < data.length; i++) {
          var name = data[i].name;
          var img = data[i].img;
          instance.addCandidate(name, img, { from: App.account });
        }
      })
     });
  },

  uploadAllowedVoters: function() {
    const votersPath = document.getElementById("votersPath").files[0];
    $.getJSON(votersPath.name, function(data) {
      App.contracts.Election.deployed().then(function(instance) {
        for (i = 0; i < data.length; i++) {
          var address = data[i].address;
          instance.addAllowedVoter(address, { from: App.account });
        }
      })
     });
  },

  start: function(event) {
    event.preventDefault();
    const timer = document.getElementById("timer").value;
    App.contracts.Election.deployed().then(function(instance) {
      instance.startVoting(timer, { from: App.account });
    });
    return App.render();
 },
 
 loadCands: function() {
  var electionInstance;
  App.contracts.Election.deployed().then(function(instance) {
    electionInstance = instance;
    return electionInstance.candidatesCount();
  }).then(function(candidatesCount) {
    var candsArray = [];
    for (var i = 1; i <= candidatesCount; i++) {
      candsArray.push(electionInstance.candidates(i));
    }
    Promise.all(candsArray).then(function(candsArray) {
      var candsRow = $('#candsRow');
      var candTemplate = $('#candTemplate');
      candsRow.empty();
      for (var i = 0; i < candidatesCount; i++) {
        var id = candsArray[i][0];
        var name = candsArray[i][1];
        var img = candsArray[i][2];
        var voteCount = candsArray[i][3];
        candTemplate.find('.panel-title').text(name);
        candTemplate.find('img').attr('src', img);
        candTemplate.find('.cand-voteCount').text(voteCount);
        candTemplate.find('.btn-vote').attr('data-id', id);
        candsRow.append(candTemplate.html());
      }
    });
  }).catch(function(error) {
    console.warn(error);
  });
},

 handleVote: function(event) {
  event.preventDefault();

  App.contracts.Election.deployed().then(function(instance) {
    return instance.voters(App.account);
  }).then(function(hasVoted) {
    if (hasVoted) {
      alert('כבר בחרת - לא ניתן לבחור פעמיים');
    } else {
      var candId = parseInt($(event.target).data('id'));
      App.contracts.Election.deployed().then(function(instance) {
        return instance.vote(candId, { from: App.account });
      }).then(function(result) {
        App.contracts.Election.deployed().then(async (instance) => {
          await instance.transfer(instance.address, 100, { from: App.account });
        })
        .catch(function(err) {
          console.error(err);
        });
        // Wait for votes to update
        $("#formVote").hide();
        $("#formLoader").show();
      }).catch(function(err) {
        console.error(err);
      });
      alert('תודה רבה על ההצבעה');    
    }
  }).catch(function(err) {
      console.error(err);
  });  
},

loadResults: function(){
  var electionInstance;
  App.contracts.Election.deployed().then(function(instance) {
    electionInstance = instance;
    return electionInstance.candidatesCount();
  }).then(function(candidatesCount) {

    var candsArray = [];
    for (var i = 1; i <= candidatesCount; i++) {
      candsArray.push(electionInstance.candidates(i));
    }
    Promise.all(candsArray).then(function(candsArray) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();
  
      for (var i = 0; i < candidatesCount; i++) {
        var id = candsArray[i][0];
        var name = candsArray[i][1];
        var voteCount = candsArray[i][3];
        var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
        candidatesResults.append(candidateTemplate);
      }
    });
  }).catch(function(error) {
    console.warn(error);
  });

}

};

$(function() { $(window).load(function() { App.init(); }); });

$("#candsPath").change(function(e) { App.uploadCands(); });
$("#votersPath").change(function(e) { App.uploadAllowedVoters(); });

$(document).on('click', '.btn-start', App.start)
$(document).on('click', '.btn-vote', App.handleVote)