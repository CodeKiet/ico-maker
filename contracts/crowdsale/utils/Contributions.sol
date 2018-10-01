pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/rbac/RBAC.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract Contributions is RBAC, Ownable {
  using SafeMath for uint256;

  string public constant ROLE_MINTER = "minter";

  modifier onlyMinter () {
    checkRole(msg.sender, ROLE_MINTER);
    _;
  }

  uint256 public totalSoldTokens;
  mapping(address => uint256) public tokenBalances;
  address[] public addresses;

  constructor() public {}

  function addBalance(
    address _address,
    uint256 _tokenAmount
  )
  public
  onlyMinter
  {
    if (tokenBalances[_address] == 0) {
      addresses.push(_address);
    }
    tokenBalances[_address] = tokenBalances[_address].add(_tokenAmount);
    totalSoldTokens = totalSoldTokens.add(_tokenAmount);
  }

  /**
   * @dev add a minter role to an address
   * @param minter address
   */
  function addMinter(address minter) public onlyOwner {
    addRole(minter, ROLE_MINTER);
  }

  /**
   * @dev remove a minter role from an address
   * @param minter address
   */
  function removeMinter(address minter) public onlyOwner {
    removeRole(minter, ROLE_MINTER);
  }

  function getContributorsLength() public view returns (uint) {
    return addresses.length;
  }
}
