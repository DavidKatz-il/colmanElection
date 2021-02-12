var Election = artifacts.require("./Election.sol");

module.exports = function(deployer) {
  deployer.deploy(Election, "ColmanCoin", "BSC", 100000);
};
