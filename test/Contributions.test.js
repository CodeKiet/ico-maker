const { assertRevert } = require('./helpers/assertRevert');
const expectEvent = require('./helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Contributions = artifacts.require('Contributions');

contract('Contributions', function ([_, owner, minter, futureMinter, thirdParty, anotherThirdParty]) {
  const valueToAdd = new BigNumber(100);
  beforeEach(async function () {
    this.contributions = await Contributions.new({ from: owner });
    await this.contributions.addMinter(minter, { from: owner });
  });

  describe('if minter is calling', function () {
    it('should success to add token amount to the address balance', async function () {
      let balance = await this.contributions.tokenBalances(thirdParty);
      balance.should.be.bignumber.equal(0);

      await this.contributions.addBalance(thirdParty, valueToAdd, { from: minter });

      balance = await this.contributions.tokenBalances(thirdParty);
      balance.should.be.bignumber.equal(valueToAdd);

      await this.contributions.addBalance(thirdParty, valueToAdd.mul(3), { from: minter });

      balance = await this.contributions.tokenBalances(thirdParty);
      balance.should.be.bignumber.equal(valueToAdd.mul(4));
    });

    it('should increase array length when different address are passed', async function () {
      let contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 0);

      await this.contributions.addBalance(thirdParty, valueToAdd, { from: minter });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 1);

      await this.contributions.addBalance(anotherThirdParty, valueToAdd, { from: minter });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 2);
    });

    it('should not increase array length when same address is passed', async function () {
      let contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 0);

      await this.contributions.addBalance(thirdParty, valueToAdd, { from: minter });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 1);

      await this.contributions.addBalance(thirdParty, valueToAdd, { from: minter });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 1);
    });

    it('should cycle addresses and have the right value set', async function () {
      await this.contributions.addBalance(owner, valueToAdd.mul(3), { from: minter });
      await this.contributions.addBalance(thirdParty, valueToAdd.mul(4), { from: minter });
      await this.contributions.addBalance(anotherThirdParty, valueToAdd, { from: minter });
      await this.contributions.addBalance(anotherThirdParty, valueToAdd, { from: minter });

      const balances = [];
      balances[owner] = await this.contributions.tokenBalances(owner);
      balances[thirdParty] = await this.contributions.tokenBalances(thirdParty);
      balances[anotherThirdParty] = await this.contributions.tokenBalances(anotherThirdParty);

      const contributorsLength = (await this.contributions.getContributorsLength()).valueOf();

      for (let i = 0; i < contributorsLength; i++) {
        const address = await this.contributions.addresses(i);
        const balance = await this.contributions.tokenBalances(address);

        balance.should.be.bignumber.equal(balances[address]);
      }
    });
  });

  describe('if third party is calling', function () {
    it('reverts and fail to add token amount to the address balance', async function () {
      let balance = await this.contributions.tokenBalances(thirdParty);
      assert.equal(balance, 0);

      await assertRevert(
        this.contributions.addBalance(thirdParty, valueToAdd, { from: thirdParty })
      );

      balance = await this.contributions.tokenBalances(thirdParty);
      assert.equal(balance, 0);
    });
  });

  context('test RBAC functions', function () {
    describe('in normal conditions', function () {
      it('allows owner to add a minter', async function () {
        await this.contributions.addMinter(futureMinter, { from: owner }).should.be.fulfilled;
      });

      it('allows owner to remove a minter', async function () {
        await this.contributions.addMinter(futureMinter, { from: owner }).should.be.fulfilled;
        await this.contributions.removeMinter(futureMinter, { from: owner }).should.be.fulfilled;
      });

      it('announces a RoleAdded event on addRole', async function () {
        await expectEvent.inTransaction(
          this.contributions.addMinter(futureMinter, { from: owner }),
          'RoleAdded'
        );
      });

      it('announces a RoleRemoved event on removeRole', async function () {
        await expectEvent.inTransaction(
          this.contributions.removeMinter(minter, { from: owner }),
          'RoleRemoved'
        );
      });
    });

    describe('in adversarial conditions', function () {
      it('does not allow "thirdParty" except owner to add a minter', async function () {
        await assertRevert(
          this.contributions.addMinter(futureMinter, { from: minter })
        );
        await assertRevert(
          this.contributions.addMinter(futureMinter, { from: thirdParty })
        );
      });

      it('does not allow "thirdParty" except owner to remove a minter', async function () {
        await this.contributions.addMinter(futureMinter, { from: owner }).should.be.fulfilled;
        await assertRevert(
          this.contributions.removeMinter(futureMinter, { from: minter })
        );
        await assertRevert(
          this.contributions.removeMinter(futureMinter, { from: thirdParty })
        );
      });
    });
  });
});
