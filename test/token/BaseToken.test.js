const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');

const { shouldBehaveLikeBaseToken } = require('./BaseToken.behaviour');

const BigNumber = web3.BigNumber;

const BaseToken = artifacts.require('BaseToken');

contract('BaseToken', function ([owner, anotherAccount, minter, operator, recipient, thirdParty]) {
  const _name = 'BaseToken';
  const _symbol = 'ERC20';
  const _decimals = 18;
  const _cap = new BigNumber(10000);
  const _initialBalance = 1000;

  beforeEach(async function () {
    this.token = await BaseToken.new(_name, _symbol, _decimals, _cap, { from: owner });
  });

  describe('creating a valid token', function () {
    it('should fail with zero cap', async function () {
      await assertRevert(
        BaseToken.new(
          _name,
          _symbol,
          _decimals,
          0,
          { from: owner }
        )
      );
    });
  });

  context('like a BaseToken token', function () {
    shouldBehaveLikeBaseToken(
      [owner, anotherAccount, minter, operator, recipient, thirdParty],
      [_name, _symbol, _decimals, _cap, _initialBalance]
    );
  });
});
