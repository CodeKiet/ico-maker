const { expectThrow } = require('openzeppelin-solidity/test/helpers/expectThrow');
const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { sendTransaction } = require('openzeppelin-solidity/test/helpers/sendTransaction');

const { shouldBehaveLikeTokenRecover } = require('eth-token-recover/test/TokenRecover.behaviour');
const { shouldBehaveLikeERC1363BasicToken } = require('erc-payable-token/test/token/ERC1363/ERC1363BasicToken.behaviour'); // eslint-disable-line max-len
const { shouldBehaveLikeCappedToken } = require('openzeppelin-solidity/test/token/ERC20/CappedToken.behaviour');
const { shouldBehaveLikeMintableToken } = require('openzeppelin-solidity/test/token/ERC20/MintableToken.behaviour');
const { shouldBehaveLikeRBACMintableToken } = require('openzeppelin-solidity/test/token/ERC20/RBACMintableToken.behaviour'); // eslint-disable-line max-len
const { shouldBehaveLikeBurnableToken } = require('openzeppelin-solidity/test/token/ERC20/BurnableToken.behaviour');

const { shouldBehaveLikeDetailedERC20Token } = require('./behaviours/DetailedERC20.behaviour');
const { shouldBehaveLikeStandardToken } = require('./behaviours/StandardToken.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ERC1363Receiver = artifacts.require('ERC1363ReceiverMock.sol');

const ROLE_OPERATOR = 'operator';
const RECEIVER_MAGIC_VALUE = '0x88a7ca5c';

function shouldBehaveLikeBaseToken (
  [owner, anotherAccount, minter, operator, recipient, thirdParty],
  [_name, _symbol, _decimals, _cap, _initialBalance]
) {
  context('like a DetailedERC20 token', function () {
    shouldBehaveLikeDetailedERC20Token(_name, _symbol, _decimals);
  });

  context('like a MintableToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
    });
    shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
  });

  context('like a RBACMintableToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
    });
    shouldBehaveLikeRBACMintableToken([owner, anotherAccount, minter]);
  });

  context('like a CappedToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
    });
    shouldBehaveLikeCappedToken([owner, anotherAccount, minter, _cap]);
  });

  context('like a BurnableToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, _initialBalance, { from: minter });
    });
    shouldBehaveLikeBurnableToken([owner], _initialBalance);
  });

  context('like a StandardToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, _initialBalance, { from: minter });
      await this.token.finishMinting({ from: owner });
    });
    shouldBehaveLikeStandardToken([owner, anotherAccount, recipient], _initialBalance);
  });

  context('like a ERC1363BasicToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, _initialBalance, { from: minter });
      await this.token.finishMinting({ from: owner });
    });
    shouldBehaveLikeERC1363BasicToken([owner, anotherAccount, recipient], _initialBalance);
  });

  context('BaseToken token behaviours', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, _initialBalance, { from: minter });
    });

    describe('handle operator role', function () {
      it('owner can add and remove a operator role', async function () {
        await this.token.addOperator(anotherAccount, { from: owner });
        let hasRole = await this.token.hasRole(anotherAccount, ROLE_OPERATOR);
        assert.equal(hasRole, true);

        await this.token.removeOperator(anotherAccount, { from: owner });
        hasRole = await this.token.hasRole(anotherAccount, ROLE_OPERATOR);
        assert.equal(hasRole, false);
      });

      it('another account can\'t add or remove a operator role', async function () {
        await expectThrow(
          this.token.addOperator(anotherAccount, { from: anotherAccount })
        );

        await this.token.addOperator(anotherAccount, { from: owner });
        await expectThrow(
          this.token.removeOperator(anotherAccount, { from: anotherAccount })
        );
      });
    });

    context('before finish minting', function () {
      describe('if it is not an operator', function () {
        it('should fail transfer', async function () {
          await assertRevert(this.token.transfer(recipient, _initialBalance, { from: owner }));
        });

        it('should fail transferFrom', async function () {
          await this.token.approve(anotherAccount, _initialBalance, { from: owner });
          await assertRevert(this.token.transferFrom(owner, recipient, _initialBalance, { from: anotherAccount }));
        });

        it('should fail to transferAndCall', async function () {
          this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

          const transferAndCallWithData = function (to, value, opts) {
            return sendTransaction(
              this.token,
              'transferAndCall',
              'address,uint256,bytes',
              [to, value, '0x42'],
              opts
            );
          };

          const transferAndCallWithoutData = function (to, value, opts) {
            return sendTransaction(
              this.token,
              'transferAndCall',
              'address,uint256',
              [to, value],
              opts
            );
          };

          await assertRevert(
            transferAndCallWithData.call(this, this.receiver.address, _initialBalance, { from: owner })
          );

          await assertRevert(
            transferAndCallWithoutData.call(this, this.receiver.address, _initialBalance, { from: owner })
          );
        });

        it('should fail to transferFromAndCall', async function () {
          await this.token.approve(anotherAccount, _initialBalance, { from: owner });
          this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

          const transferFromAndCallWithData = function (from, to, value, opts) {
            return sendTransaction(
              this.token,
              'transferFromAndCall',
              'address,address,uint256,bytes',
              [from, to, value, '0x42'],
              opts
            );
          };

          const transferFromAndCallWithoutData = function (from, to, value, opts) {
            return sendTransaction(
              this.token,
              'transferFromAndCall',
              'address,address,uint256',
              [from, to, value],
              opts
            );
          };

          await assertRevert(
            transferFromAndCallWithData.call(
              this, owner, this.receiver.address, _initialBalance, { from: anotherAccount }
            )
          );

          await assertRevert(
            transferFromAndCallWithoutData.call(
              this, owner, this.receiver.address, _initialBalance, { from: anotherAccount }
            )
          );
        });
      });

      describe('if it is an operator', function () {
        beforeEach(async function () {
          await this.token.addMinter(minter, { from: owner });
          await this.token.mint(operator, _initialBalance, { from: minter });
          await this.token.addOperator(operator, { from: owner });
        });

        it('should transfer', async function () {
          await this.token.transfer(operator, _initialBalance, { from: operator }).should.be.fulfilled;
        });

        it('should transferFrom', async function () {
          await this.token.approve(anotherAccount, _initialBalance, { from: operator });
          await this.token.transferFrom(
            operator, recipient, _initialBalance, { from: anotherAccount }
          ).should.be.fulfilled;
        });

        it('should transferAndCall', async function () {
          this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

          const transferAndCallWithData = function (to, value, opts) {
            return sendTransaction(
              this.token,
              'transferAndCall',
              'address,uint256,bytes',
              [to, value, '0x42'],
              opts
            );
          };

          const transferAndCallWithoutData = function (to, value, opts) {
            return sendTransaction(
              this.token,
              'transferAndCall',
              'address,uint256',
              [to, value],
              opts
            );
          };

          await transferAndCallWithData.call(
            this, this.receiver.address, _initialBalance / 2, { from: operator }
          ).should.be.fulfilled;

          await transferAndCallWithoutData.call(
            this, this.receiver.address, _initialBalance / 2, { from: operator }
          ).should.be.fulfilled;
        });

        it('should transferFromAndCall', async function () {
          await this.token.approve(anotherAccount, _initialBalance, { from: operator });
          this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

          const transferFromAndCallWithData = function (from, to, value, opts) {
            return sendTransaction(
              this.token,
              'transferFromAndCall',
              'address,address,uint256,bytes',
              [from, to, value, '0x42'],
              opts
            );
          };

          const transferFromAndCallWithoutData = function (from, to, value, opts) {
            return sendTransaction(
              this.token,
              'transferFromAndCall',
              'address,address,uint256',
              [from, to, value],
              opts
            );
          };

          await transferFromAndCallWithData.call(
            this, operator, this.receiver.address, _initialBalance / 2, { from: anotherAccount }
          ).should.be.fulfilled;

          await transferFromAndCallWithoutData.call(
            this, operator, this.receiver.address, _initialBalance / 2, { from: anotherAccount }
          ).should.be.fulfilled;
        });
      });
    });
  });

  context('like a TokenRecover', function () {
    beforeEach(async function () {
      this.instance = this.token;
    });

    shouldBehaveLikeTokenRecover([owner, thirdParty]);
  });
}

module.exports = {
  shouldBehaveLikeBaseToken,
};
