pragma solidity ^0.4.24;

import "../token/BaseToken.sol";


/**
 * @title Airdrop
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev Contract to distribute airdrop tokens
 */
contract Airdrop is TokenRecover {

  using SafeMath for uint256;

  BaseToken public token;

  address public wallet;
  uint256 public totalGivenAirdropTokens;
  mapping (address => uint256) public givenAirdropTokens;

  /**
   * @param _token Address of the token being distributed
   * @param _wallet Address where are tokens stored
   */
  constructor(address _token, address _wallet) public {
    require(
      _token != address(0),
      "Token shouldn't be the zero address."
    );

    require(
      _wallet != address(0),
      "Wallet shouldn't be the zero address."
    );

    token = BaseToken(_token);
    wallet = _wallet;
  }

  function multiSend(address[] addresses, uint256[] amounts) public onlyOwner {
    require(
      addresses.length > 0,
      "Addresses array shouldn't be empty."
    );
    require(
      amounts.length > 0,
      "Amounts array shouldn't be empty."
    );
    require(
      addresses.length == amounts.length,
      "Addresses and amounts arrays should have the same length."
    );

    for (uint i = 0; i < addresses.length; i++) {
      address to = addresses[i];
      uint256 value = amounts[i];

      if (givenAirdropTokens[to] == 0) {
        givenAirdropTokens[to] = givenAirdropTokens[to].add(value);
        totalGivenAirdropTokens = totalGivenAirdropTokens.add(value);

        token.transferFrom(wallet, to, value);
      }
    }
  }
}
