pragma solidity ^0.4.24;

// solium-disable-next-line max-len
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
// solium-disable-next-line max-len
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
// solium-disable-next-line max-len
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";

import "../utils/Contributions.sol";
import "../../safe/TokenRecover.sol";


// solium-disable-next-line max-len
contract DefaultCrowdsale is TimedCrowdsale, CappedCrowdsale, MintedCrowdsale, Ownable, TokenRecover {

  Contributions public contributions;

  uint256 public minimumContribution;

  constructor(
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _cap,
    uint256 _minimumContribution,
    address _token,
    address _contributions
  )
  Crowdsale(_rate, _wallet, ERC20(_token))
  TimedCrowdsale(_startTime, _endTime)
  CappedCrowdsale(_cap)
  public
  {
    require(
      _contributions != address(0),
      "Contributions address can't be the zero address."
    );
    contributions = Contributions(_contributions);
    minimumContribution = _minimumContribution;
  }

  // false if the ico is not started, true if the ico is started and running, true if the ico is completed
  function started() public view returns(bool) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp >= openingTime;
  }

  // false if the ico is not started, false if the ico is started and running, true if the ico is completed
  function ended() public view returns(bool) {
    return hasClosed() || capReached();
  }

  /**
   * @dev Extend parent behavior requiring purchase to respect the minimumContribution.
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(
    address _beneficiary,
    uint256 _weiAmount
  )
  internal
  {
    require(
      _weiAmount >= minimumContribution,
      "Can't send less than the minimum contribution"
    );
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

  /**
   * @dev Extend parent behavior to add contributions log
   * @dev Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
   * @param _beneficiary Address receiving the tokens
   * @param _tokenAmount Number of tokens to be purchased
   */
  function _processPurchase(
    address _beneficiary,
    uint256 _tokenAmount
  )
  internal
  {
    super._processPurchase(_beneficiary, _tokenAmount);
    contributions.addBalance(_beneficiary, _tokenAmount);
  }
}
