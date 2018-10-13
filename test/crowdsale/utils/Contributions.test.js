const { ether } = require('openzeppelin-solidity/test/helpers/ether');
const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const expectEvent = require('openzeppelin-solidity/test/helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Contributions = artifacts.require('Contributions');

contract('Contributions', function (
  [_, owner, operator, futureOperator, anotherFutureOperator, thirdParty, anotherThirdParty]
) {
  const tokenToAdd = new BigNumber(100);
  const ethToAdd = ether(1);

  beforeEach(async function () {
    this.contributions = await Contributions.new({ from: owner });
    await this.contributions.addOperator(operator, { from: owner });
  });

  describe('if operator is calling', function () {
    it('should success to add amounts to the address balances', async function () {
      let tokenBalance = await this.contributions.tokenBalances(thirdParty);
      tokenBalance.should.be.bignumber.equal(0);
      let ethBalance = await this.contributions.weiContributions(thirdParty);
      ethBalance.should.be.bignumber.equal(0);

      await this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: operator });

      tokenBalance = await this.contributions.tokenBalances(thirdParty);
      tokenBalance.should.be.bignumber.equal(tokenToAdd);
      ethBalance = await this.contributions.weiContributions(thirdParty);
      ethBalance.should.be.bignumber.equal(ethToAdd);

      await this.contributions.addBalance(thirdParty, ethToAdd.mul(3), tokenToAdd.mul(3), { from: operator });

      tokenBalance = await this.contributions.tokenBalances(thirdParty);
      tokenBalance.should.be.bignumber.equal(tokenToAdd.mul(4));
      ethBalance = await this.contributions.weiContributions(thirdParty);
      ethBalance.should.be.bignumber.equal(ethToAdd.mul(4));
    });

    it('should increase total sold tokens and total wei raised', async function () {
      let totalSoldTokens = await this.contributions.totalSoldTokens();
      let totalWeiRaised = await this.contributions.totalWeiRaised();
      totalSoldTokens.should.be.bignumber.equal(0);
      totalWeiRaised.should.be.bignumber.equal(0);

      await this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: operator });
      await this.contributions.addBalance(thirdParty, ethToAdd.mul(3), tokenToAdd.mul(3), { from: operator });

      totalSoldTokens = await this.contributions.totalSoldTokens();
      totalWeiRaised = await this.contributions.totalWeiRaised();
      totalSoldTokens.should.be.bignumber.equal(tokenToAdd.mul(4));
      totalWeiRaised.should.be.bignumber.equal(ethToAdd.mul(4));
    });

    it('should increase array length when different address are passed', async function () {
      let contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 0);

      await this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: operator });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 1);

      await this.contributions.addBalance(anotherThirdParty, ethToAdd, tokenToAdd, { from: operator });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 2);
    });

    it('should not increase array length when same address is passed', async function () {
      let contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 0);

      await this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: operator });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 1);

      await this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: operator });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 1);
    });

    it('should cycle addresses and have the right value set', async function () {
      await this.contributions.addBalance(owner, ethToAdd.mul(3), tokenToAdd.mul(3), { from: operator });
      await this.contributions.addBalance(thirdParty, ethToAdd.mul(4), tokenToAdd.mul(4), { from: operator });
      await this.contributions.addBalance(anotherThirdParty, ethToAdd, tokenToAdd, { from: operator });
      await this.contributions.addBalance(anotherThirdParty, ethToAdd, tokenToAdd, { from: operator });

      const tokenBalances = [];
      tokenBalances[owner] = await this.contributions.tokenBalances(owner);
      tokenBalances[thirdParty] = await this.contributions.tokenBalances(thirdParty);
      tokenBalances[anotherThirdParty] = await this.contributions.tokenBalances(anotherThirdParty);

      const ethBalances = [];
      ethBalances[owner] = await this.contributions.weiContributions(owner);
      ethBalances[thirdParty] = await this.contributions.weiContributions(thirdParty);
      ethBalances[anotherThirdParty] = await this.contributions.weiContributions(anotherThirdParty);

      const contributorsLength = (await this.contributions.getContributorsLength()).valueOf();

      for (let i = 0; i < contributorsLength; i++) {
        const address = await this.contributions.addresses(i);
        const tokenBalance = await this.contributions.tokenBalances(address);
        const ethBalance = await this.contributions.weiContributions(address);

        tokenBalance.should.be.bignumber.equal(tokenBalances[address]);
        ethBalance.should.be.bignumber.equal(ethBalances[address]);
      }
    });
  });

  describe('if third party is calling', function () {
    it('reverts and fail to add amounts to the address balances', async function () {
      let tokenBalance = await this.contributions.tokenBalances(thirdParty);
      let ethBalance = await this.contributions.weiContributions(thirdParty);
      assert.equal(tokenBalance, 0);
      assert.equal(ethBalance, 0);

      await assertRevert(
        this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: thirdParty })
      );

      tokenBalance = await this.contributions.tokenBalances(thirdParty);
      ethBalance = await this.contributions.weiContributions(thirdParty);

      assert.equal(tokenBalance, 0);
      assert.equal(ethBalance, 0);
    });
  });

  context('test RBAC functions', function () {
    describe('in normal conditions', function () {
      it('allows owner to add a operator', async function () {
        await this.contributions.addOperator(futureOperator, { from: owner }).should.be.fulfilled;
      });

      it('allows owner to remove a operator', async function () {
        await this.contributions.addOperator(futureOperator, { from: owner }).should.be.fulfilled;
        await this.contributions.removeOperator(futureOperator, { from: owner }).should.be.fulfilled;
      });

      it('announces a RoleAdded event on addRole', async function () {
        await expectEvent.inTransaction(
          this.contributions.addOperator(futureOperator, { from: owner }),
          'RoleAdded'
        );
      });

      it('announces a RoleRemoved event on removeRole', async function () {
        await expectEvent.inTransaction(
          this.contributions.removeOperator(operator, { from: owner }),
          'RoleRemoved'
        );
      });
    });

    describe('in adversarial conditions', function () {
      it('does not allow "thirdParty" except owner to add a operator', async function () {
        await assertRevert(
          this.contributions.addOperator(futureOperator, { from: operator })
        );
        await assertRevert(
          this.contributions.addOperator(futureOperator, { from: thirdParty })
        );
      });

      it('does not allow "thirdParty" except owner to remove a operator', async function () {
        await this.contributions.addOperator(futureOperator, { from: owner }).should.be.fulfilled;
        await assertRevert(
          this.contributions.removeOperator(futureOperator, { from: operator })
        );
        await assertRevert(
          this.contributions.removeOperator(futureOperator, { from: thirdParty })
        );
      });
    });
  });
});
