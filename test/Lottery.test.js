const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require('../compile');


beforeEach(async () => {
    //list all accounts
    accounts = await web3.eth.getAccounts();

    //use account to deploy contract
    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode, arguments: [] })
        .send({ from: accounts[0], gas: '1000000' });

});

describe('Lottery', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('has a manager', async () => {
        const manager = await lottery.methods.manager().call();
        assert.equal(manager, accounts[0]);
    });

    it('enters lottery', async () => {
        await lottery.methods.enter().send({ from: accounts[1] });
        const players = await lottery.methods.players().call();
        assert.equal(players[0], accounts[1]);
    });

});