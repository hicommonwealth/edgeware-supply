## edgeware-supply

A Zeit service for retrieving Edgeware parameters related to issuance. There are two available endpoints

Using https://edgeware-supply-mocha.now.sh/ will return the current total, circulating, and supply at the treasury. For example:

```
{"total_supply":"5489144714","circulating_supply":"5101509513","treasury_supply":"387635201"}
```


Using https://edgeware-supply.dillchen.now.sh/ will only return the total supply in plaintext. For example:

```
5489144429
```

### Installing

- yarn install
- Set up a Zeit/Now account

### Deploying

- git clone this repository
- `now deploy --prod`
