const { selectData, parseLogs, categorizeTransaction, addExtraTxsData } = require('../../common/helpers')
const PdfPrinter = require('pdfmake');
const fs = require('fs');
const BigNumber = require('bignumber.js');
//const path = require('path');

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

                function timeToStringLocal(time) {
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
                    { text: 'Transaction Data', fontSize: 15, alignment: 'center', bold: true, margin: [0, 30, 20, 20] },
                    {
                      table: {
                        widths: ['*', 'auto'],
                        body: [
                          ['From', tx.from],
                          ['To', tx.to],
                          ['Block', tx.blockNumber],
                          ['Hash', tx.hash],
                          ['Nonce', tx.nonce],
                          ['Value', tx.value],
                          ['Gas Used', tx.gasUsed],
                          ['Gas Price', tx.gasPrice],
                          ['Fee', '0.000018??'],
                          ['Input', tx?.input],
                        ]
                      }
                    }
                  ]
                }

                docDefinition.content.splice(1, 0, { text: typeHeadings[tx.type], fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 20] })
                
                switch (tx.type) {
                  case 'send-ether':
                    docDefinition.content.splice(2, 0, {
                      table: {
                        widths: ['*', 'auto'],
                        body: [
                          ['Direction', 'Send ?'],
                          ['Value', String(tx.data.value)],
                          ['Recipient', tx.to],
                        ]
                      }
                    })
                    break;
                  case 'send-erc20-token':
                    docDefinition.content.splice(2, 0, {
                      table: {
                        widths: ['*', 'auto'],
                        body: [
                          ['Direction', 'Send ?'],
                          ['Contract', tx.data.contract],
                          ['Value', tx.data.contractInfo && tx.data.contractInfo.decimals
                            ? new BigNumber(tx.data.value).dividedBy(Math.pow(10, tx.data.contractInfo.decimals)).dp(6).toString()
                            : new BigNumber(tx.data.value).dp(6).toString()],
                          ['Sender', tx.from]
                          ['Recipient', 'addressCurrent??']
                        ]
                      }
                    })
                    break;
                  case 'call':
                    if (tx.logs.some(log => log.contractInfo)) {
                      docDefinition.content.splice(2, 0, {
                        table: {
                          widths: [100, '*'],
                          body: [
                            ['Contract Address:', tx.to],
                          ]
                        }
                      })
          
                      docDefinition.content.push({ text: 'Transfers', fontSize: 15, alignment: 'center', bold: true, margin: [0, 30, 20, 20] })
                      const transfersList = tx.logs.filter(obj => obj.contractInfo)
                      if (transfersList.length) {
                        transfersList.forEach(transfer => {
                          // Title transfer
                          const titleText = transfer.contractInfo.name ? transfer.contractInfo.name : transfer.contractInfo.address;
                          docDefinition.content.push({ text: titleText, fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 5] });
                        
                          // Body transfer
                          let tableBody = [];
                          if (transfer.name === 'Transfer') {
                            tableBody = [
                              ['Direction', 'addressCurrent??'],
                              ['Contract', transfer.contractInfo.address],
                              ['Value', calcLogEntryValue(transfer) + ' ' + transfer.contractInfo.symbol],
                              ['Recipient', transfer.params.to],
                            ];
                          } else if (transfer.name === 'Deposit') {
                            tableBody = [
                              ['Direction', 'Received'],
                              ['Contract', transfer.contractInfo.address],
                              ['Value', calcLogEntryValue(transfer) + ' ' + transfer.contractInfo.symbol],
                              ['Sender', transfer.params.user],
                            ];
                          } else if (transfer.name === 'Withdrawal') {
                            tableBody = [
                              ['Direction', 'Sent'],
                              ['Contract', transfer.contractInfo.address],
                              ['Value', calcLogEntryValue(transfer) + ' ' + transfer.contractInfo.symbol],
                              ['Recipient', transfer.params.src],
                            ];
                          } 
                        
                          if (tableBody.length > 0) {
                            docDefinition.content.push({
                              table: {
                                widths: [70, '*'],
                                body: tableBody,
                              },
                            });
                          }
                        
                          docDefinition.content.push(' ');
                        });
                      }
                    }
                    break;
                  case 'deploy-contract':
                    break;
                  case 'message':
                    break;
                  case 'swap':
                    break;
                  case 'approval':
                    break;
                  case 'nft-trade':
                    break;
                  case 'send-nft':
                    const logs = tx.logs.filter(l => l.name === 'Transfer' && Object.keys(l.params).includes('nft_id'))
                    docDefinition.content.splice(2, 0, {
                      table: {
                        widths: ['*', 'auto'],
                        body: [
                          ['Direction', 'Send ?'],
                          ['Contract', logs[0]['contract']],
                          ['Sender', logs[0]['params']['from']]
                        ]
                      }
                    })
                    break;
                  case 'nft-mint':
                    break;
                  case 'lend':
                    break;
                  case 'redeem':
                    break;
                }

                if (tx.logs.length) {
                  docDefinition.content.push({ text: 'Full Logs', fontSize: 15, alignment: 'center', bold: true, margin: [0, 30, 20, 20] })
                 
                  const logsFiltered = tx.logs.filter(l => l.name !== 'OpenSeaLog')
                 
                  logsFiltered.forEach(log => {
                    const arrBodyTable = []
                 
                    Object.entries(log.params).forEach(([key, value]) => {
                      arrBodyTable.push([capitalize (key), value])
                    });
                 
                    docDefinition.content.push({
                      table: {
                        widths: [70, '*'],
                        body: arrBodyTable
                      },
                    });  
                 
                    docDefinition.content.push(' ')
                  });
                }

                function capitalize (string) {
                  return string.slice(0, 1).toUpperCase() + string.slice(1)
                }
                
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
                // if (tx.logs.length) {
                //   docDefinition.content.push({ text: 'Full Logs', fontSize: 15, alignment: 'center', bold: true, margin: [0, 30, 20, 20] })
                //   for (var i = 0; i < tx.logs.length; i++) {
                //     docDefinition.content.push({
                //       table: {
                //         widths: [70, '*'],
                //         body: [
                //           ['Name', tx.logs[i].name],
                //           ['Contract', tx.logs[i].contract],
                //           ['Owner', tx.logs[i].params.owner ? tx.logs[i].params.owner : null],
                //           ['Spender', tx.logs[i].params.spender ? tx.logs[i].params.spender : null],
                //           ['Value', tx.logs[i].params.value ? tx.logs[i].params.value : null],
                //           ['Nft id', tx.logs[i].params.nft_id ? tx.logs[i].params.nft_id : null],
                //         ]
                //       }
                //     })
                //     docDefinition.content.push(' ')
                //   }
                // }

                const pdfDoc = printer.createPdfKitDocument(docDefinition)
                pdfDoc.pipe(fs.createWriteStream(`./pdf/${tx.type}.pdf`))
                pdfDoc.end()
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
  }
})