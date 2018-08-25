const { assertRevert } = require('./helpers/assertRevert');

const { shouldBehaveLikeDetailedERC20Token } = require('./behaviours/DetailedERC20.behaviour');
const { shouldBehaveLikeMintableToken } = require('./behaviours/MintableToken.behaviour');
const { shouldBehaveLikeRBACMintableToken } = require('./behaviours/RBACMintableToken.behaviour');
const { shouldBehaveLikeBurnableToken } = require('./behaviours/BurnableToken.behaviour');
const { shouldBehaveLikeStandardToken } = require('./behaviours/StandardToken.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ERC20Token = artifacts.require('ERC20Token');
const MintableToken = artifacts.require('MintableToken');

contract('ERC20Token', function ([owner, anotherAccount, minter, recipient, thirdParty]) {
  const _name = 'ERC20Token';
  const _symbol = 'ERC20';
  const _decimals = 18;

  beforeEach(async function () {
    this.token = await ERC20Token.new(_name, _symbol, _decimals, { from: owner });
  });

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

  context('like a BurnableToken', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
    });
    shouldBehaveLikeBurnableToken([owner], initialBalance);
  });

  context('like a StandardToken', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
      await this.token.finishMinting({ from: owner });
    });
    shouldBehaveLikeStandardToken([owner, anotherAccount, recipient], initialBalance);
  });

  context('like a ERC20Token token', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
    });

    it('should fail transfer before finish minting', async function () {
      await assertRevert(this.token.transfer(owner, initialBalance, { from: owner }));
    });

    it('should fail transferFrom before finish minting', async function () {
      await this.token.approve(anotherAccount, initialBalance, { from: owner });
      await assertRevert(this.token.transferFrom(owner, recipient, initialBalance, { from: anotherAccount }));
    });
  });

  context('safe functions', function () {
    describe('transferAnyERC20Token', function () {
      let anotherERC20;
      const tokenAmount = new BigNumber(1000);

      beforeEach(async function () {
        anotherERC20 = await MintableToken.new({ from: owner });
        await anotherERC20.mint(this.token.address, tokenAmount, { from: owner });
      });

      describe('if owner is calling', function () {
        it('should safe transfer any ERC20 sent for error into the contract', async function () {
          const contractPre = await anotherERC20.balanceOf(this.token.address);
          contractPre.should.be.bignumber.equal(tokenAmount);
          const ownerPre = await anotherERC20.balanceOf(owner);
          ownerPre.should.be.bignumber.equal(0);

          await this.token.transferAnyERC20Token(anotherERC20.address, tokenAmount, { from: owner });

          const contractPost = await anotherERC20.balanceOf(this.token.address);
          contractPost.should.be.bignumber.equal(0);
          const ownerPost = await anotherERC20.balanceOf(owner);
          ownerPost.should.be.bignumber.equal(tokenAmount);
        });
      });

      describe('if third party is calling', function () {
        it('reverts', async function () {
          await assertRevert(
            this.token.transferAnyERC20Token(anotherERC20.address, tokenAmount, { from: thirdParty })
          );
        });
      });
    });
  });
});
