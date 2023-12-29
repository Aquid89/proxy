const {timeToStringLocal} = require('./helpers')
const express = require('express')
const router = express.Router()
const request = require('request')
const jsdom = require('jsdom')
const {JSDOM} = jsdom
const cors = require('cors')


const PdfPrinter = require('pdfmake')
const fs = require('fs')

const BigNumber = require('bignumber.js')

const QRCode = require('qrcode')
const path = require('path')

const logoImg = path.join(__dirname, 'static', 'images', 'logo.png')
const arrowImg = path.join(__dirname, 'static', 'images', 'arrow.png')
const bgImg = path.join(__dirname, 'static', 'images', 'bgimage.png')

//console.log('Полный путь:', Buffer.from(fs.readFileSync(nestedPath)).toString('base64'));

router.get('/generate', cors(), (req, res) => {
    const requestOptions = {
        //send-ether
        //url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0xcbbb58de3e7a85dea8e04525228da198618e36677c53e3172bb22e613008039d?blockchain=ethereum',
        //call
        url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0x2cc0421ad8657aa9d39aa288bafdccd4c30d902d636d57612ab699018b3e9591?blockchain=ethereum',
        //message
        // url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0xe2e0b305cddef4cfa401b5ad900a2cd0201f20bd240cdcd8ac0c41180be0d440?blockchain=ethereum',
        // message invoice object
        // url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0x979be4afc6e687206a69b6668fa381e776275ba9812ed9ca49ae4601267d9996?blockchain=ethereum',
        //send-erc20-token
        // url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0x4fbaea5b47c46452effbaf265162817ee7e6317c27f7f192350a18c6bf1988d5?blockchain=ethereum',
        //swap
        // url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0xfcf4f5efc92f782af80f3a29698c77dc620a989fccf2e29179612217bef45a97?blockchain=ethereum',
        //approval
        //url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0xf6cd1d55be3daf1b67480666a3012f2fbf1c18d03bd722b2513082adf8880d53=ethereum',
        //redeem
        //url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0xceee9671816375bd4c887c3010299f6eae2202606a9ff3917570372e26ffe8e9=ethereum',
        //lend
        //url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0x138e18cbce0b8b46c6fcbbf06987bcd01ea865b3c1ba0661141656c902df4846=ethereum',
        //send-nft
        //url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0x6e15500dee8ec125ff971afbf05bea535d069afe2fcaa1c24ab4e723991e3dbb=ethereum',
    }
    request(requestOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            let tx = JSON.parse(body).data

            const timezone = '+5'

            const fonts = {
                Roboto: {
                    normal: 'fonts/Roboto-Regular.ttf',
                    italics: 'fonts/Roboto-Mono.ttf',
                },
                Poppins: {
                    normal: 'fonts/Poppins-Regular.ttf',
                    bold: 'fonts/Poppins-Medium.ttf',
                }
            }

            const typeHeadings = {
                'approval': 'Token Approval transaction',
                'call': 'Call transaction',
                'send-ether': 'ETH transaction',
                'send-erc20-token': 'ERC20 transaction',
                'deploy-contract': 'Contract Deploy transaction',
                'message': 'Message transaction',
                'swap': 'Swap Transaction',
                'nft-trade': 'NFT Trade transaction',
                'send-nft': 'NFT transaction',
                'nft-mint': 'NFT Mint',
                'lend': 'Lend transaction',
                'redeem': 'Redeem transaction'
            }

            QRCode.toDataURL(`https://etherscan.io/tx/${tx.hash}`, {
                errorCorrectionLevel: 'L',
                width: 84
            }, (err, qrCodeURL) => {
                if (err) {
                    console.error('Error generating QR code:', err)
                }

                const printer = new PdfPrinter(fonts)

                const docDefinition = {
                    pageSize: 'A4',
                    pageMargins: [50, 26, 26, 26],
                    styles: {
                        hyperlink: {
                            decoration: 'underline',
                            marginTop: 4,
                            color: '#9483FF',
                            alignment: 'center',
                        },
                        qrcode: {
                            marginTop: -10,
                            alignment: 'right',
                            borderRadius: 5,
                        },
                        tableStyle: {
                            alignment: 'center',
                        }
                    },
                    content: [
                        {
                            margin: [0, 0, 0, 20],
                            table: {
                                widths: ['*', '*'],
                                body: [
                                    [{
                                        image: logoImg,
                                        width: 75,
                                        height: 23,
                                    }, {
                                        image: qrCodeURL,
                                        style: 'qrcode'
                                    }]
                                ]
                            },

                            layout: 'noBorders'
                        },
                        {
                            text: makeUpperCase('Transaction receipt'),
                            fontSize: 12,
                            marginTop: -40,
                            font: 'Poppins',
                            bold: true
                        },
                        {
                            text: makeUpperCase(typeHeadings[tx.type]),
                            fontSize: 20,
                            color: '#9483FF',
                            marginTop: 8,
                            font: 'Poppins',
                            bold: true
                        },
                        {
                            text: timeToStringLocal(tx.timeStamp * 1000, timezone) + ' (GMT' + timezone + ')',
                            fontSize: 10,
                            marginTop: 8,
                            font: 'Poppins'
                        },
                        {
                            image: bgImg,
                            width: 600,
                            height: 50,
                            marginLeft: -50,
                            marginRight: -25,
                            marginTop: 20
                        },
                        {
                            text: [
                                {
                                    text: makeUpperCase('Transaction Hash\n'),
                                    color: '#442A8E',
                                    fontSize: 10,
                                    lineHeight: 1.4,
                                    font: 'Poppins',
                                    bold: true
                                },
                                {
                                    text: tx.hash,
                                    fontSize: 10,
                                    italics: true
                                },
                            ],
                            marginTop: -42,
                            marginBottom: 20
                        },
                        headerBlock('Transaction data'),
                        {
                            table: {
                                widths: [50, '*'],
                                body: [
                                    [{
                                        text: 'From',
                                        alignment: 'left',
                                        font: 'Poppins'
                                    }, {
                                        text: tx.from,
                                        alignment: 'right',
                                        marginBottom: 4,
                                        italics: true
                                    }],
                                    [{
                                        text: 'To',
                                        font: 'Poppins'
                                    }, {
                                        text: tx.to,
                                        alignment: 'right',
                                        marginBottom: 4,
                                        italics: true
                                    }],
                                    [{
                                        text: 'Block',
                                        font: 'Poppins'
                                    }, {
                                        text: tx.blockNumber,
                                        alignment: 'right',
                                        marginBottom: 4,
                                        italics: true
                                    }],
                                    [{
                                        text: 'Hash',
                                        font: 'Poppins'
                                    }, {
                                        text: tx.hash,
                                        alignment: 'right',
                                        marginBottom: 4,
                                        italics: true
                                    }],
                                    [{
                                        text: 'Nonce',
                                        font: 'Poppins'
                                    }, {
                                        text: tx.nonce,
                                        alignment: 'right',
                                        marginBottom: 4,
                                        italics: true
                                    }],
                                    [{
                                        text: 'Value',
                                        font: 'Poppins'
                                    }, {
                                        text: tx.value + ' ETH',
                                        alignment: 'right',
                                        marginBottom: 4,
                                        italics: true
                                    }],
                                    [{
                                        text: 'Gas Used',
                                        font: 'Poppins'
                                    }, {
                                        text: tx.gas,
                                        alignment: 'right',
                                        marginBottom: 4,
                                        italics: true
                                    }],
                                    [{
                                        text: 'Gas Price',
                                        font: 'Poppins'
                                    }, {
                                        text: ethToGwei(tx.gasPrice),
                                        alignment: 'right',
                                        marginBottom: 4,
                                        italics: true
                                    }],
                                    [{
                                        text: 'Fee',
                                        font: 'Poppins'
                                    }, {
                                        text: calculateTransactionFee(tx.gasPrice, tx.gas),
                                        alignment: 'right',
                                        marginBottom: 4,
                                        italics: true
                                    }],

                                ]
                            },
                            layout: 'noBorders',
                            fontSize: 10
                        },
                        headerBlock('Input'),
                        {
                            text: shortenHash(tx.input, 255),
                            fontSize: 10,
                            italics: true
                        }
                    ]

                }

                switch (tx.type) {
                    case 'send-ether':
                        docDefinition.content.splice(6, 0, headerBlock('Coin Transfer', 11), {
                            table: {
                                widths: ['*'],

                                body: [
                                    [{
                                        text: tx.from,
                                        italics: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: String(tx.data.value) + 'ETH',
                                        font: 'Poppins',
                                        bold: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: tx.to,
                                        italics: true
                                    }],
                                ]
                            },
                            style: 'tableStyle',
                            layout: 'noBorders'
                        })
                        break
                    case 'send-erc20-token':
                        docDefinition.content.splice(6, 0, headerBlock('Token Transfer', 11), {
                            table: {
                                widths: ['*'],

                                body: [
                                    [{
                                        text: tx.from,
                                        italics: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: value() + ' ' + tx.data.contractInfo.symbol,
                                        font: 'Poppins',
                                        bold: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: tx.data.to,
                                        italics: true
                                    }],
                                ]
                            },
                            style: 'tableStyle',
                            layout: 'noBorders'
                        })

                        break
                    case 'call':
                        let callData = generateTransaction()
                        callData.push(headerBlock('Smart Contract Method'),
                            {
                                table: {
                                    widths: [50, '*'],
                                    body: [
                                        [{
                                            text: 'Smart Contract',
                                            alignment: 'left',
                                            font: 'Poppins'
                                        }, {
                                            text: tx.from,
                                            alignment: 'right',
                                            marginBottom: 4,
                                            italics: true
                                        }],
                                        [{
                                            text: 'Method',
                                            font: 'Poppins'
                                        }, {
                                            text: tx.data.method,
                                            alignment: 'right',
                                            marginBottom: 4,
                                            italics: true
                                        }],
                                    ]
                                },
                                layout: 'noBorders',
                                fontSize: 10
                            })
                        docDefinition.content.splice(-4, 0, callData)

                        break
                    case 'deploy-contract':
                        break
                    case 'message':
                        let tableBodyMessage = []

                        if (parseStringToObject(tx.data.message)) {
                            tableBodyMessage.push([{
                                    text: 'Amount',
                                    font: 'Poppins'
                                }, {
                                    text: parseStringToObject(tx.data.message).moneyRequest.amount + ' ' + parseStringToObject(tx.data.message).moneyRequest.token,
                                    alignment: 'right',
                                    italics: true
                                }],
                                [{
                                    text: 'Comment',
                                    font: 'Poppins'
                                }, {
                                    text: parseStringToObject(tx.data.message).moneyRequest.text,
                                    alignment: 'right',
                                    italics: true
                                }])
                        } else {
                            tableBodyMessage.push([{
                                text: tx.data.message,
                                alignment: 'left',
                                font: 'Poppins'
                            }])
                        }

                        docDefinition.content.splice(6, 0, headerBlock(parseStringToObject(tx.data.message) ? 'Invoice' : 'Message'), {

                            table: {
                                widths: [!parseStringToObject(tx.data.message) ? '*' : 55, '*'],
                                body: tableBodyMessage
                            },
                            layout: 'noBorders',
                            fontSize: 10
                        })


                        break
                    case 'swap':
                        let swapData = generateTransaction()
                        swapData.push(headerBlock('Swap Info'),
                            {
                                table: {
                                    widths: [55, '*'],
                                    body: [
                                        [{
                                            text: 'Blockchain',
                                            alignment: 'left',
                                            font: 'Poppins'
                                        }, {
                                            text: capitalizeFirstLetter(tx.blockchain),
                                            alignment: 'right',
                                            marginBottom: 4
                                        }],
                                        [{
                                            text: 'Exchange',
                                            font: 'Poppins'
                                        }, {
                                            text: tx.data.dex,
                                            alignment: 'right',
                                            marginBottom: 4
                                        }],
                                    ]
                                },
                                layout: 'noBorders',
                                fontSize: 10
                            })
                        docDefinition.content.splice(-4, 0, swapData)
                        break
                    case 'approval':
                        docDefinition.content.splice(-4, 0, headerBlock('Token Approval Info'),
                            {
                                table: {
                                    widths: [80, '*'],
                                    body: [
                                        [{
                                            text: 'Token',
                                            alignment: 'left',
                                            font: 'Poppins'
                                        }, {
                                            text: tx.data?.contractInfo?.name,
                                            alignment: 'right',
                                            marginBottom: 4
                                        }],
                                        [{
                                            text: 'New Allowance',
                                            font: 'Poppins'
                                        }, {
                                            text: isHexadecimal(value()) ? value() + symbol() : 'Unlimited ' + symbol(),
                                            alignment: 'right',
                                            marginBottom: 4
                                        }],
                                    ]
                                },
                                layout: 'noBorders',
                                fontSize: 10
                            })
                        break
                    case 'nft-trade':
                        break
                    case 'send-nft':
                        const logs = tx.logs.filter(l => l.name === 'Transfer' && Object.keys(l.params).includes('nft_id'))
                        docDefinition.content.splice(-4, 0, headerBlock('NFT Transfer', 11), {
                            table: {
                                widths: ['*'],

                                body: [
                                    [{
                                        text: logs[0]['params']['from'],
                                        italics: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    ['Key?'],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: logs[0]['contract'],
                                        italics: true
                                    }],
                                ]
                            },
                            style: 'tableStyle',
                            layout: 'noBorders'
                        })

                        break
                    case 'nft-mint':
                        break
                    case 'lend':
                        let lendData = generateTransaction()
                        docDefinition.content.splice(-4, 0, lendData)
                        docDefinition.content.splice(-4, 0, headerBlock('Lend Info'),
                            {
                                table: {
                                    widths: [70, '*'],
                                    body: [
                                        [{
                                            text: 'Amount',
                                            alignment: 'left',
                                            font: 'Poppins'
                                        }, {
                                            text: tx.data.value + ' ' + tx.data.contractInfo.symbol,
                                            alignment: 'right',
                                            marginBottom: 4
                                        }],
                                        [{
                                            text: 'Blockchain',
                                            font: 'Poppins'
                                        }, {
                                            text: capitalizeFirstLetter(tx.blockchain),
                                            alignment: 'right',
                                            marginBottom: 4
                                        }],
                                        [{
                                            text: 'Protocol',
                                            font: 'Poppins'
                                        }, {
                                            text: capitalizeFirstLetter(tx.data.protocol),
                                            alignment: 'right',
                                            marginBottom: 4
                                        }],
                                    ]
                                },
                                layout: 'noBorders',
                                fontSize: 10
                            })
                        break
                    case 'redeem':
                        let redeemData = generateTransaction()
                        redeemData.push(headerBlock('Redeem Info'),
                            {
                                table: {
                                    widths: [70, '*'],
                                    body: [
                                        [{
                                            text: 'Amount',
                                            alignment: 'left',
                                            font: 'Poppins'
                                        }, {
                                            text: tx.data.value + ' ' + tx.data.contractInfo.symbol,
                                            alignment: 'right',
                                            marginBottom: 4
                                        }],
                                        [{
                                            text: 'Blockchain',
                                            font: 'Poppins'
                                        }, {
                                            text: capitalizeFirstLetter(tx.blockchain),
                                            alignment: 'right',
                                            marginBottom: 4
                                        }],
                                        [{
                                            text: 'Protocol',
                                            font: 'Poppins'
                                        }, {
                                            text: capitalizeFirstLetter(tx.data.protocol),
                                            alignment: 'right',
                                            marginBottom: 4
                                        }],
                                    ]
                                },
                                layout: 'noBorders',
                                fontSize: 10
                            })
                        docDefinition.content.splice(-4, 0, redeemData)
                        
                        break
                }

                const pdfDoc = printer.createPdfKitDocument(docDefinition)
                const fileStream = pdfDoc.pipe(fs.createWriteStream('./pdf/document.pdf'))

                pdfDoc.pipe(fs.createWriteStream('document.pdf'))
                pdfDoc.pipe(res)

                pdfDoc.end()
            })

            function calcLogEntryValue(logEntry) {
                let field
                switch (logEntry.name) {
                    case 'Transfer':
                        field = 'value'
                        break
                    case 'Deposit':
                        field = 'amount'
                        break
                    case 'Withdrawal':
                        field = 'wad'
                        break
                }
                return new BigNumber(logEntry.params[field]).dividedBy(Math.pow(10, logEntry.contractInfo.decimals || 0)).dp(6).toString()
            }

            function makeUpperCase(text) {
                return text.toUpperCase()
            }

            function headerBlock(text, size = 10) {
                return [{
                    text: makeUpperCase(text),
                    fontSize: size,
                    margin: [0, 20, 0, 6],
                    color: '#442A8E',
                    font: 'Poppins',
                    bold: true
                }, {
                    image: bgImg,
                    width: 518,
                    height: 0.5,
                    marginBottom: 5
                }]
            }

            function parseStringToObject(str) {
                try {
                    const obj = JSON.parse(str)
                    return obj
                } catch (error) {
                    return false
                }
            }

            function capitalizeFirstLetter(str) {
                return str.charAt(0).toUpperCase() + str.slice(1)
            }

            function value() {
                if (tx.data.contractInfo && tx.data.contractInfo.decimals) {
                    return new BigNumber(tx.data.value).dividedBy(Math.pow(10, tx.data.contractInfo.decimals)).dp(6).toString()
                } else {
                    return new BigNumber(String(tx.data.value)).dp(6)
                }
            }

            function symbol() {
                return tx.data.contractInfo && tx.data.contractInfo.symbol
                    ? tx.data.contractInfo.symbol
                    : ''
            }

            function shortenHash(string, maxLength = 7) {
                if (!string) {
                    return
                }
                string = string.toLowerCase()
                if (string.length <= maxLength) {
                    return string
                }
                return string.slice(0, maxLength) + '...'
            }

            function ethToGwei(value) {
                const formattedValue = (value / 1e9).toFixed(3)

                return formattedValue + ' Gwei'
            }

            function calculateTransactionFee(gasPrice, gasUsed) {
                const fee = gasPrice * gasUsed
                const weiPerEth = 1e18

                const ethValue = fee / weiPerEth
                return ethValue.toFixed(6) + ' ETH'
            }

            function isHexadecimal(str) {
                const hexRegex = /^[0-9A-Fa-f]+$/g
                return hexRegex.test(str)
            }

            function generateTransaction() {
                let callArr = []
                if (tx.logs.some(log => log.contractInfo)) {
                    const transfersList = tx.logs.filter(obj => obj.contractInfo)
                    if (transfersList.length) {
                        transfersList.forEach(transfer => {
                            // Title transfer
                            const titleText = transfer.contractInfo.name ? transfer.contractInfo.name : transfer.contractInfo.address

                            let tableBody = []
                            if (transfer.name === 'Transfer') {
                                tableBody = [
                                    [{
                                        text: transfer.contractInfo.address,
                                        italics: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: calcLogEntryValue(transfer) + ' ' + transfer.contractInfo.symbol,
                                        font: 'Poppins',
                                        bold: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: transfer.params.to,
                                        italics: true
                                    }],
                                ]
                            } else if (transfer.name === 'Deposit') {
                                tableBody = [
                                    [{
                                        text: transfer.contractInfo.address,
                                        italics: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: calcLogEntryValue(transfer) + ' ' + transfer.contractInfo.symbol,
                                        font: 'Poppins',
                                        bold: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: transfer.params.user,
                                        italics: true
                                    }],
                                ]
                            } else if (transfer.name === 'Withdrawal') {
                                tableBody = [
                                    [{
                                        text: transfer.contractInfo.address,
                                        italics: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: calcLogEntryValue(transfer) + ' ' + transfer.contractInfo.symbol,
                                        font: 'Poppins',
                                        bold: true
                                    }],
                                    [{
                                        image: arrowImg,
                                        width: 5,
                                        height: 10,
                                    }],
                                    [{
                                        text: transfer.params.src,
                                        italics: true
                                    }],
                                ]
                            }

                            if (tableBody.length > 0) {
                                callArr.push(headerBlock('Token transfer', 12),
                                    {
                                        table: {
                                            widths: ['*'],
                                            body: tableBody,
                                            alignment: 'center'
                                        },
                                        style: 'tableStyle',
                                        layout: 'noBorders'
                                    })

                            }
                        })

                        if (transfersList.some(l => l.name === 'Withdrawal')) {
                            callArr.push(headerBlock('Token Transfer', 11), {
                                table: {
                                    widths: ['*'],

                                    body: [
                                        [{
                                            text: tx.from,
                                            italics: true
                                        }],
                                        [{
                                            image: arrowImg,
                                            width: 5,
                                            height: 10,
                                        }],
                                        [{
                                            text: calcLogEntryValue(transfersList.filter(l => l.name === 'Withdrawal')[0]) + 'ETH',
                                            font: 'Poppins',
                                            bold: true
                                        }],
                                        [{
                                            image: arrowImg,
                                            width: 5,
                                            height: 10,
                                        }],
                                        [{
                                            text: transfersList.filter(l => l.name === 'Withdrawal')[0].params.src,
                                            italics: true
                                        }],
                                    ]
                                },
                                style: 'tableStyle',
                                layout: 'noBorders'
                            })
                        }

                        return callArr
                    }
                }
            }

            // res.send();
        } else {
            console.log('err', error)
            res.send(error)
        }
    })
})

module.exports = router
