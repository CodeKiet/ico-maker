pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/rbac/RBAC.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title Contributions
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev Utility contract where to save any information about Crowdsale contributions
 */
contract Contributions is RBAC, Ownable {

  using SafeMath for uint256;

  string public constant ROLE_OPERATOR = "operator";

  modifier onlyOperator () {
    checkRole(msg.sender, ROLE_OPERATOR);
    _;
  }

  uint256 public totalSoldTokens;
  uint256 public totalWeiRaised;
  mapping(address => uint256) public tokenBalances;
  mapping(address => uint256) public weiContributions;
  address[] public addresses;

  constructor() public {}

  /**
   * @dev add contribution into the contributions array
   * @param _address address
   * @param _weiAmount uint256
   * @param _tokenAmount uint256
   */
  function addBalance(
    address _address,
    uint256 _weiAmount,
    uint256 _tokenAmount
  )
  public
  onlyOperator
  {
    if (weiContributions[_address] == 0) {
      addresses.push(_address);
    }
    weiContributions[_address] = weiContributions[_address].add(_weiAmount);
    totalWeiRaised = totalWeiRaised.add(_weiAmount);

    tokenBalances[_address] = tokenBalances[_address].add(_tokenAmount);
    totalSoldTokens = totalSoldTokens.add(_tokenAmount);
  }

  /**
   * @dev add a operator role to an address
   * @param _operator address
   */
  function addOperator(address _operator) public onlyOwner {
    addRole(_operator, ROLE_OPERATOR);
  }

  /**
   * @dev remove a operator role from an address
   * @param _operator address
   */
  function removeOperator(address _operator) public onlyOwner {
    removeRole(_operator, ROLE_OPERATOR);
  }

  /**
   * @dev return the contributions length
   * @return uint256
   */
  function getContributorsLength() public view returns (uint) {
    return addresses.length;
  }
}
