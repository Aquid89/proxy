const express = require('express')
const router = express.Router()
var request = require('request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const cors = require('cors')


const PdfPrinter = require('pdfmake');
const fs = require('fs');

const BigNumber = require('bignumber.js');

const Contract = require('./contract.js');
const QRCode = require('qrcode');
const path = require('path');
router.get('/generate', cors(), (req, res) => {
  var customHeaders = {
  };
  var requestOptions = {
    url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0x2cc0421ad8657aa9d39aa288bafdccd4c30d902d636d57612ab699018b3e9591?blockchain=ethereum',
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
      QRCode.toDataURL('Your Data Here', (err, qrCodeURL) => {
        if (err) {
          console.error('Error generating QR code:', err);
          return res.status(500).send('Internal Server Error');
        }
      const printer = new PdfPrinter(fonts);
      const docDefinition = {
        content: [
          {
            margin: [0, 0, 0, 20],
            table: {
              widths: ['*', '*', '*'],

              body: [
                [timeToStringLocal(tx.data.timeStamp * 1000), status(tx.data.status), {image: qrCodeURL}],
              ]
            }
          },
          { text: 'Transaction Data', fontSize: 15, alignment: 'center', bold: true, margin: [0, 30, 20, 20] },
          {
            fontSize: 10,
            table: {
              widths: ['*', 'auto'],

              body: [
                // [ 'First', 'Second' ],
                ['From', tx.data.from],
                ['To', tx.data.to],
                ['Block', tx.data.blockNumber],
                ['Hash', tx.data.hash],
                ['Nonce', tx.data.nonce],
                ['Value', tx.data.value + ' ETH'],
                ['Gas Used', tx.data.gasUsed],
                ['Gas Price', tx.data.gasPrice],
                ['Fee', '0.000018 ?'],
                ['Input', tx.data.input],
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

              if (transfersList.some(l => l.name === 'Withdrawal')) {
                docDefinition.content.push({ text: 'Ether', fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 5] });
                docDefinition.content.push({
                  table: {
                    widths: [70, '*'],
                    body: [['Direction', 'Received'], ['Value', generalRounding(calcLogEntryValue(transfersList.filter(l => l.name === 'Withdrawal')[0])) + ' ETH'], ['Sender', transfersList.filter(l => l.name === 'Withdrawal')[0].params.src]]
                  }
                })
              }
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

   
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const fileStream = pdfDoc.pipe(fs.createWriteStream('./pdf/document.pdf'));

      pdfDoc.pipe(fs.createWriteStream('document.pdf'));
      pdfDoc.pipe(res);

      pdfDoc.end();
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

      function capitalize(string) {
        return string.slice(0, 1).toUpperCase() + string.slice(1)
      }

      function isJsonString(str) {
        try {
          if (JSON.parse(str.message)?.moneyRequest) {
            return true
          }
        } catch (e) {
          return false
        }
      }

      function formatMessage(item, message = '', invisibleSpace) {
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

      function generalRounding(number, places = 6) {
        let result, left, right
        let string = String(number)

        if (string.includes('e') || string === '') {
          return number
        }

        if (string.includes('.')) {
          left = string.split('.')[0]
          right = string.split('.')[1]
        } else {
          left = string
          right = ''
        }

        if (left.length > places) {
          // metric prefixes
          if (left.length <= 9) result = (left / Math.pow(10, 6)).toFixed(1) + ' ' + i18n.t('base.M')
          else if (left.length <= 12) result = (left / Math.pow(10, 9)).toFixed(1) + ' ' + i18n.t('base.B')
          else if (left.length <= 15) result = (left / Math.pow(10, 12)).toFixed(1) + ' ' + i18n.t('base.T')
          else result = (left / Math.pow(10, 15)).toFixed(1) + ' ' + i18n.t('base.Q')
        } else {
          result = Number(left + '.' + right.slice(0, places - left.length))
        }
        return result
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
  

      // res.send();
    } else {
      console.log('err', error)
      res.send(error)
    }
  });
})

module.exports = router
