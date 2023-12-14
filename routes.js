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
    url: 'https://api-dev-full.sinum.io/widgets/explorer/transaction/0x2cc0421ad8657aa9d39aa288bafdccd4c30d902d636d57612ab699018b3e9591=ethereum',
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
            docDefinition.content.push({ text: 'Transfers', fontSize: 15, alignment: 'center', bold: true, margin: [0, 30, 20, 20] })

            const transfersList = tx.data.logs.filter(obj => obj.contractInfo)

            console.log('transfersList', transfersList)
            if (transfersList.length) {
              // docDefinition.content.push({ text: 'Full Logs', fontSize: 15, alignment: 'center', bold: true, margin: [0, 30, 20, 20] })
              console.log('transfersList', transfersList)
              for (var i = 0; i < transfersList.length; i++) {
                // Title transfer
                if (transfersList[i].contractInfo.name) {
                  docDefinition.content.push({ text: transfersList[i].contractInfo.name, fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 5] })
                } else {
                  docDefinition.content.push({ text: transfersList[i].contractInfo.address, fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 5] })
                }
                // Body transfer
                if (transfersList[i].name === 'Transfer') {
                  docDefinition.content.push({
                    table: {
                      widths: [70, '*'],
                      body: [
                        ['Direction', 'addressCurrent??'],
                        ['Contract', transfersList[i].contractInfo.address],
                        ['Value', calcLogEntryValue(transfersList[i]) + ' ' + transfersList[i].contractInfo.symbol],
                        ['Recipient', transfersList[i].params.to],
                      ]
                    }
                  })
                } else if (transfersList[i].name === 'Deposit') {
                  docDefinition.content.push({
                    table: {
                      widths: [70, '*'],
                      body: [
                        ['Direction', 'Received'],
                        ['Contract', transfersList[i].contractInfo.address],
                        ['Value', calcLogEntryValue(transfersList[i]) + ' ' + transfersList[i].contractInfo.symbol],
                        ['Sender', transfersList[i].params.user],
                      ]
                    }
                  })

                } else if (transfersList[i].name === 'Withdrawal') {
                  docDefinition.content.push({
                    table: {
                      widths: [70, '*'],
                      body: [
                        ['Direction', 'Sent'],
                        ['Contract', transfersList[i].contractInfo.address],
                        ['Value', calcLogEntryValue(transfersList[i]) + ' ' + transfersList[i].contractInfo.symbol],
                        ['Recipient', transfersList[i].params.src],
                      ]
                    }
                  })

                }


                docDefinition.content.push(' ');
              }
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
        for (var i = 0; i < tx.data.logs.length; i++) {
          docDefinition.content.push({
            table: {
              widths: [70, '*'],
              body: [
                ['Name', tx.data.logs[i].name],
                ['Contract', tx.data.logs[i].contract],
                ['Owner', tx.data.logs[i].params?.owner ? tx.data.logs[i].params.owner : null],
                ['Spender', tx.data.logs[i].params?.spender ? tx.data.logs[i].params.spender : null],
                ['Value', tx.data.logs[i].params?.value ? tx.data.logs[i].params.value : null],
                ['Nft id', tx.data.logs[i].params?.nft_id ? tx.data.logs[i].params.nft_id : null],

              ],

            }
          })

          docDefinition.content.push(' ');
        }
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
