const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');

const { shouldBehaveLikeTokenRecover } = require('eth-token-recover/test/TokenRecover.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Airdrop = artifacts.require('Airdrop');
const BaseToken = artifacts.require('BaseToken');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('Airdrop', function (
  [tokenOwner, airdropOwner, wallet, anotherAccount, receiver1, receiver2, receiver3, thirdParty]
) {
  const _name = 'BaseToken';
  const _symbol = 'ERC20';
  const _decimals = 18;
  const _cap = new BigNumber(10000);

  const addresses = [receiver1, receiver2, receiver3];
  const amounts = [
    new BigNumber(100),
    new BigNumber(200),
    new BigNumber(300),
  ];

  const totalAirdropToken = amounts[0].add(amounts[1]).add(amounts[2]);

  beforeEach(async function () {
    this.token = await BaseToken.new(_name, _symbol, _decimals, _cap, { from: tokenOwner });

    await this.token.addMinter(tokenOwner, { from: tokenOwner });
    await this.token.mint(wallet, totalAirdropToken, { from: tokenOwner });

    this.airdrop = await Airdrop.new(this.token.address, wallet, { from: airdropOwner });
  });

  context('creating a valid airdrop', function () {
    describe('if valid', function () {
      it('has a valid token', async function () {
        const airdropToken = await this.airdrop.token();
        assert.equal(airdropToken, this.token.address);
      });
      it('has a valid wallet', async function () {
        const airdropWallet = await this.airdrop.wallet();
        assert.equal(airdropWallet, wallet);
      });
    });

    describe('if token address is the zero address', function () {
      it('reverts', async function () {
        await assertRevert(
          Airdrop.new(ZERO_ADDRESS, wallet, { from: airdropOwner })
        );
      });
    });

    describe('if wallet address is the zero address', function () {
      it('reverts', async function () {
        await assertRevert(
          Airdrop.new(this.token.address, ZERO_ADDRESS, { from: airdropOwner })
        );
      });
    });
  });

  context('sending airdrop tokens', function () {
    const sendAirdropTokens = function () {
      describe('if airdrop has wallet allowance', function () {
        beforeEach(async function () {
          await this.token.approve(this.airdrop.address, totalAirdropToken, { from: wallet });
        });

        describe('if airdrop owner is calling', function () {
          it('should transfer tokens for given addresses', async function () {
            for (const arrayIndex in addresses) {
              const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
              receiverBalance.should.be.bignumber.equal(0);
            }

            await this.airdrop.multiSend(addresses, amounts, { from: airdropOwner });

            for (const arrayIndex in addresses) {
              const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);

              const expectedTokens = amounts[arrayIndex];
              receiverBalance.should.be.bignumber.equal(expectedTokens);
            }
          });

          it('should increase givenAirdropTokens', async function () {
            for (const arrayIndex in addresses) {
              const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
              receiverBalance.should.be.bignumber.equal(0);
            }

            await this.airdrop.multiSend(addresses, amounts, { from: airdropOwner });

            for (const arrayIndex in addresses) {
              const givenAirdropTokens = await this.airdrop.givenAirdropTokens(addresses[arrayIndex]);

              const expectedTokens = amounts[arrayIndex];
              givenAirdropTokens.should.be.bignumber.equal(expectedTokens);
            }
          });

          it('should increase totalGivenAirdropTokens', async function () {
            let totalGivenTokens = new BigNumber(0);

            await this.airdrop.multiSend(addresses, amounts, { from: airdropOwner });

            for (const arrayIndex in amounts) {
              totalGivenTokens = totalGivenTokens.plus(amounts[arrayIndex]);
            }
            const totalGivenAirdropTokens = await this.airdrop.totalGivenAirdropTokens();
            totalGivenAirdropTokens.should.be.bignumber.equal(totalGivenTokens);
          });

          it('should decrease approval', async function () {
            const initialAllowance = await this.token.allowance(wallet, this.airdrop.address);

            await this.airdrop.multiSend(addresses, amounts, { from: airdropOwner });

            const currentAllowance = await this.token.allowance(wallet, this.airdrop.address);

            currentAllowance.should.be.bignumber.equal(initialAllowance.sub(totalAirdropToken));
          });

          describe('calling twice', function () {
            it('should not transfer tokens for given addresses', async function () {
              for (const arrayIndex in addresses) {
                const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
                receiverBalance.should.be.bignumber.equal(0);
              }

              await this.airdrop.multiSend(addresses, amounts, { from: airdropOwner });
              await this.airdrop.multiSend(addresses, amounts, { from: airdropOwner });

              for (const arrayIndex in addresses) {
                const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);

                const expectedTokens = amounts[arrayIndex];
                receiverBalance.should.be.bignumber.equal(expectedTokens);
              }
            });

            it('should not increase givenAirdropTokens', async function () {
              for (const arrayIndex in addresses) {
                const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
                receiverBalance.should.be.bignumber.equal(0);
              }

              await this.airdrop.multiSend(addresses, amounts, { from: airdropOwner });
              await this.airdrop.multiSend(addresses, amounts, { from: airdropOwner });

              for (const arrayIndex in addresses) {
                const givenAirdropTokens = await this.airdrop.givenAirdropTokens(addresses[arrayIndex]);

                const expectedTokens = amounts[arrayIndex];
                givenAirdropTokens.should.be.bignumber.equal(expectedTokens);
              }
            });

            it('should not increase totalGivenAirdropTokens', async function () {
              let totalGivenTokens = new BigNumber(0);

              await this.airdrop.multiSend(addresses, amounts, { from: airdropOwner });
              await this.airdrop.multiSend(addresses, amounts, { from: airdropOwner });

              for (const arrayIndex in amounts) {
                totalGivenTokens = totalGivenTokens.plus(amounts[arrayIndex]);
              }
              const totalGivenAirdropTokens = await this.airdrop.totalGivenAirdropTokens();
              totalGivenAirdropTokens.should.be.bignumber.equal(totalGivenTokens);
            });
          });

          describe('if sending more than the approved', function () {
            it('reverts', async function () {
              const moreThanTheApproved = totalAirdropToken.add(1);
              await assertRevert(
                this.airdrop.multiSend([receiver1], [moreThanTheApproved], { from: airdropOwner })
              );
            });
          });

          describe('if addresses are empty', function () {
            it('reverts', async function () {
              await assertRevert(
                this.airdrop.multiSend([], amounts, { from: airdropOwner })
              );
            });
          });

          describe('if amounts are empty', function () {
            it('reverts', async function () {
              await assertRevert(
                this.airdrop.multiSend(addresses, [], { from: airdropOwner })
              );
            });
          });

          describe('if amounts length is not equal to addresses length', function () {
            it('reverts', async function () {
              await assertRevert(
                this.airdrop.multiSend([addresses[0]], [amounts[0], amounts[1]], { from: airdropOwner })
              );
            });
          });
        });

        describe('if token owner is calling', function () {
          it('reverts', async function () {
            await assertRevert(
              this.airdrop.multiSend(addresses, amounts, { from: tokenOwner })
            );
          });
        });

        describe('if another account is calling', function () {
          it('reverts', async function () {
            await assertRevert(
              this.airdrop.multiSend(addresses, amounts, { from: anotherAccount })
            );
          });
        });
      });

      describe('if airdrop hasn\'t wallet allowance', function () {
        it('should transfer tokens for given addresses', async function () {
          await assertRevert(this.airdrop.multiSend(addresses, amounts, { from: airdropOwner }));
        });
      });
    };

    describe('during minting', function () {
      beforeEach(async function () {
        await this.token.addOperator(wallet, { from: tokenOwner });
      });

      sendAirdropTokens();
    });

    describe('after minting', function () {
      beforeEach(async function () {
        await this.token.finishMinting({ from: tokenOwner });
      });

      sendAirdropTokens();
    });
  });

  context('like a TokenRecover', function () {
    beforeEach(async function () {
      this.instance = this.airdrop;
    });

    shouldBehaveLikeTokenRecover([airdropOwner, thirdParty]);
  });
});
