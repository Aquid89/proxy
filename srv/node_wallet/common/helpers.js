const ethUtil = require('ethereumjs-util')
const BigNumber = require('bignumber.js')

const MODELS = require(__dirname + '/models')

const compoundMap = {
    '0x4b0181102a0112a2ef11abee5563bb4a3176c9d7': '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
    '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5': '0x0',
    '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643': '0x6b175474e89094c44da98b954eedeac495271d0f',
    '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e': '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
    '0x35a18000230da775cac24873d00ff85bccded550': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    '0x39aa39c021dfbae8fac545936693ac917d5e7563': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    '0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4': '0xc00e94cb662c3520282e6f5717214004a7f26888',
    '0x80a2ae356fc9ef4305676f7a3e2ed04e12c33946': '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
    '0x95b4ef2869ebd94beb4eee400a99824bf5dc325b': '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    '0x7713dd9ca933848f6819f38b8352d9a15ea73f67': '0x956f47f50a910163d8bf957cf5846d573e7f87ca',
    '0x12392f67bdf24fae0af363c24ac620a2f67dad86': '0x0000000000085d4780b73119b644ae5ecd22b376',
    '0x158079ee67fce2f58472a96584a73c7ab9ac95c1': '0x1985365e9f78359a9b6ad760e32412f4a445e862',
    '0x041171993284df560249b57358f931d9eb7b925d': '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
    '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407': '0xe41d2489571d322189246dafa5ebde1f4699f498',
    '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    '0xccf4429db6322d5c611ee964527d42e5d685dd6a': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    '0xe65cdb6479bac1e22340e4e755fae7e509ecd06c': '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    '0xf5dce57282a584d2746faf1593d3121fcac444dc': '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9': '0xdac17f958d2ee523a2206206994597c13d831ec7',
    '0xface851a4921ce59e912d19329929ce6da6eb0c7': '0x514910771af9ca656af840dff83e8264ecf986ca'
}

const parseInputData = (input, abi, blockchain) => {
    let paramsList = []
    let abiTokens = abi.split('(')[1].split(')')[0].split(',').map(el => {
        el = el.trim().split(' ')

        paramsList.push(el[0])

        return {
            name: el[1],
            type: el[0]
        }
    })

    let decoded = app.web3[blockchain].eth.abi.decodeParameters(paramsList, input.slice(10))

    let requestData = {},
        typeIds = {}

    for(let i=0; i<abiTokens.length; i++) {
        let param = abiTokens[i]

        if (typeof decoded[i] === 'bigint') {
            decoded[i] = decoded[i].toString()
        } else if (Array.isArray(decoded[i])) {
            let newArr = []
            for(let n in decoded[i]) {
                newArr.push(typeof decoded[i][n] === 'bigint' ? decoded[i][n].toString() : decoded[i][n])
            }

            decoded[i] = newArr
        }

        if (param.name) {
            requestData[param.name] = decoded[i]
        } else {
            if (typeIds[param.type] === undefined) {
                requestData[param.type] = decoded[i]

                typeIds[param.type] = 0
            } else {
                typeIds[param.type]++

                requestData[param.type+'_'+typeIds[param.type]] = decoded[i]
            }
        }
    }

    return requestData
}

const categorizeTransaction = (tx) => {
    if (tx.block_height) {
        tx.blockNumber = tx.block_height
    }

    if (tx.gas_price) {
        tx.gasPrice = tx.gas_price
    }

    if (tx.gas_used) {
        tx.gasUsed = tx.gas_used
    }

    if (tx.block_time) {
        tx.timeStamp = tx.block_time
    }

    if (tx.max_fee_per_gas) {
        tx.maxFeePerGas = tx.max_fee_per_gas
    }

    if (tx.max_priority_fee_per_gas) {
        tx.maxPriorityFeePerGas = tx.max_priority_fee_per_gas
    }

    if (!tx.input) {
        tx.input = '0x'
    }

    tx.value = BigNumber(tx.value).div(BigNumber(10).pow(18)).toNumber()

    let transaction = {
        blockchain: tx.blockchain,
        type: 'unknown',
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        nonce: tx.nonce,
        blockNumber: tx.blockNumber,
        value: tx.value,
        input: tx.input.slice(0, 128),
        inputTruncated: tx.input.length > 128,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        gasUsed: tx.gasUsed,
        baseFeePerGas: tx.baseFeePerGas,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        timeStamp: tx.timeStamp,
        status: tx.status,
        logs: tx.logs
    }

    if (tx.to === '0x' || tx.to === '' || tx.to === '0x00') {
        let nonce = tx.nonce.toString(16)

        if (nonce.length % 2) {
            nonce = '0'+nonce
        }

        transaction.type = 'deploy-contract'

        let methods = (tx.input && tx.input.match(/578063.{16}/g) ? tx.input.match(/578063.{16}/g).map(v => {
                return v.slice(6, 14)
            }) : []).map(el => app.info.fourbytes['0x'+el] ||'0x'+el+'()')

        transaction.data = {
            address: ethUtil.bufferToHex(ethUtil.generateAddress(Buffer.from(tx.from.slice(2), 'hex'), Buffer.from(nonce, 'hex'))),
            methods
        }
    } else {
        if (tx.input === '0x') {
            transaction.type = 'send-ether'
            transaction.data = {
                value: tx.value
            }
        } else {
            let fourbytes = tx.input.slice(0, 10)
            if (fourbytes === '0xa9059cbb') {
                transaction.type = 'send-erc20-token'
                transaction.data = {
                    contract: tx.to,
                    to: '0x'+tx.input.slice(34, 74),
                    value: parseInt(tx.input.slice(74), 16)
                }

                if (app.info.tokens[tx.blockchain][tx.to] !== undefined) {
                    transaction.data.contractInfo = app.info.tokens[tx.blockchain][tx.to]
                }
            } else if (
                (fourbytes === '0x3593564c' && tx.to === '0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b')
                ||
                (fourbytes === '0x0502b1c5' && tx.to === '0x1111111254eeb25477b68fb85ed929f73a960582')
                ||
                (fourbytes === '0x12aa3caf' && tx.to === '0x1111111254eeb25477b68fb85ed929f73a960582')
                ||
                (fourbytes === '0x3c15fd91' && tx.to === '0x1111111254eeb25477b68fb85ed929f73a960582')
                ||
                (fourbytes === '0x7c025200' && tx.to === '0x1111111254eeb25477b68fb85ed929f73a960582')
                ||
                (fourbytes === '0x7c025200' && tx.to === '0x1111111254fb6c44bac0bed2854e76f90643097d')
                ||
                (fourbytes === '0x0502b1c5' && tx.to === '0x1111111254fb6c44bac0bed2854e76f90643097d')
                ||
                (fourbytes === '0x12aa3caf' && tx.to === '0x1111111254fb6c44bac0bed2854e76f90643097d')
                ||
                (fourbytes === '0x3c15fd91' && tx.to === '0x1111111254fb6c44bac0bed2854e76f90643097d')
                ||
                (fourbytes === '0xd0e30db0' && tx.to === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
                ||
                (fourbytes === '0x2e1a7d4d' && tx.to === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
            ) {
                transaction.type = 'swap'
                transaction.data = {
                    blockchain: tx.blockchain,
                    dex: ''
                }

                // @TODO remake for multichain
                switch (tx.to) {
                    case '0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b':
                        transaction.data.dex = 'uniswap'
                        break
                    case '0x1111111254eeb25477b68fb85ed929f73a960582':
                        transaction.data.dex = '1inch'
                        break
                    case '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2':
                        transaction.data.dex = 'weth'
                        break
                }
            } else if (fourbytes === '0x095ea7b3') {
                transaction.type = 'approval'
                transaction.data = {
                    contract: tx.to,
                    value: parseInt(tx.input.slice(74), 16),
                    hexValue: '0x'+tx.input.slice(74)
                }

                if (app.info.tokens[tx.blockchain][tx.to] !== undefined) {
                    transaction.data.contractInfo = app.info.tokens[tx.blockchain][tx.to]
                }
            } else if (fourbytes === '0xf242432a') {
                transaction.type = 'send-nft'

                let toks = tx.input.split('x')[1].match(/.{1,64}/g)

                transaction.data = {
                    contract: tx.to,
                    from: '0x'+toks[0].slice(32),
                    to: '0x'+toks[1].slice(32),
                    nft_id: parseInt(toks[3]),
                    value: parseInt(toks[4])
                }

                // @TODO
                // if (app.info.tokens[tx.blockchain][tx.to] !== undefined) {
                //     transaction.data.contractInfo = app.info.tokens[tx.blockchain][tx.to]
                // }
            } else if (fourbytes === '0x23b872dd' && tx.input.split('x')[1].match(/.{1,64}/g).length > 3) {
                transaction.type = 'send-nft'

                let toks = tx.input.split('x')[1].match(/.{1,64}/g)

                transaction.data = {
                    contract: tx.to,
                    from: '0x'+toks[0].slice(24),
                    to: '0x'+toks[1].slice(24),
                    nft_id: parseInt(toks[3]),
                    value: 1
                }
            } else if ([
                '0x87201b41',
                '0xfb0f3ee1',
                '0xf2d12b12',
                '0x00000000'
            ].indexOf(fourbytes) !== -1 && [
                '0x00000000006cee72100d161c57ada5bb2be1ca79',
                '0x00000000006c3852cbef3e08e8df289169ede581',
                '0x00000000000006c7676171937c444f6bde3d6282',
                '0x0000000000000ad24e80fd803c6ac37206a45f15',
                '0x00000000000001ad428e4906ae43d8f9852d0dd6',
                '0x00000000000000adc04c56bf30ac9d3c0aaf14dc'
            ].indexOf(tx.to) !== -1) {
                transaction.type = 'nft-trade'

                transaction.data = {
                    blockchain: tx.blockchain,
                    dex: 'opensea'
                }
            } else if ((transaction.to === '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2' && fourbytes === '0x617ba037') || (['0x1249c58b', '0xa0712d68'].indexOf(fourbytes) !== -1 && compoundMap[transaction.to])) {
                transaction.type = 'lend'

                let toks = tx.input.slice(10).match(/.{1,64}/g),
                    value = 0

                if (fourbytes === '0xa0712d68') {
                    value = parseInt(toks[0], 16)
                } else if (fourbytes === '0x617ba037') {
                    value = parseInt(toks[1], 16)
                } else {
                    value = transaction.value * Math.pow(10, 18)
                }

                transaction.data = {
                    blockchain: tx.blockchain,
                    protocol: ['0x1249c58b', '0xa0712d68'].indexOf(fourbytes) !== -1 ? 'compound' : 'aave',
                    value,
                    token: ['0x1249c58b', '0xa0712d68'].indexOf(fourbytes) !== -1 ? compoundMap[transaction.to] : '0x'+toks[0].slice(24)
                }

                transaction.data.contractInfo = app.info.tokens[tx.blockchain][transaction.data.token]

                if (transaction.data.contractInfo) {
                    transaction.data.value /= Math.pow(10, transaction.data.contractInfo.decimals)
                }
            } else if (((transaction.to === '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2' && fourbytes === '0x69328dec') || (fourbytes === '0xdb006a75' && compoundMap[transaction.to] && Array.isArray(transaction.logs) && transaction.logs.length))) {
                transaction.type = 'redeem'

                let toks = tx.input.slice(10).match(/.{1,64}/g),
                    token = fourbytes === '0xdb006a75' ? compoundMap[transaction.to] : '0x'+toks[0].slice(24),
                    value = 0

                if (fourbytes === '0xdb006a75') {
                    if (token !== '0x0') {
                        value = transaction.logs.find(el => el.name === 'Transfer' && el.contract === token).params.value
                    } else {
                        value = transaction.logs.find(el => el.name === 'Redeem').params.amount
                    }
                } else {
                    value = parseInt(toks[1], 16)
                }

                transaction.data = {
                    blockchain: tx.blockchain,
                    protocol: fourbytes === '0xdb006a75' ? 'compound' : 'aave',
                    value,
                    token
                }

                transaction.data.contractInfo = app.info.tokens[transaction.data.blockchain][transaction.data.token]

                if (transaction.data.contractInfo) {
                    transaction.data.value /= Math.pow(10, transaction.data.contractInfo.decimals)
                }
            } else {
                let message = app.web3[tx.blockchain].utils.hexToUtf8(tx.input)

                if (message !== '' && isReadable(message)) {
                    transaction.type = 'message'

                    transaction.data = {
                        message
                    }
                } else {
                    const callTx = () => {
                        transaction.type = 'call'

                        let parsedData,
                            hex = tx.input.slice(0, 10),
                            functionName = app.info.fourbytes[hex]

                        try {
                            parsedData = functionName ? parseInputData(tx.input, functionName, tx.blockchain) : {}
                        } catch (e) {
                            parsedData = {}
                            functionName = hex
                        }

                        transaction.data = {
                            method: functionName,
                            params: parsedData
                        }
                    }

                    if (transaction.logs && transaction.logs.length) {
                        let logFound

                        if (transaction.logs.filter(log => {
                            let filter = log.params.nft_id && log.params.from === '0x0000000000000000000000000000000000000000'

                            if (filter) {
                                logFound = log
                            }

                            return filter
                        }).length) {
                            transaction.type = 'nft-mint'

                            transaction.data = {
                                contract: logFound.contract,
                                nft_id: logFound.params.nft_id,
                                recipient: logFound.params.to
                            }
                        } else {
                            callTx()
                        }
                    } else {
                        callTx()
                    }
                }
            }
        }
    }

    if (transaction.logs && transaction.logs.length) {
        transaction.logsCount = transaction.logs.length
        transaction.logs = transaction.logs.slice(0, 3)
    }

    return transaction
}

const parseLogs = (logs, blockchain) => {
    let ret = []

    for(let n in logs) {
        let log = logs[n],
            logType = app.info.topic0[log.topics_0]

        // Opensea trade report
        if (log.topics_0 === '0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31') {
            let data = log.data.split('x')[1].match(/.{1,64}/g),
                pos = 5,
                tupleSize = parseInt(data[4], 16),
                sale = {
                    offerer: '0x'+data[1].slice(26),
                    offers: [],
                    considerations: []
                }

            for(let i=0; i<tupleSize; i++) {
                sale.offers.push({
                    contract: '0x'+data[pos+1].slice(24),
                    type: parseInt(data[pos], 16),
                    nft_id: parseInt(data[pos+2], 16),
                    value: parseInt(data[pos+3], 16)
                })

                pos += 4
            }

            tupleSize = parseInt(data[pos], 16)

            pos++

            for(let i=0; i<tupleSize; i++) {
                sale.considerations.push({
                    contract: '0x'+data[pos+1].slice(24),
                    type: parseInt(data[pos], 16),
                    nft_id: parseInt(data[pos+2], 16),
                    value: parseInt(data[pos+3], 16),
                    receiver: '0x'+data[pos+4].slice(24)
                })

                pos += 5
            }

            ret.push({
                contract: log.address,
                name: 'OpenSeaLog',
                params: sale
            })
            continue
        } else if (logType === undefined) {
            continue
        }

        let [name, params] = logType.split('('),
            args = {},
            logData = log.topics_1.split('0x')[1] +
                      log.topics_2.split('0x')[1] +
                      log.topics_3.split('0x')[1] +
                      log.data.split('0x')[1]

        params = params.split(')')[0].split(',').map(el => el.split(' '))

        const getData = (str, len) => {
            return [
                str.slice(0, len),
                str.slice(len)
            ]
        }

        for(let n in params) {
            let argName = params[n][params[n].length - 1],
                val

            switch (params[n][0]) {
                case 'address':
                    [val, logData] = getData(logData, 64)
                    args[argName] = val ? '0x'+val.substr(24, 40).toLowerCase() : '0x'
                    break
                case 'bytes':
                    [val, logData] = getData(logData, -1)
                    args[argName] = val
                    break
                case 'bytes32':
                    [val, logData] = getData(logData, 64)
                    args[argName] = val ? '0x'+val : '0x'
                    break
                case 'int':
                case 'int256':
                case 'uint':
                case 'uint256':
                    [val, logData] = getData(logData, 64)
                    args[argName] = parseInt(val, 16)

                    if (typeof args[argName] === 'bigint') {
                        args[argName] = args[argName].toString()
                    }

                    break
                case 'int128':
                case 'uint128':
                    [val, logData] = getData(logData, 64)
                    args[argName] = parseInt(val, 16)

                    if (typeof args[argName] === 'bigint') {
                        args[argName] = args[argName].toString()
                    }
                    break
                case 'int64':
                case 'uint64':
                    [val, logData] = getData(logData, 64)
                    args[argName] = parseInt(val, 16)

                    if (typeof args[argName] === 'bigint') {
                        args[argName] = args[argName].toString()
                    }
                    break
                case 'int32':
                case 'uint32':
                    [val, logData] = getData(logData, 64)
                    args[argName] = parseInt(val, 16)
                    break
                case 'int16':
                case 'uint16':
                    [val, logData] = getData(logData, 64)
                    args[argName] = parseInt(val, 16)
                    break
                case 'int8':
                case 'uint8':
                    [val, logData] = getData(logData, 64)
                    args[argName] = parseInt(val, 16)
                    break
                case 'bool':
                    [val, logData] = getData(logData, 64)
                    args[argName] = !!parseInt(val, 16)
                    break
                default:
                    [val, logData] = getData(logData, 64)
                    args[argName] = val ? '0x'+val : '0x'
            }
        }

        if ([
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'
        ].indexOf(log.topics_0) !== -1) {
            if (log.data === '0x') {
                args.nft_id = args.value
                args.value = 1
            }
        }

        if (log.topics_0 === '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62') {
            args.nft_id = args.id
            delete args.nft_id
        }

        ret.push({
            contract: log.address,
            name,
            params: args,
            ...(['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c', '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65'].indexOf(log.topics_0) === -1 ? {} : {
                contractInfo: app.info.tokens[blockchain][log.address]
            })
        })
    }

    return ret
}

const selectData = (collection, {filters, limit, offset, sort, _id = false}) => {
    return new Promise((resolve, reject) => {
        let model = MODELS[collection],
            pipeline = []

        if (filters) {
            let match = {}

            for(let key in filters) {
                if (filters[key]['$in'] !== undefined) {
                    match = {
                        ...match,
                        [MODELS[collection].mongoField(key)]: {
                            $in: filters[key]['$in'].map(el => {
                                return MODELS[collection].mongoValue(key, el)
                            })
                        }
                    }
                } else if (filters[key]['$ne'] !== undefined) {
                    match = {
                        ...match,
                        [MODELS[collection].mongoField(key)]: {
                            $ne: MODELS[collection].mongoValue(key, filters[key]['$ne'])
                        }
                    }
                }  else if (filters[key]['$gt'] !== undefined) {
                    match = {
                        ...match,
                        [MODELS[collection].mongoField(key)]: {
                            $gt: MODELS[collection].mongoValue(key, filters[key]['$gt'])
                        }
                    }
                } else if (filters[key]['$regex'] !== undefined) {
                    match = {
                        ...match,
                        [MODELS[collection].mongoField(key)]: {
                            $regex: filters[key]['$regex']
                        }
                    }
                } else {
                    match = {
                        ...match,
                        ...model.toDatabaseWithValues({
                            [key]: filters[key]
                        })
                    }
                }
            }

            pipeline.push({$match: match})
        }

        if (sort) {
            pipeline.push({$sort: model.toDatabase(sort)})
        }

        pipeline.push({$skip: offset ? Number(offset) : 0})
        pipeline.push({$limit: limit ? Number(limit) : 100})

        app.mongo[collection].aggregate(pipeline).toArray()
            .then(result => {
                result = result.map(el => {
                    let ret = model.format(model.fromDatabase(el))

                    if (_id) {
                        ret._id = el._id
                    }

                    return ret
                })

                resolve(result)
            })
    })
}

const queryFunction = (query, collection, initFilter = null) => {
    return new Promise((resolve, reject) => {
        let indexes = MODELS[collection].indexes

        let queryData = {
                filter: {
                    $match: {
                        $and: []
                    }
                },
                order: null,
                offset: null,
                limit: {
                    $limit: 20
                },
                group: {
                    $group: {}
                },
                aggr: {
                    $project: {
                        _id: 0
                    }
                },
                group_order: {
                    $sort: {}
                },
                group_limit: {
                    $limit: 20
                },
                group_offset: null
            },
            enabled = {
                filter: false,
                order: false,
                offset: false,
                limit: false,
                group: false,
                aggr: false,
                group_order: false,
                group_offset: false,
                group_limit: false
            },
            groupOrder = 1

        if (initFilter !== null) {
            queryData.filter['$match']['$and'].push(initFilter)
            enabled.filter = true
        }

        for (let operation in query) {
            let value, filter, filters
            switch (operation) {
                case 'filter':
                    filters = query[operation].split(',')

                    for(let n in filters) {
                        let filter = filters[n].split(':')

                        if (filter.length !== 3) {
                            return reject(`Invalid query format for 'filter'. Expecting 'field:operator:value'`)
                        }

                        if (indexes[filter[0]] === undefined) {
                            return reject(`Field '${filter[0]}' is not allowed for using in 'filter'`)
                        }

                        if ((['eq', 'gt', 'gte', 'lt', 'lte', 'ne']).indexOf(filter[1]) === -1) {
                            return reject(`Invalid operator '${filter[1]}' for 'filter'`)
                        }

                        if (typeof indexes[filter[0]] === 'string') {
                            switch (indexes[filter[0]]) {
                                case 'string':
                                    value = String(filter[2])
                                    break
                                case 'number':
                                case 'double':
                                case 'int64':
                                case 'int32':
                                    value = Number(filter[2])
                                    break
                                case 'hex':
                                    value = MODELS[collection].mongoValue(filter[0], filter[2])
                                    break
                            }

                            queryData.filter['$match']['$and'].push(MODELS[collection].toDatabase({
                                [filter[0]]: {
                                    ['$'+filter[1]]: value
                                }
                            }))
                        } else {
                            queryData.filter['$match']['$and'].push(indexes[filter[0]](filter[1], filter[2], MODELS[collection]))
                        }

                        if (!enabled.filter) {
                            enabled.filter = true
                        }
                    }
                    break
                case 'order':
                    filter = query[operation].split(':')

                    if (filter.length !== 2) {
                        return reject(`Invalid query format for 'order'. Expecting 'field:direction'`)
                    }

                    if (indexes[filter[0]] === undefined) {
                        return reject(`Field '${filter[0]}' is not allowed for using in 'order'`)
                    }

                    if ((['desc', 'asc']).indexOf(filter[1]) === -1) {
                        return reject(`Invalid ordering operator '${filter[1]}'. Expecting 'desc' or 'asc'`)
                    }

                    queryData.order = {
                        $sort: MODELS[collection].toDatabase({
                            [filter[0]]: filter[1] === 'asc' ? 1 : -1
                        })
                    }
                    enabled.order = true
                    break
                case 'offset':
                    value = parseInt(query[operation])

                    if (isNaN(value)) {
                        return reject(`Offset should have a numeric value`)
                    }

                    if (value < 0) {
                        return reject(`Offset should be a numeric positive value`)
                    }

                    queryData.offset = {
                        $skip: value
                    }
                    enabled.offset = true
                    break
                case 'limit':
                    value = parseInt(query[operation])

                    if (isNaN(value)) {
                        return reject(`Limit should have a numeric value`)
                    }

                    if (value <= 0) {
                        return reject(`Limit should be a numeric positive value`)
                    }

                    if (value > 1000000) {
                        value = 1000000
                    }

                    queryData.limit = {
                        $limit: value
                    }
                    enabled.limit = true
                    break
                case 'group':
                    value = query[operation]

                    if (indexes[value] === undefined) {
                        return reject(`Field '${value}' is not allowed for using in 'group'`)
                    }

                    queryData.group['$group'] = {
                        ...queryData.group['$group'],
                        _id: '$'+MODELS[collection].mongoField(value)
                    }
                    queryData.aggr['$project'] = {
                        ...queryData.aggr['$project'],
                        [value]: '$_id'
                    }
                    queryData.group_order = {
                        $sort: {
                            [value]: 'asc'
                        }
                    }
                    enabled.group = true
                    enabled.group_order = true
                    break
                case 'aggr':
                    filters = query[operation].split(',')

                    for(let n in filters) {
                        let filter = filters[n].split(':')

                        if (filter.length !== 2) {
                            return reject(`Invalid query format for 'aggr'. Expecting 'operator:field'`)
                        }

                        // if (indexes[filter[1]] === undefined) {
                        //     return reject(`Field '${filter[1]}' is not allowed for using in 'aggr'`)
                        // }

                        if ((['avg', 'count', 'first', 'last', 'max', 'min', 'sum']).indexOf(filter[0]) === -1) {
                            return reject(`Invalid operator '${filter[0]}' for 'aggr'`)
                        }

                        let f = filters[n]//.split(':').join('_')

                        queryData.group['$group'] = {
                            ...queryData.group['$group'],
                            [f]: {
                                ['$'+filter[0]]: filter[0] === 'count' ? {} : '$'+MODELS[collection].mongoField(filter[1])
                            }
                        }
                        queryData.aggr['$project'] = {
                            ...queryData.aggr['$project'],
                            [f]: '$'+f
                        }
                        enabled.aggr = true
                    }
                    break
                case 'group_order':
                    filter = query[operation]

                    if ((['desc', 'asc']).indexOf(filter) === -1) {
                        return reject(`Invalid group ordering operator '${filter}'. Expecting 'desc' or 'asc'`)
                    }

                    groupOrder = filter === 'desc' ? -1 : 1
                    enabled.group_order = true
                    break
                case 'group_offset':
                    value = parseInt(query[operation])

                    if (isNaN(value)) {
                        return reject(`Group offset should have a numeric value`)
                    }

                    if (value <= 0) {
                        return reject(`Group offset should be a numeric positive value`)
                    }

                    queryData.group_offset = {
                        $skip: value
                    }
                    enabled.group_offset = true
                    break
                case 'group_limit':
                    value = parseInt(query[operation])

                    if (isNaN(value)) {
                        return reject(`Group limit should have a numeric value`)
                    }

                    if (value <= 0) {
                        return reject(`Group limit should be a numeric positive value`)
                    }

                    if (value > 100) {
                        value = 100
                    }

                    queryData.group_limit = {
                        $limit: value
                    }
                    enabled.group_limit = true
                    break
            }
        }

        if (enabled.group && !enabled.aggr) {
            return reject(`'group' can be used only with 'aggr'`)
        }

        if (enabled.aggr && !enabled.group) {
            return reject(`'aggr' can be used only with 'group'`)
        }

        if (!enabled.aggr && enabled.group_offset) {
            return reject(`'group_offset' can be used only with 'group'`)
        }

        if (!enabled.aggr && enabled.group_limit) {
            return reject(`'group_limit' can be used only with 'group'`)
        }

        if (!enabled.aggr && enabled.group_order) {
            return reject(`'group_order' can be used only with 'group'`)
        }

        if (!enabled.aggr && !enabled.limit) {
            enabled.limit = true
        }

        if (!enabled.aggr) {
            enabled.group_limit = false
            enabled.group_offset = false
        } else {
            if (!enabled.group_limit) {
                enabled.group_limit = true
            }
        }

        if (enabled.group_order) {
            queryData.group_order['$sort'][query['group']] = groupOrder
        }

        let pipeline = []
        for (let key in enabled) {
            if (enabled[key]) {
                pipeline.push(queryData[key])
            }
        }

        app.mongo[collection].aggregate(pipeline).toArray().then(result => {
            if (enabled.aggr) {
                return resolve(result)
            }

            let res = []
            for (let r = 0; r < result.length; r++) {
                res.push(MODELS[collection].format((MODELS[collection].fromDatabase(result[r]))))
            }

            resolve(res)
        }).catch(reject)
    })
}

const getDexData = (tx) => {
    // @TODO remake for multichain
    tx = categorizeTransaction(tx)

    let address = tx.from,
        from = tx.logs.find(el => el.name === 'Transfer' && el.params.from === address),
        to = tx.logs.find(el => el.name === 'Transfer' && el.params.to === address)

    if (!from) {
        let deposit = tx.logs.find(el => el.name === 'Deposit')

        if (deposit) {
            from = {
                contract: '0x0',
                contractInfo: app.info.tokens[tx.blockchain]['0x0'],
                params: {
                    value: deposit.params.amount
                }
            }
        } else {
            return null
        }
    }

    if (!to) {
        let withdrawal = tx.logs.find(el => el.name === 'Withdrawal')

        if (withdrawal) {
            to = {
                contract: '0x0',
                contractInfo: app.info.tokens[tx.blockchain]['0x0'],
                params: {
                    value: withdrawal.params.wad
                }
            }
        } else {
            return null
        }
    }

    let ret = {
        dex: '1inch',
        blockNumber: tx.blockNumber,
        timeStamp: tx.timeStamp,
        tokenFrom: {
            contract: from.contract,
            contractInfo: app.info.tokens[tx.blockchain][from.contract] || {},
            value: from.params.value
        },
        tokenTo: {
            contract: to.contract,
            contractInfo: app.info.tokens[tx.blockchain][to.contract] || {},
            value: to.params.value
        }
    }

    if (ret.tokenFrom.contractInfo.decimals && ret.tokenTo.contractInfo.decimals) {
        ret.tokenFrom.value = from.params.value / Math.pow(10, ret.tokenFrom.contractInfo.decimals)
        ret.tokenTo.value = to.params.value / Math.pow(10, ret.tokenTo.contractInfo.decimals)

        ret.price = ret.tokenTo.value / ret.tokenFrom.value

        ret.priceMax = (parseInt(tx.input.slice(10).match(/.{1,64}/g)[2], 16) / Math.pow(10, ret.tokenTo.contractInfo.decimals)) / ret.tokenFrom.value

        if (ret.priceMax / ret.price > 2) {
            ret.priceMax /= Math.pow(10, ret.tokenTo.contractInfo.decimals) * Math.pow(10, ret.tokenTo.contractInfo.decimals)
        } else if (ret.priceMax / ret.price < 0.5) {
            ret.priceMax *= Math.pow(10, ret.tokenTo.contractInfo.decimals) * Math.pow(10, ret.tokenTo.contractInfo.decimals)
        }

        ret.slippageLeft = (ret.price - ret.priceMax) / ret.priceMax
    } else {
        ret.price = 0
        ret.priceMax = 0
        ret.slippageLeft = 0
    }

    return ret
}

const addExtraTxsData = (txs) => {
    return new Promise((resolve, reject) => {
        let nftList721 = [],
            nftList1155 = [],
            index = {},
            logsIndex = {},
            logsIndexTrade = {}

        txs.forEach((tx, i) => {
            if (tx.data && tx.data.nft_id) {
                nftList721.push({
                    chain: tx.blockchain,
                    nft: MODELS[tx.blockchain + '_nfts_721'].toDatabaseWithValues({
                        contract: tx.data.contract,
                        nft_id: tx.data.nft_id
                    })
                })
                nftList1155.push({
                    chain: tx.blockchain,
                    nft: MODELS[tx.blockchain + '_nfts_1155'].toDatabaseWithValues({
                        contract: tx.data.contract,
                        nft_id: tx.data.nft_id
                    })
                })

                if (index[tx.blockchain] === undefined) {
                    index[tx.blockchain] = {}
                }

                if (index[tx.blockchain][tx.data.contract] === undefined) {
                    index[tx.blockchain][tx.data.contract] = {}
                }
                index[tx.blockchain][tx.data.contract][tx.data.nft_id] = i
            }

            tx.logs.forEach((log, l) => {
                if (log.params.nft_id) {
                    if (logsIndex[tx.blockchain] === undefined) {
                        logsIndex[tx.blockchain] = {}
                    }

                    if (logsIndex[tx.blockchain][tx.data.contract] === undefined) {
                        logsIndex[tx.blockchain][tx.data.contract] = {}
                    }

                    logsIndex[tx.blockchain][tx.data.contract][tx.data.nft_id] = [i, l]

                    nftList721.push({
                        chain: tx.blockchain,
                        nft: MODELS[tx.blockchain + '_nfts_721'].toDatabaseWithValues({
                            contract: tx.data.contract,
                            nft_id: tx.data.nft_id
                        })
                    })
                    nftList1155.push({
                        chain: tx.blockchain,
                        nft: MODELS[tx.blockchain + '_nfts_1155'].toDatabaseWithValues({
                            contract: tx.data.contract,
                            nft_id: tx.data.nft_id
                        })
                    })
                }

                if (log.name === 'OpenSeaLog') {
                    log.params.offers.forEach((lg, n) => {
                        if (logsIndexTrade[tx.blockchain] === undefined) {
                            logsIndexTrade[tx.blockchain] = {}
                        }

                        if (logsIndexTrade[tx.blockchain][lg.contract] === undefined) {
                            logsIndexTrade[tx.blockchain][lg.contract] = {}
                        }

                        logsIndexTrade[tx.blockchain][lg.contract][lg.nft_id] = [i, l, 'offers', n]

                        nftList721.push({
                            chain: tx.blockchain,
                            nft: MODELS[tx.blockchain + '_nfts_721'].toDatabaseWithValues({
                                contract: lg.contract,
                                nft_id: lg.nft_id
                            })
                        })
                        nftList1155.push({
                            chain: tx.blockchain,
                            nft: MODELS[tx.blockchain + '_nfts_1155'].toDatabaseWithValues({
                                contract: lg.contract,
                                nft_id: lg.nft_id
                            })
                        })
                    })
                    log.params.considerations.forEach((lg, n) => {
                        if (logsIndexTrade[tx.blockchain] === undefined) {
                            logsIndexTrade[tx.blockchain] = {}
                        }

                        if (logsIndexTrade[tx.blockchain][lg.contract] === undefined) {
                            logsIndexTrade[tx.blockchain][lg.contract] = {}
                        }

                        logsIndexTrade[tx.blockchain][lg.contract][lg.nft_id] = [i, l, 'considerations', n]

                        nftList721.push({
                            chain: tx.blockchain,
                            nft: MODELS[tx.blockchain + '_nfts_721'].toDatabaseWithValues({
                                contract: lg.contract,
                                nft_id: lg.nft_id
                            })
                        })
                        nftList1155.push({
                            chain: tx.blockchain,
                            nft: MODELS[tx.blockchain + '_nfts_1155'].toDatabaseWithValues({
                                contract: lg.contract,
                                nft_id: lg.nft_id
                            })
                        })
                    })
                }
            })
        })

        let promises = [],
            promisesIndex = [],
            nftsSorted721 = {},
            nftsSorted1155 = {},
            sortedIndex721 = [],
            sortedIndex1155 = []

        nftList721.forEach(nft => {
            if (nftsSorted721[nft.chain] === undefined) {
                nftsSorted721[nft.chain] = []
            }
            
            let nft_id = nft.nft[MODELS[nft.chain + '_nfts_721'].mongoField('nft_id')],
                contract = nft.nft[MODELS[nft.chain + '_nfts_721'].mongoField('contract')]

            if (!nft_id || !contract || sortedIndex721.indexOf(contract+nft_id) !== -1) {
                return
            }

            sortedIndex721.push(contract+nft_id)
            
            nftsSorted721[nft.chain].push(nft.nft)
        })

        nftList1155.forEach(nft => {
            if (nftsSorted1155[nft.chain] === undefined) {
                nftsSorted1155[nft.chain] = []
            }

            let nft_id = nft.nft[MODELS[nft.chain + '_nfts_1155'].mongoField('nft_id')],
                contract = nft.nft[MODELS[nft.chain + '_nfts_1155'].mongoField('contract')]

            if (!nft_id || !contract || sortedIndex1155.indexOf(contract+nft_id) !== -1) {
                return
            }

            sortedIndex1155.push(contract+nft_id)

            nftsSorted1155[nft.chain].push(nft.nft)
        })

        for(let blockchain in nftsSorted721) {
            promises.push(
                app.mongo[blockchain+'_nfts_721'].find({
                    $or: nftsSorted721[blockchain]
                }).toArray()
            )
            promisesIndex.push({
                blockchain,
                standard: 721
            })
        }

        for(let blockchain in nftsSorted1155) {
            promises.push(
                app.mongo[blockchain+'_nfts_1155'].find({
                    $or: nftsSorted721[blockchain]
                }).toArray()
            )
            promisesIndex.push({
                blockchain,
                standard: 1155
            })
        }

        Promise.all(promises)
            .then((answers) => {
                answers.forEach((answerNfts, i) => {
                    answerNfts.forEach(nft => {
                        let standard = promisesIndex[i].standard,
                            blockchain = promisesIndex[i].blockchain,
                            localIndex = index[blockchain],
                            localLogsIndex = logsIndex[blockchain],
                            localLogsIndexTrade = logsIndexTrade[blockchain]

                        nft = MODELS[blockchain+'_nfts_'+standard].fromDatabase(nft)

                        if (localIndex && localIndex[nft.contract] && index[nft.contract] && localIndex[nft.contract][nft.nft_id] !== undefined) {
                            txs[localIndex[nft.contract][nft.nft_id]].data.nftContractInfo = nft
                        }

                        if (localLogsIndex && localLogsIndex[nft.contract] && localLogsIndex[nft.contract][nft.nft_id] !== undefined) {
                            let i = localLogsIndex[nft.contract][nft.nft_id]
                            txs[i[0]].logs[i[1]].nftContractInfo = nft
                        }

                        if (localLogsIndexTrade && localLogsIndexTrade[nft.contract] && localLogsIndexTrade[nft.contract][nft.nft_id] !== undefined) {
                            let i = localLogsIndexTrade[nft.contract][nft.nft_id]
                            txs[i[0]].logs[i[1]].params[i[2]][i[3]].nftContractInfo = nft
                        }
                    })

                })

                resolve(txs)
            })
    })
}

const isReadable = (str) => {
    const humanReadableRanges = [
        [32, 126], [160, 1871], [1920, 1983], [2304, 4991], [5024, 5900], [6016, 6383], [6400, 8303], [8352, 12287]
    ]

    return str.split('').filter(char => {
        let charCode = char.charCodeAt(0)

        return humanReadableRanges.filter(el => charCode >= el[0] && charCode <= el[1]).length > 0
    }).length === str.length
}

const multichainCall = (blockchains, func) => {
    return new Promise(resolve => {
        let promises = []
        blockchains.forEach(blockchain => {
            promises.push(func(blockchain))
        })

        if (promises.length) {
            Promise.all(promises)
                .then(answers => {
                    let ret = []

                    answers.forEach(answer => {
                        ret = ret.concat(answer)
                    })

                    resolve(ret)
                })
        } else {
            resolve([])
        }
    })
}

const objectToUrlEncodedFormData = (obj) => {
    if (typeof obj !== 'object' || !Object.keys(obj).length) {
        return
    }
    let data = Object.keys(obj)
        .map((key) => `${key}=${encodeURIComponent(obj[key])}`)
        .join('&')
    return data
}

const timeToStringLocal = (time, localtime) => {
    const offsetString = decodeURIComponent(localtime) 
    const offset = parseInt(offsetString, 10)
    const date = new Date(time)
    date.setUTCHours(date.getUTCHours() + offset)

    const pad = (num) => (num < 10 ? `0${num}` : num)
    const formattedDate =
      pad(date.getUTCDate()) +
      '.' +
      pad(date.getUTCMonth() + 1) +
      '.' +
      date.getUTCFullYear() +
      ' ' +
      pad(date.getUTCHours()) +
      ':' +
      pad(date.getUTCMinutes()) +
      ':' +
      pad(date.getUTCSeconds());

    return formattedDate
}

module.exports = {
    categorizeTransaction,
    parseInputData,
    parseLogs,
    selectData,
    queryFunction,
    getDexData,
    addExtraTxsData,
    isReadable,
    multichainCall,
    objectToUrlEncodedFormData,
    timeToStringLocal
}