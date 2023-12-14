const express = require('express')
const router = express.Router()
var request = require('request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const cors = require('cors')

const PdfPrinter = require('pdfmake');
const fs = require('fs');

const BigNumber = require('bignumber.js');

const path = require('path');
router.get('/generate', cors(), (req, res) => {
  var customHeaders = {
  };
  var requestOptions = {
    url: 'https://api-dev-full.sinum.io/widgets/explorer/transaction/0x532cf15c85bb247b8944af27e5f60e006012d6ead898f3385d16373077f880f2=ethereum', 
    headers: customHeaders,
  };
  request(requestOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const tx = JSON.parse(body);
      // console.log(tx.data.type)
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
        'message': 'Message Tx ??',
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
      // function generateLogs(logs) {
      //   const arr = {
      //     table: {
      //       widths: ['*', 'auto'],

      //       body: [['Input', '?']],
      //     },
      //     table: {
      //       widths: ['*', 'auto'],

      //       body: [['Input', '?']],
      //     }


      //   }
      //   return arr
      // }
      const printer = new PdfPrinter(fonts);
      const docDefinition = {
        content: [
          {
            margin: [0, 0, 0, 20],
            table: {
              widths: ['*', '*'],

              body: [
                [timeToStringLocal(tx.data.timeStamp * 1000), status(tx.data.status)],
              ]
            }
          },
          { text: 'Transaction Data', fontSize: 15, alignment: 'center', bold: true, margin: [0, 30, 20, 20] },
          {
            table: {
              widths: ['*', 'auto'],

              body: [
                // [ 'First', 'Second' ],
                ['From', tx.data.from],
                ['To', tx.data.to],
                ['Block', tx.data.blockNumber],
                ['Hash', tx.data.hash],
                ['Nonce', tx.data.nonce],
                ['Value', tx.data.value],
                ['Gas Used', tx.data.gasUsed],
                ['Gas Price', tx.data.gasPrice],
                ['Fee', '0.000018 ?'],
                ['Input', tx.data.input + '?'],
              ]
            }
          },
        ]
      }

      docDefinition.content.splice(1, 0, { text: typeHeadings[tx.data.type], fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 20] })

      switch (tx.data.type) {
        case 'send-ether':
          docDefinition.content.splice(2, 0, {
            table: {
              widths: ['*', 'auto'],
              body: [
                ['Direction', 'Send ?'],
                ['Value', String(tx.data.data.value)],
                ['Recipient', tx.data.to],
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
                ['Contract', tx.data.data.contract],
                ['Value', tx.data.data.contractInfo && tx.data.data.contractInfo.decimals
                  ? new BigNumber(tx.data.data.value).dividedBy(Math.pow(10, tx.data.data.contractInfo.decimals)).dp(6).toString()
                  : new BigNumber(tx.data.data.value).dp(6).toString()],
                ['Sender', tx.data.from],
              ]
            }
          })
          break;
        case 'call':
          if (tx.data.logs.some(log => log.contractInfo)) {
            docDefinition.content.splice(2, 0, {
              table: {
                widths: [100, '*'],
                body: [
                  ['Contract Address:', tx.data.to],
                ]
              }
            })

            docDefinition.content.push({ text: 'Transfers', fontSize: 15, alignment: 'center', bold: true, margin: [0, 30, 20, 20] })

            const transfersList = tx.data.logs.filter(obj => obj.contractInfo)

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
          docDefinition.content.splice(2, 0, {
            table: {
              widths: [100, '*'],
              body: [
                ['Direction', '?'],
                ['Message', formatMessage(tx.data.data)],
              ]
            }
          })
          break;
        case 'swap':
          break;
        case 'approval':
          break;
        case 'nft-trade':
          break;
        case 'send-nft':
          const logs = tx.data.logs.filter(l => l.name === 'Transfer' && Object.keys(l.params).includes('nft_id'))
          docDefinition.content.splice(2, 0, {
            table: {
              widths: ['*', 'auto'],
              body: [
                ['Direction', 'Send ?'],
                ['Contract', logs[0]['contract']],
                ['Sender', logs[0]['params']['from']],
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

      if (tx.data.logs.length) {
        docDefinition.content.push({ text: 'Full Logs', fontSize: 15, alignment: 'center', bold: true, margin: [0, 30, 20, 20] })
        const logsFiltered = tx.data.logs.filter(l => l.name !== 'OpenSeaLog')
        logsFiltered.forEach(log => {
          //console.log('log', log.params)
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
          docDefinition.content.push(' ');
        });
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

      function capitalize (string) {
        return string.slice(0, 1).toUpperCase() + string.slice(1)
    }

    function isJsonString (str) {
      try {
          if (JSON.parse(str.message)?.moneyRequest) {
              return true
          }
      } catch (e) {
          return false
      }
  }

    function formatMessage (item, message = '', invisibleSpace) {
      if (isJsonString(item)) {
          const moneyRequest = JSON.parse(item.message)
          message = moneyRequest.moneyRequest.text || ''
          message = message.length > 15
              ? message.slice(0, 8) + '...'
              : message || invisibleSpace
      } else if (item.message) {
          message = item.message.length > 15
              ? item.message.slice(0, 8) + '...'
              : item.message
      } else {
          return invisibleSpace
      }
      return message
  }

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const fileStream = pdfDoc.pipe(fs.createWriteStream('./pdf/document.pdf'));

      //pdfDoc.pipe(fileStream);

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
      pdfDoc.pipe(fs.createWriteStream('document.pdf'));
      pdfDoc.pipe(res);

      pdfDoc.end();

      // res.send();
    } else {
      console.log('err', error)
      res.send(error)
    }
  });
})

module.exports = router
