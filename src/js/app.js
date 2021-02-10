App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load candidates.
    $.getJSON('../candidates.json', function(data) {
      var candsRow = $('#candsRow');
      var candTemplate = $('#candTemplate');

      for (i = 0; i < data.length; i ++) {
        candTemplate.find('.panel-title').text(data[i].name);
        candTemplate.find('img').attr('src', data[i].picture);
        candTemplate.find('.cand-course').text(data[i].course);
        candTemplate.find('.cand-num').text(data[i].num);
        candTemplate.find('.cand-desc').text(data[i].desc);
        candTemplate.find('.cand-vote').attr('data-id', data[i].id);
        candsRow.append(candTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    /*
     * Replace me...
     */

    return App.initContract();
  },

  initContract: function() {
    /*
     * Replace me...
     */

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-vote', App.handleVote);
  },

  markVoted: function() {
    /*
     * Replace me...
     */
  },

  handleVote: function(event) {
    event.preventDefault();

    var candId = parseInt($(event.target).data('id'));

    /*
     * Replace me...
     */
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
