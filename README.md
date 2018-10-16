# ICO Maker

[![Build Status](https://travis-ci.org/vittominacori/ico-maker.svg?branch=master)](https://travis-ci.org/vittominacori/ico-maker) 
[![Coverage Status](https://coveralls.io/repos/github/vittominacori/ico-maker/badge.svg?branch=master)](https://coveralls.io/github/vittominacori/ico-maker?branch=master)

Smart Contracts to build your ICO solution and issue your ERC20 Token.

## Install

```bash
npm install ico-maker
```

## Usage

### BaseToken.sol

[BaseToken](https://github.com/vittominacori/ico-maker/blob/master/contracts/token/BaseToken.sol) is an ERC20 token with a lot of stuffs like Mintable, Burnable and ERC1363 Payable Token behaviours.

```solidity
pragma solidity ^0.4.24;

import "ico-maker/contracts/token/BaseToken.sol";


contract MyToken is BaseToken {
  constructor(string _name, string _symbol, uint8 _decimals)
  BaseToken(_name, _symbol, _decimals)
  public
  {}
}
```

### Contributions.sol

[Contributions](https://github.com/vittominacori/ico-maker/blob/master/contracts/crowdsale/utils/Contributions.sol) is an utility Smart Contract where to store additional data about crowdsale like the wei contributed or the token balance of each address.

```solidity
pragma solidity ^0.4.24;

import "ico-maker/contracts/crowdsale/utils/Contributions.sol";


contract MyContributions is Contributions {}
```

### BaseCrowdsale.sol

[BaseCrowdsale](https://github.com/vittominacori/ico-maker/blob/master/contracts/crowdsale/BaseCrowdsale.sol) is an extensible Crowdsale contract with Timed and Capped behaviours.

```solidity
pragma solidity ^0.4.24;

import "ico-maker/contracts/crowdsale/BaseCrowdsale.sol";


contract MyCrowdsale is BaseCrowdsale {
  constructor(
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _rate,
    address _wallet,
    uint256 _cap,
    uint256 _minimumContribution,
    address _token,
    address _contributions
  )
  BaseCrowdsale(
    _openingTime,
    _closingTime,
    _rate,
    _wallet,
    _cap,
    _minimumContribution,
    _token,
    _contributions
  )
  public
  {}
}
```

### Bounty.sol

[Bounty](https://github.com/vittominacori/ico-maker/blob/master/contracts/distribution/Bounty.sol) is a Capped Smart Contract to mint and distribute tokens for bounty programs.

```solidity
pragma solidity ^0.4.24;

import "ico-maker/contracts/distribution/Bounty.sol";


contract MyBounty is Bounty {
  constructor(address _token, uint256 _cap)
  Bounty(_token, _cap)
  public
  {}
}
```

### Airdrop.sol

[Airdrop](https://github.com/vittominacori/ico-maker/blob/master/contracts/distribution/Airdrop.sol) is a Smart Contract to distribute tokens for airdrop.

```solidity
pragma solidity ^0.4.24;

import "ico-maker/contracts/distribution/Airdrop.sol";


contract MyAirdrop is Airdrop {
  constructor(address _token, address _wallet)
  Airdrop(_token, _wallet)
  public
  {}
}
```

## Development

Install truffle.

```bash
npm install -g truffle      // Version 4.1.14+ required.
```

### Install dependencies

```bash
npm install
```

### Linter

Use Solium

```bash
npm run lint:sol
```

Use ESLint

```bash
npm run lint:js
```

Use both and fix

```bash
npm run lint:fix
```

### Compile and test the contracts.
 
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

### Optional

Install the [truffle-flattener](https://github.com/alcuadrado/truffle-flattener)

```bash
npm install -g truffle-flattener
```

Usage 

```bash
truffle-flattener contracts/token/BaseToken.sol >> dist/BaseToken.dist.sol
```

## License

Code released under the [MIT License](https://github.com/vittominacori/ico-maker/blob/master/LICENSE).
