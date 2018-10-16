App = {
  web3Provider: null,
  contracts: {},
  instances: {},

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    // Initialize web3 and set the provider to the testRPC.
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // set the provider you want from Web3.providers
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545');
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract();
  },

  initContract: function () {
    $.getJSON('BaseToken.json', function (data) {
      App.contracts.BaseToken = TruffleContract(data);
      App.contracts.BaseToken.setProvider(App.web3Provider);
    });

    $.getJSON('BaseCrowdsale.json', function (data) {
      App.contracts.BaseCrowdsale = TruffleContract(data);
      App.contracts.BaseCrowdsale.setProvider(App.web3Provider);
    });

    $.getJSON('Contributions.json', function (data) {
      App.contracts.Contributions = TruffleContract(data);
      App.contracts.Contributions.setProvider(App.web3Provider);
    });

    $.getJSON('Bounty.json', function (data) {
      App.contracts.Bounty = TruffleContract(data);
      App.contracts.Bounty.setProvider(App.web3Provider);
    });

    $.getJSON('Airdrop.json', function (data) {
      App.contracts.Airdrop = TruffleContract(data);
      App.contracts.Airdrop.setProvider(App.web3Provider);
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
