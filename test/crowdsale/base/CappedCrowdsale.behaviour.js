const { assertRevert } = require('../../helpers/assertRevert');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeCappedCrowdsale ([investor, purchaser]) {
  let cap;
  let lessThanCap;

  beforeEach(async function () {
    cap = await this.crowdsale.cap();
    lessThanCap = cap.div(2);
  });

  describe('accepting payments', function () {
    describe('high-level purchase', function () {
      it('should accept payments within cap', async function () {
        await this.crowdsale.sendTransaction({ value: cap.minus(lessThanCap), from: investor }).should.be.fulfilled;
        await this.crowdsale.sendTransaction({ value: lessThanCap, from: investor }).should.be.fulfilled;
      });

      it('should reject payments outside cap', async function () {
        await this.crowdsale.sendTransaction({ value: cap, from: investor });
        await assertRevert(this.crowdsale.sendTransaction({ value: 1, from: investor }));
      });

      it('should reject payments that exceed cap', async function () {
        await assertRevert(this.crowdsale.sendTransaction({ value: cap.plus(1), from: investor }));
      });
    });

    describe('low-level purchase', function () {
      it('should accept payments within cap', async function () {
        await this.crowdsale.buyTokens(investor, {
          value: cap.minus(lessThanCap),
          from: purchaser,
        }).should.be.fulfilled;
        await this.crowdsale.buyTokens(investor, { value: lessThanCap, from: purchaser }).should.be.fulfilled;
      });

      it('should reject payments outside cap', async function () {
        await this.crowdsale.buyTokens(investor, { value: cap, from: purchaser });
        await assertRevert(this.crowdsale.buyTokens(investor, { value: 1, from: purchaser }));
      });

      it('should reject payments that exceed cap', async function () {
        await assertRevert(this.crowdsale.buyTokens(investor, { value: cap.plus(1), from: purchaser }));
      });
    });
  });

  describe('ending', function () {
    it('should not reach cap if sent under cap', async function () {
      let capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
      await this.crowdsale.sendTransaction({ value: lessThanCap, from: investor });
      capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
    });

    it('should not reach cap if sent just under cap', async function () {
      await this.crowdsale.sendTransaction({ value: cap.minus(1), from: investor });
      const capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
    });

    it('should reach cap if cap sent', async function () {
      await this.crowdsale.sendTransaction({ value: cap, from: investor });
      const capReached = await this.crowdsale.capReached();
      capReached.should.equal(true);
    });
  });
}

module.exports = {
  shouldBehaveLikeCappedCrowdsale,
};
