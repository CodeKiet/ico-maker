# ERC20 Token Crowdsale

[![Build Status](https://travis-ci.org/vittominacori/erc20-crowdsale.svg?branch=master)](https://travis-ci.org/vittominacori/erc20-crowdsale) 
[![Coverage Status](https://coveralls.io/repos/github/vittominacori/erc20-crowdsale/badge.svg?branch=master)](https://coveralls.io/github/vittominacori/erc20-crowdsale?branch=master)

Smart Contracts for an ERC20 Token Crowdsale.


Code created using [Open Zeppelin (openzeppelin-solidity)](https://github.com/OpenZeppelin/openzeppelin-solidity) and [Truffle Framework](https://github.com/trufflesuite/truffle).


 
## Installation


Install truffle.

```bash
npm install -g truffle      // Version 4.1.13+ required.
```



## Install dependencies


```bash
npm install
```



## Linter


Use Solium

```bash
npm run lint:sol
```

Lint and fix all

```bash
npm run lint:all:fix
```



## Compile and test the contracts.
 

Open the Truffle console

```bash
truffle develop
```

Compile 

```bash
compile 
```

Test

```bash
test
```



## Optional


Install the [truffle-flattener](https://github.com/alcuadrado/truffle-flattener)

```bash
npm install -g truffle-flattener
```
 
 
Usage 

```bash
truffle-flattener contracts/ERC20Token.sol >> dist/ERC20Token.dist.sol
```



## Note

IMPORTANT: Before commit run the lint and fix command:

```bash
npm run lint:all:fix
```



## Links

Solidity [Doc](https://solidity.readthedocs.io) [Github](https://solidity.readthedocs.io)

OpenZeppelin [Doc](http://zeppelin-solidity.readthedocs.io) [Github](https://github.com/OpenZeppelin)

Truffle [Doc](http://truffleframework.com/docs) [Github](https://github.com/trufflesuite/truffle)

Web3.js [Doc 0.20.4](https://github.com/ethereum/wiki/wiki/JavaScript-API) [Doc 1.0](http://web3js.readthedocs.io/en/1.0) [Github](https://github.com/ethereum/web3.js)
