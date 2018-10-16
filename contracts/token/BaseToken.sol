pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/CappedToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/RBACMintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "erc-payable-token/contracts/token/ERC1363/ERC1363BasicToken.sol";
import "eth-token-recover/contracts/TokenRecover.sol";


/**
 * @title BaseToken
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev BaseToken is an ERC20 token with a lot of stuffs used as Base for any other token contract.
 *  It is DetailedERC20, RBACMintableToken, BurnableToken, ERC1363BasicToken.
 */
contract BaseToken is DetailedERC20, CappedToken, RBACMintableToken, BurnableToken, ERC1363BasicToken, TokenRecover { // solium-disable-line max-len

  /**
   * A constant role name for indicating operators.
   */
  string public constant ROLE_OPERATOR = "operator";

  /**
   * @dev Tokens can be moved only after minting finished or if you are an approved operator
   */
  modifier canTransfer(address _from, uint256 _value) {
    require(
      mintingFinished || hasRole(_from, ROLE_OPERATOR),
      "Can't transfer"
    );
    _;
  }

  /**
   * @param _name Name of the token
   * @param _symbol A symbol to be used as ticker
   * @param _decimals Number of decimals. All the operations are done using the smallest and indivisible token unit
   * @param _cap Maximum number of tokens mintable
   */
  constructor(
    string _name,
    string _symbol,
    uint8 _decimals,
    uint256 _cap
  )
  DetailedERC20(_name, _symbol, _decimals)
  CappedToken(_cap)
  public
  {}

  function transfer(
    address _to,
    uint256 _value
  )
  public
  canTransfer(msg.sender, _value)
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
  canTransfer(_from, _value)
  returns (bool)
  {
    return super.transferFrom(_from, _to, _value);
  }

  /**
   * @dev add an operator role to an address
   * @param _operator address
   */
  function addOperator(address _operator) public onlyOwner {
    addRole(_operator, ROLE_OPERATOR);
  }

  /**
   * @dev remove an operator role from an address
   * @param _operator address
   */
  function removeOperator(address _operator) public onlyOwner {
    removeRole(_operator, ROLE_OPERATOR);
  }
}
