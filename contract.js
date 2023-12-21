//import sha3 from 'js-sha3'
//import ethjsAbi from 'ethereumjs-abi'
//import BigNumber from 'bignumber.js'

const sha3  = require('js-sha3');
const ethjsAbi  = require('ethereumjs-abi');
const BigNumber = require('bignumber.js');

module.exports = class Contract {
    methods = {}
    _jsonInterface = []
    static units = {
        wei: 0,
        kwei: 3,
        mwei: 6,
        gwei: 9,
        szabo: 12,
        finney: 15,
        ether: 18,
        kether: 21,
        mether: 24,
        gether: 27,
        tether: 30
    }

    static decodeParameters(outputs, data) {
        return ethjsAbi.rawDecode(outputs.map(el => el.type), Buffer.from(data.slice(2), 'hex'))
    }

    static convert(amount, from, to) {
        if(!BigNumber.isBigNumber(amount) && !(typeof amount === 'string')) {
            console.error('Please pass numbers as strings or BN objects to avoid precision errors')
        }

        from = from.toLowerCase()
        to = to.toLowerCase()

        // eslint-disable-next-line
        if(!this.units.hasOwnProperty(from) || !this.units.hasOwnProperty(to)) {
            console.error(`Unknown parameters: from ${from} or to ${to}`)
        }

        const diff = this.units[from] - this.units[to]
        let base = (new BigNumber(10)).exponentiatedBy(Math.abs(diff))
        if(diff < 0) {
            base = (new BigNumber(1)).dividedBy(base)
        }

        return (new BigNumber(amount)).multipliedBy(base)
    }

    constructor(abi) {
        this._jsonInterface = abi

        if (Array.isArray(abi)) {
            abi.forEach(method => {
                if (method.type !== 'function') {
                    return
                }

                let funcName = method.name + '(' + (method.inputs || []).map(el => el.type).join(',') + ')',
                    fourbytes = '0x' + sha3.keccak256(funcName).slice(0, 8)

                const func = (...args) => {
                    return {
                        encodeABI() {
                            return fourbytes + ethjsAbi.rawEncode(method.inputs.map(el => el.type), args).toString('hex')
                        }
                    }
                }

                this.methods[method.name] = func
                this.methods[fourbytes] = func
                this.methods[funcName] = func
            })
        }
    }
}
