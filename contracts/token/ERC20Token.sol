pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/RBACMintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";


contract ERC20Token is DetailedERC20, RBACMintableToken, BurnableToken {

  modifier canTransfer() {
    require(
      mintingFinished,
      "Minting should be finished before transfer."
    );
    _;
  }

  constructor(string _name, string _symbol, uint8 _decimals)
  DetailedERC20(_name, _symbol, _decimals)
  public
  {}

  function transfer(
    address _to,
    uint256 _value
  )
  public
  canTransfer
  returns (bool)
  {
    return super.transfer(_to, _value);
  }

  function transferFrom(
    address _from,
    address _to,
    uint256 _value
  )
  public
  canTransfer
  returns (bool)
  {
    return super.transferFrom(_from, _to, _value);
  }

  function transferAnyERC20Token(
    address _tokenAddress,
    uint256 _tokens
  )
  public
  onlyOwner
  returns (bool success)
  {
    return ERC20Basic(_tokenAddress).transfer(owner, _tokens);
  }
}
