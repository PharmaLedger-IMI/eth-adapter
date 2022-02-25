const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

//opendsu
require("../../../privatesky/psknode/bundles/openDSU");
openDSURequire('overwrite-require');
const opendsu = openDSURequire("opendsu");
//end open dsu

const fs = require('fs');
const solc = require('solc');
const Buffer = require("buffer");

let contractConnection;
let contract;
let contractResult;
let accounts;

function printErrors(compileRes, showWarnings = false) {
    compileRes.forEach(res => {
        if (res.type !== 'Warning' || showWarnings) {
            console.log(res);
        }
    })
}

beforeEach(async () => {

    try {
        const source = fs.readFileSync('./contracts/Base64Test.sol', 'utf8');
        var input = {
            language: 'Solidity',
            sources: {
                'Base64Test.sol': {
                    content: source
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };


        const compileRes = JSON.parse(solc.compile(JSON.stringify(input)));
        printErrors(compileRes.errors);
        const contrbase = compileRes.contracts['Base64Test.sol']['Base64Test'];
        const abiInterface = contrbase.abi;
        const bytecode = contrbase.evm.bytecode.object;
        accounts = await web3.eth.getAccounts();
        console.log("About to deploy contract");
        try {
            contractConnection = await new web3.eth.Contract(abiInterface);
            contract = contractConnection.deploy({data: bytecode});
            contractResult = await contract.send({from: accounts[0], gas: 3000000}, function (err, res) {
            })
        } catch (e) {
            console.log("Error at deploy", e);
        }
    } catch (err) {
        console.log(err);
    }

});

describe('Base64Test', () => {


    // it('deploys a contract', () => {
    //     assert.ok(contractResult.options.address);
    // });

    it('encoding', async () => {
        const crypto = opendsu.loadAPI("crypto");
        const NO_TESTS = 100;
        for (let i = 0; i < NO_TESTS; i++) {
            const len = Math.floor(Math.random() * 33) + 1;
            const testString = crypto.generateRandom(len).toString("hex");
            let result;
            try {
                const command = await contractResult.methods.testEncoding(testString);
                try {
                    result = await command.send({
                        from: accounts[0],
                        gas: 3000000
                    });

                    const expectedEncoding = Buffer.Buffer.from(testString).toString("base64");
                    assert.equal(Buffer.Buffer.from(result.events.Result.returnValues.str.slice(2), "hex").toString(), expectedEncoding);

                } catch (e) {
                    console.log("Error at sending data to smart contract", e)
                }

            } catch (e) {
                console.log("Error at encoding", e)
            }

        }
    }).timeout(20000);

    it('decoding', async () => {
        const crypto = opendsu.loadAPI("crypto");
        const NO_TESTS = 200;
        for (let i = 0; i < NO_TESTS; i++) {
            const len = Math.floor(Math.random() * 33) + 1;
            // const len = 3;
            const testString = crypto.generateRandom(len).toString("hex");
            const testStringEncoded = Buffer.Buffer.from(testString, "hex").toString("base64");
            let result;
            try {
                const command = await contractResult.methods.testDecoding(testStringEncoded);
                try {
                    result = await command.send({
                        from: accounts[0],
                        gas: 3000000
                    });
                    assert.equal(result.events.Result.returnValues.str, '0x' + testString);
                } catch (e) {
                    console.log("Error at sending data to smart contract", e)
                }

            } catch (e) {
                console.log("Error at encoding", e)
            }

        }
    }).timeout(20000);
});