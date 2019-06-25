const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
    //list all accounts
    accounts = await web3.eth.getAccounts();

    //use account to deploy contract
    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '1000000' });

});

describe('Lottery', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('has a manager', async () => {
        const manager = await lottery.methods.manager().call();
        assert.equal(accounts[0], manager);
    });

    it('allows one account to enter', async () => {
        await lottery.methods.enter().send({ from: accounts[1], value: web3.utils.toWei('0.1', 'ether') });
        const players = await lottery.methods.getPlayers().call({
            from: accounts[1]
        });
        assert.equal(accounts[1], players[0]);
        assert.equal(1, players.length)
    });

    it('allows multiple accounts to enter', async () => {
        await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.1', 'ether') });
        await lottery.methods.enter().send({ from: accounts[1], value: web3.utils.toWei('0.1', 'ether') });
        await lottery.methods.enter().send({ from: accounts[2], value: web3.utils.toWei('0.1', 'ether') });
        const players = await lottery.methods.getPlayers().call({
            from: accounts[1]
        });
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length)
    });

    it('requires ether to enter', async () => {
        try {
            await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.01', 'ether') });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it('requires manager to pick winner', async () => {
        try {
            await lottery.methods.pickWinner().send({ from: accounts[1] });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it('sends funds to winner', async () => {
        await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('1', 'ether') });
        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({ from: accounts[0] });
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;
        assert(difference > web3.utils.toWei('0.9', 'ether'));
    });

});