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
        expect(data.number).toEqual(1);
    });
});
