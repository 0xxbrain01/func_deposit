import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import  { hex } from '../build/Main.compiled.json';

describe('Main', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let ownerWallet: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;

    beforeAll(async () => {
        code = await compile('Main');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        ownerWallet = await blockchain.treasury('ownerWallet');

        main = blockchain.openContract(await Main.createFromConfig({
            number: 0,
            address: deployer.address,
            owner_address: ownerWallet.address
        }, code));

      
        // const deployResult = await main.sendDeploy(deployer.getSender(), toNano('0.05'));

        // expect(deployResult.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: main.address,
        //     deploy: true,
        //     success: true,
        // });


    });

    it('should get the proper most recent sender address', async () => {
        const senderWallet = await blockchain.treasury("sender");
        
        const sentMessageResult = await main.sendIncrement(senderWallet.getSender(), toNano("0.05"), 1);
        
        expect(sentMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: main.address,
            success: true
        });
        const data = await main.getData();
        console.log("🚀 ~ it ~ data:", data, senderWallet.address);
        //expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());
        //expect(data.number).toEqual(1);

    });

    it("successfully deposits funds", async ()=>{
        const senderWallet = await blockchain.treasury("sender");

        const depositMessageResult = await main.sendDeposit(senderWallet.getSender(), toNano("5"));

        expect(depositMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: main.address,
            success: true
        });

        const balanceRequest = await main.getBalance();
        expect(balanceRequest.number).toBeGreaterThan(toNano("4.99"));
        console.log("balanceRe: ", balanceRequest.number);
    });

    it("should return deposit funds as no command is sent", async ()=>{
        const senderWallet = await blockchain.treasury("sender");

        const depositMessageResult = await main.sendNoCodeDeposit(senderWallet.getSender(), toNano("5"));
    
        console.log("toNa ",main.address);

        expect(depositMessageResult.transactions).toHaveTransaction({
            from: main.address,
            to: senderWallet.address,
            success: true
        });

        const balanceRequest = await main.getBalance();
        console.log("🚀 ~ it ~ balanceRequest:", balanceRequest);
        expect(balanceRequest.number).toBe(0);
    });

    it("successfully withdraw fund on behalf of owner", async ()=>{
        const senderWallet = await blockchain.treasury("sender");

        await main.sendDeposit(senderWallet.getSender(), toNano("5"));

        const withdrawRequestResult = await main.sendWithdrawRequest(ownerWallet.getSender(), 
        toNano("0.05"), 
        toNano("1"));
        //console.log("🚀 ~ it ~ withdrawRequestResult:", withdrawRequestResult)
        
        expect(withdrawRequestResult.transactions).toHaveTransaction({
            from: main.address,
            to: ownerWallet.address,
            success: true,
            value: toNano(1)
        });
    });

    it("fails to withdraw funds on behalf of not-owner", async ()=>{
        const senderWallet = await blockchain.treasury("sender");
        await main.sendDeposit(senderWallet.getSender(), toNano("5"));

        const withdrawRequestResult = await main.sendWithdrawRequest(
            senderWallet.getSender(),
            toNano("0.5"),
            toNano("1")
        );

        expect(withdrawRequestResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: main.address,
            success: false,
           
        });
    });

    it("fails to withdraw funds because lack of balance", async ()=>{
        const withdrawRequestResult = await main.sendWithdrawRequest(
            ownerWallet.getSender(),
            toNano("0.5"),
            toNano("1")
        );
        console.log("🚀 ~ it ~ withdrawRequestResult:", withdrawRequestResult.transactions)

        expect(withdrawRequestResult.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: main.address,
            success: false,
             
        });
    });
});
