const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');

const { shouldBehaveLikeTokenRecover } = require('eth-token-recover/test/TokenRecover.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Bounty = artifacts.require('Bounty');
const BaseToken = artifacts.require('BaseToken');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('Bounty', function (
  [tokenOwner, bountyOwner, anotherAccount, receiver1, receiver2, receiver3, thirdParty]
) {
  const _name = 'BaseToken';
  const _symbol = 'ERC20';
  const _decimals = 18;
  const _cap = new BigNumber(10000);

  const cap = new BigNumber(20000);

  const addresses = [receiver1, receiver2, receiver3];
  const amounts = [
    new BigNumber(100),
    new BigNumber(200),
    new BigNumber(300),
  ];

  beforeEach(async function () {
    this.token = await BaseToken.new(_name, _symbol, _decimals, _cap, { from: tokenOwner });
    this.bounty = await Bounty.new(this.token.address, cap, { from: bountyOwner });
    await this.token.addMinter(this.bounty.address, { from: tokenOwner });
  });

  context('creating a valid bounty', function () {
    describe('if valid', function () {
      it('has a valid token', async function () {
        const bountyToken = await this.bounty.token();
        assert.equal(bountyToken, this.token.address);
      });
      it('has a valid cap', async function () {
        const bountyCap = await this.bounty.cap();
        bountyCap.should.be.bignumber.equal(cap);
      });
    });

    describe('if token address is the zero address', function () {
      it('reverts', async function () {
        await assertRevert(
          Bounty.new(ZERO_ADDRESS, cap, { from: bountyOwner })
        );
      });
    });

    describe('if cap is zero', function () {
      it('reverts', async function () {
        await assertRevert(
          Bounty.new(this.token.address, 0, { from: bountyOwner })
        );
      });
    });
  });

  context('sending bounty tokens', function () {
    describe('if bounty owner is calling', function () {
      it('should transfer tokens for given addresses', async function () {
        for (const arrayIndex in addresses) {
          const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
          receiverBalance.should.be.bignumber.equal(0);
        }

        await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

        for (const arrayIndex in addresses) {
          const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);

          const expectedTokens = amounts[arrayIndex];
          receiverBalance.should.be.bignumber.equal(expectedTokens);
        }
      });

      it('should increase givenBountyTokens', async function () {
        for (const arrayIndex in addresses) {
          const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
          receiverBalance.should.be.bignumber.equal(0);
        }

        await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

        for (const arrayIndex in addresses) {
          const givenBountyTokens = await this.bounty.givenBountyTokens(addresses[arrayIndex]);

          const expectedTokens = amounts[arrayIndex];
          givenBountyTokens.should.be.bignumber.equal(expectedTokens);
        }
      });

      it('should increase totalGivenBountyTokens', async function () {
        let totalGivenTokens = new BigNumber(0);

        await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

        for (const arrayIndex in amounts) {
          totalGivenTokens = totalGivenTokens.plus(amounts[arrayIndex]);
        }
        const totalGivenBountyTokens = await this.bounty.totalGivenBountyTokens();
        totalGivenBountyTokens.should.be.bignumber.equal(totalGivenTokens);
      });

      it('should decrease remainingTokens', async function () {
        let totalGivenTokens = new BigNumber(0);

        await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

        for (const arrayIndex in amounts) {
          totalGivenTokens = totalGivenTokens.plus(amounts[arrayIndex]);
        }
        const remainingTokens = await this.bounty.remainingTokens();
        remainingTokens.should.be.bignumber.equal(
          cap.sub(totalGivenTokens)
        );
      });

      describe('calling twice', function () {
        it('should transfer tokens for given addresses', async function () {
          for (const arrayIndex in addresses) {
            const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
            receiverBalance.should.be.bignumber.equal(0);
          }

          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });
          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

          for (const arrayIndex in addresses) {
            const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);

            const expectedTokens = amounts[arrayIndex];
            receiverBalance.should.be.bignumber.equal(expectedTokens.mul(2));
          }
        });

        it('should increase givenBountyTokens', async function () {
          for (const arrayIndex in addresses) {
            const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
            receiverBalance.should.be.bignumber.equal(0);
          }

          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });
          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

          for (const arrayIndex in addresses) {
            const givenBountyTokens = await this.bounty.givenBountyTokens(addresses[arrayIndex]);

            const expectedTokens = amounts[arrayIndex];
            givenBountyTokens.should.be.bignumber.equal(expectedTokens.mul(2));
          }
        });

        it('should increase totalGivenBountyTokens', async function () {
          let totalGivenTokens = new BigNumber(0);

          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });
          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

          for (const arrayIndex in amounts) {
            totalGivenTokens = totalGivenTokens.plus(amounts[arrayIndex]);
          }
          const totalGivenBountyTokens = await this.bounty.totalGivenBountyTokens();
          totalGivenBountyTokens.should.be.bignumber.equal(totalGivenTokens.mul(2));
        });
      });

      describe('if minting more than the cap', function () {
        it('reverts', async function () {
          const moreThanTheCap = cap.add(1);
          await assertRevert(
            this.bounty.multiSend([receiver1], [moreThanTheCap], { from: bountyOwner })
          );
        });
      });

      describe('if addresses are empty', function () {
        it('reverts', async function () {
          await assertRevert(
            this.bounty.multiSend([], amounts, { from: bountyOwner })
          );
        });
      });

      describe('if amounts are empty', function () {
        it('reverts', async function () {
          await assertRevert(
            this.bounty.multiSend(addresses, [], { from: bountyOwner })
          );
        });
      });

      describe('if amounts length is not equal to addresses length', function () {
        it('reverts', async function () {
          await assertRevert(
            this.bounty.multiSend([addresses[0]], [amounts[0], amounts[1]], { from: bountyOwner })
          );
        });
      });
    });

    describe('if token owner is calling', function () {
      it('reverts', async function () {
        await assertRevert(
          this.bounty.multiSend(addresses, amounts, { from: tokenOwner })
        );
      });
    });

    describe('if another account is calling', function () {
      it('reverts', async function () {
        await assertRevert(
          this.bounty.multiSend(addresses, amounts, { from: anotherAccount })
        );
      });
    });

    describe('if minting is finished', function () {
      it('reverts', async function () {
        await this.token.finishMinting({ from: tokenOwner });
        await assertRevert(
          this.bounty.multiSend(addresses, amounts, { from: bountyOwner })
        );
      });
    });
  });

  context('like a TokenRecover', function () {
    beforeEach(async function () {
      this.instance = this.bounty;
    });

    shouldBehaveLikeTokenRecover([bountyOwner, thirdParty]);
  });
});
