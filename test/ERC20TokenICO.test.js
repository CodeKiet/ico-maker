import { advanceBlock } from './helpers/advanceToBlock';
import { duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import ether from './helpers/ether';
import assertRevert from './helpers/assertRevert';

import shouldBehaveDefaultCrowdsale from './behaviours/DefaultCrowdsale.behaviour';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ERC20TokenICO = artifacts.require('ERC20TokenICO');
const ERC20Token = artifacts.require('ERC20Token');
const Contributions = artifacts.require('Contributions');

const ROLE_MINTER = 'minter';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('ERC20TokenICO', function ([owner, investor, wallet, purchaser, thirdParty]) {
  const _name = 'ERC20Token';
  const _symbol = 'ERC20';
  const _decimals = 18;

  const rate = new BigNumber(1000);
  const cap = ether(1);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime() + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.token = await ERC20Token.new(_name, _symbol, _decimals);
    this.contributions = await Contributions.new();
    this.crowdsale = await ERC20TokenICO.new(
      this.openingTime,
      this.closingTime,
      rate,
      wallet,
      cap,
      this.token.address,
      this.contributions.address
    );

    await this.token.addMinter(this.crowdsale.address);
    await this.contributions.addMinter(this.crowdsale.address);
  });

  context('like a DefaultCrowdsale', function () {
    shouldBehaveDefaultCrowdsale([owner, investor, wallet, purchaser, thirdParty], rate);
  });

  context('like a ERC20TokenICO', function () {
    describe('creating a valid crowdsale', function () {
      it('should be token minter', async function () {
        const isMinter = await this.token.hasRole(this.crowdsale.address, ROLE_MINTER);
        isMinter.should.equal(true);
      });

      it('cap should be right set', async function () {
        const expectedCap = await this.crowdsale.cap();
        cap.should.be.bignumber.equal(expectedCap);
      });

      it('should fail with zero rate', async function () {
        await assertRevert(
          ERC20TokenICO.new(
            this.openingTime,
            this.closingTime,
            0,
            wallet,
            cap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if wallet is the zero address', async function () {
        await assertRevert(
          ERC20TokenICO.new(
            this.openingTime,
            this.closingTime,
            rate,
            ZERO_ADDRESS,
            cap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if token is the zero address', async function () {
        await assertRevert(
          ERC20TokenICO.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            cap,
            ZERO_ADDRESS,
            this.contributions.address
          )
        );
      });

      it('should fail if opening time is in the past', async function () {
        await assertRevert(
          ERC20TokenICO.new(
            latestTime() - duration.seconds(1),
            this.closingTime,
            rate,
            wallet,
            cap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if opening time is after closing time in the past', async function () {
        await assertRevert(
          ERC20TokenICO.new(
            this.closingTime,
            this.openingTime,
            rate,
            wallet,
            cap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if contributions is the zero address', async function () {
        await assertRevert(
          ERC20TokenICO.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            cap,
            this.token.address,
            ZERO_ADDRESS
          )
        );
      });

      it('should fail with zero cap', async function () {
        await assertRevert(
          ERC20TokenICO.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            0,
            this.token.address,
            this.contributions.address
          )
        );
      });
    });
  });
});
