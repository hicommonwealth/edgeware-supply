#!/usr/bin/env node

const { ApiPromise, WsProvider } = require('@polkadot/api');
const { bnToBn } = require('@polkadot/util/bn');
const { stringToU8a } = require('@polkadot/util');
const { u128 } = require('@polkadot/types');
const { Mainnet } = require('@edgeware/node-types');

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
    ...Mainnet,
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

    if (!!req.query.circulating) {
      res.status(200).send(circulatingStr);
    } else if (!!req.query.treasury) {
      res.status(200).send(treasuryStr);
    } else {
      res.status(200).send(issuanceStr);
    }
  } catch (e) {
    res.setHeader('content-type', 'text/plain');
    res.status(500).send('Error fetching Edgeware supply data');
  }
}
