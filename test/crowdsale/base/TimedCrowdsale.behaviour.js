const { increaseTimeTo } = require('../../helpers/increaseTime');
const { assertRevert } = require('../../helpers/assertRevert');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeTimedCrowdsale ([owner, investor, wallet, purchaser], rate, value) {
  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasClosed();
    ended.should.equal(false);
    await increaseTimeTo(this.afterClosingTime);
    ended = await this.crowdsale.hasClosed();
    ended.should.equal(true);
  });

  describe('accepting payments', function () {
    it('should reject payments before start', async function () {
      await assertRevert(this.crowdsale.sendTransaction({ value: value, from: investor }));
      await assertRevert(this.crowdsale.buyTokens(investor, { from: purchaser, value: value }));
    });

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.sendTransaction({ value: value, from: investor }).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
    });

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterClosingTime);
      await assertRevert(this.crowdsale.sendTransaction({ value: value, from: investor }));
      await assertRevert(this.crowdsale.buyTokens(investor, { value: value, from: purchaser }));
    });
  });
}

module.exports = {
  shouldBehaveLikeTimedCrowdsale,
};
