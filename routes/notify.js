/* jshint node: true */
'use strict';

var rootDir = __dirname + '/../';
var config = require(rootDir + 'config');
var paymentsLib = require(rootDir + 'lib/payments');
var bitcoinRpc = require(rootDir + 'lib/bitcoinrpc');
var helper = require(rootDir + 'lib/helper');
var _ = require('lodash');

var notify = function(app) {

  app.post('/walletnotify', function(req, res) {
    var txid = req.body.txid;
    var api_key = req.body.api_key;
    if (!api_key || api_key && api_key !== config.baronAPIKey) {
      var err = new Error('Access Denied: Invalid API key.');
      console.log(req.ip + ' attempted to /walletnotify with an invalid API key.');
      res.status(401).write(err.message);
      res.end();
    }
    else {
      bitcoinRpc.getTransaction(txid, function(err, info) {
        if (err) {
          res.send(500);
        }
        else {
          var transaction = info.result;
          var receiveDetails = helper.getReceiveDetails(transaction.details);
          var count = 0;
          receiveDetails.forEach(function(receiveDetail) {
            var txToProcess = count++ > 0 ? _.cloneDeep(transaction) : transaction;
            txToProcess.address = receiveDetail.address;
            txToProcess.amount = receiveDetail.amount;
            paymentsLib.updatePayment(txToProcess, function(err) {
              if (err) {
                console.log(err);
              }
            });
          });
          res.end();
        }
      });
    }
  });

  app.post('/blocknotify', function(req, res) {
    var api_key = req.body.api_key;
    if (!api_key || api_key && api_key !== config.baronAPIKey) {
      var err = new Error('Access Denied: Invalid API key.');
      console.log(req.ip + ' attempted to /blocknotify with an invalid API key.');
      res.status(401).write(err.message);
      res.end();
    }
    else {
      //console.log(req.body.blockhash);
      // Disable lastBlockJob for now.
      // Keeping this code as blocknotify will likely be useful for something else in the future.
      //blockJob.lastBlockJob();
      res.end();
    }
  });

};

module.exports = notify;
