const { selectData, parseLogs, categorizeTransaction, addExtraTxsData } = require('../../common/helpers')
const PdfPrinter = require('pdfmake');
const fs = require('fs');
const path = require('path');
// @TODO remove backward compatibility
const getTransaction = ({ tx }, { blockchain = 'ethereum' }) => {
    return new Promise((resolve, reject) => {
        if (Object.keys(app.config.blockchains).indexOf(blockchain) === -1) {
            return reject({
                error: 'Invalid blockchain',
                code: 1021
            })
        }

        selectData(blockchain + '_transactions', {
            filters: {
                hash: tx
            },
            limit: 1
        })
            .then(txs => {
                if (!txs.length) {
                    return reject({
                        error: 'Transaction not found',
                        code: 1026
                    })
                }

                let transaction = txs[0]

                selectData(blockchain + '_logs', {
                    filters: {
                        tx_hash: tx
                    },
                    limit: 100
                })
                    .then(logs => {
                        transaction.logs = parseLogs(logs, blockchain)

                        addExtraTxsData([categorizeTransaction({
                            blockchain,
                            ...transaction
                        })])
                            .then(([tx]) => {
                                const fonts = {
                                    Roboto: {
                                        normal: 'fonts/Roboto-Regular.ttf',
                                        bold: 'fonts/Roboto-Bold.ttf',
                                      // italics: 'fonts/Roboto-Italic.ttf',
                                      // bolditalics: 'fonts/Roboto-MediumItalic.ttf'
                                    }
                                  };
                                  const typeHeadings = {
                                    'approval': 'Token Approval Tx',
                                    'call': 'Call Transaction',
                                    'send-ether': 'ETH Transaction',
                                    'send-erc20-token': 'ERC20 Transaction',
                                     'deploy-contract': 'Contract Deploy Tx',
                                    // 'message': this.tx && this.tx.data && isJsonString(this.tx.data) && this.tx.to.toLowerCase() === this.addressCurrent
                                    //     ? 'Invoice Tx'
                                    //     : 'Message Tx',
                                     'swap': 'Swap Transaction',
                                     'nft-trade': 'NFT Trade Tx',
                                     'send-nft': 'NFT Transaction',
                                     'nft-mint': 'NFT Mint',
                                     'lend': 'Lend Tx',
                                     'redeem': 'Redeem Tx'
                                }
                                function timeToStringLocal (time) {
                                  let stamp = time,
                                      date = new Date(stamp)
                              
                                  return ('00' + date.getDate()).slice(-2) + '.' +
                                      ('00' + (date.getMonth() + 1)).slice(-2) + '.' +
                                      date.getFullYear() + ' ' +
                                      ('00' + date.getHours()).slice(-2) + ':' +
                                      ('00' + date.getMinutes()).slice(-2) + ':' +
                                      ('00' + date.getSeconds()).slice(-2)
                               }

                                function status(status) {
                                  if (status === undefined) {
                                      return 'Pending'
                                  } else {
                                      if (status === 0) {
                                          return 'Failed'
                                      } else if (status === 1) {
                                          return 'Confirmed'
                                      } else {
                                          return 'Unknown'
                                      }
                                  }
                              }
                                  const printer = new PdfPrinter(fonts);
                                  const docDefinition = {
                                    content: [
                                      {
                                        margin: [0, 0, 0, 20],
                                        table: {
                                          widths: ['*', '*'],
                                
                                          body: [
                                            [timeToStringLocal(tx.timeStamp * 1000), status(tx.status)],
                                          ]
                                        }
                                      },
                                      { text: typeHeadings[tx.type], fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 20] },
                                      {
                                        table: {
                                          widths: ['*', 'auto'],
                                
                                          body: [
                                            ['Direction', 'Send'],
                                            ['Value', '0.00001 ETH'],
                                            ['Recipient', '0x885035208dce7356faba7a6fa12fa4aee9fddd3e'],
                                          ]
                                        }
                                      },
                                      { text: 'Transaction Data', fontSize: 15, alignment: 'center', bold: true, margin: [0, 50, 20, 20] },
                                      {
                                        table: {
                                          widths: ['*', 'auto'],
                                
                                          body: [
                                         //   ['From', tx.data.from], 
                                            ['To', tx?.to],
                                            ['Block', tx?.blockNumber],
                                            ['Hash', tx?.hash],
                                            ['Nonce', tx?.nonce],
                                            ['Value', tx?.value],
                                            ['Gas Used', tx?.gasUsed],
                                            ['Gas Price', tx?.gasPrice],
                                            ['Fee', '0.000018??'],
                                            ['Input',tx?.input],
                                          ]
                                        }
                                      }
                                    ]
                                  };
                                  
                                  const pdfDoc = printer.createPdfKitDocument(docDefinition);
                                 pdfDoc.pipe(fs.createWriteStream('document.pdf'));
                                
                                    // fileStream.on('finish', () => {
                                  //   res.download('document.pdf', () => {
                                  //     const filePath = path.resolve('document.pdf');
                                  //     fs.unlink(filePath, (err) => {
                                  //       if (err) {
                                  //         console.error(err);
                                  //       }
                                  //     });
                                  //   });
                                
                                  // });
                                  pdfDoc.end();
                                  resolve(tx)

                            })
                    })
            })
    })
}
app.server.initRoutes({
    '/widgets/explorer/transaction-pdf/:tx': {
        'get': {
            func(data, auth, query, params) {
                return getTransaction(params, query)
            }
        }
    },
})