#!/usr/bin/env node

const { NowRequest, NowResponse } = require('@now/node');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { bnToBn } = require('@polkadot/util/bn');
const { stringToU8a } = require('@polkadot/util');
const { u128 } = require('@polkadot/types');
const { IdentityTypes } = require('edgeware-node-types/dist/identity');
const { SignalingTypes } = require('edgeware-node-types/dist/signaling');
const { VotingTypes } = require('edgeware-node-types/dist/voting');

module.exports = async (req, res) => {
  const nodeUrl = 'ws://mainnet1.edgewa.re:9944';

  console.log(`Connecting to API for ${nodeUrl}...`);
  let connected;
  setTimeout(() => {
    if (connected) return;
    res.setHeader('content-type', 'text/plain');
    res.status(500).send('Connection timed out');
    process.exit(1);
  }, 2000);

  // initialize the api
  const api = await ApiPromise.create({
    provider: new WsProvider(nodeUrl),
    types: {
      ...IdentityTypes,
      ...SignalingTypes,
      ...VotingTypes,
      Balance2: u128,
    },
  });
  connected = true;

  const TREASURY_ACCOUNT = stringToU8a('modlpy/trsry'.padEnd(32, '\0'));
  //
  // get relevant chain data
  //
  try {
    const [issuance, treasury, properties, block] = await Promise.all([
      api.query.balances.totalIssuance(),
      api.derive.balances.account(TREASURY_ACCOUNT),
      api.rpc.system.properties(),
    ]);
    const tokenDecimals = properties.tokenDecimals.unwrap().toString(10);
    const issuanceStr = issuance.div(bnToBn(10).pow(bnToBn(tokenDecimals))).toString(10);
    const treasuryStr = treasury.freeBalance.div(bnToBn(10).pow(bnToBn(tokenDecimals))).toString(10);
    const circulatingStr = issuance.sub(treasury.freeBalance).div(bnToBn(10).pow(bnToBn(tokenDecimals))).toString(10);
    res.setHeader('content-type', 'text/plain');
    res.status(200).send(JSON.stringify({
      'total_supply': issuanceStr,
      'circulating_supply': circulatingStr,
      'treasury_supply': treasuryStr,
    }));
  } catch (e) {
    res.setHeader('content-type', 'text/plain');
    res.status(500).send('Error fetching Edgeware supply data');
  }
}
