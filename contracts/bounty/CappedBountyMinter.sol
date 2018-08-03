pragma solidity ^0.4.24;

import "../token/ERC20Token.sol";


contract CappedBountyMinter is Ownable {
  using SafeMath for uint256;

  ERC20Token public token;

  uint256 public cap;
  uint256 public totalGivenBountyTokens;
  mapping (address => uint256) public givenBountyTokens;

  uint256 decimals;

  constructor(address _token, uint256 _cap) public {
    require(
      _token != address(0),
      "Token shouldn't be the zero address."
    );
    require(
      _cap > 0,
      "Bounty cap should be greater than zero."
    );

    token = ERC20Token(_token);

    decimals = uint256(token.decimals());
    cap = _cap * (10 ** decimals);
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
      uint256 value = amounts[i] * (10 ** decimals);

      givenBountyTokens[to] = givenBountyTokens[to].add(value);
      totalGivenBountyTokens = totalGivenBountyTokens.add(value);

      require(
        totalGivenBountyTokens <= cap,
        "Max bounty cap reached."
      );

      token.mint(to, value);
    }
  }

  function remainingTokens() public view returns(uint256) {
    return cap.sub(totalGivenBountyTokens);
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
