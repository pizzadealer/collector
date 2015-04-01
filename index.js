(function () {
  'use strict'
  var nodegit = require('nodegit')
  var CronJob = require('cron').CronJob
  var request = require('request')
  var cheerio = require('cheerio')
  var fs = require('fs')
  var exec = require('exec')
  var express = require('express')
  var app = express()
  var clone = nodegit.Clone.clone
  var user = process.env.TOKEN,
    pass = 'x-oauth-basic',
    repo,
    oid,
    remote

  app.set('port', (process.env.PORT || 5000))
  app.get('/', function (request, response) {
    response.send('PIZZA!')
  })

  app.listen(app.get('port'), function () {
    console.log('Node app is running at localhost:' + app.get('port'))
  })

  clone('https://' + encodeURIComponent(user) + ':' + encodeURIComponent(pass) + '@github.com/pizzadealer/data.git', 'data', {
    remoteCallbacks: {
      credentials: function () {
        return nodegit.Cred.userpassPlaintextNew(user, pass)
      }
    }
  }).then(function (repoResult) {
    console.log(repoResult)
    repo = repoResult
    return repoResult.openIndex()
  }).then(function (indexResult) {
    var index = indexResult
    console.log(index)
    var job = new CronJob('0 * * * *', function () {
      var deliveryareas = require('./data/deliveryareas.json')
      for (var i = 0;i < deliveryareas.length;i++) {
        request({
          uri: 'https://pizza.de/' + deliveryareas[i]
        }, function (error, response, body) {
          if (error) throw error
          var $ = cheerio.load(body)
          var timestamp = new Date().getTime()
          var service, row, link, text
          var da = response.request.path.replace(/\//g, '')
          console.log($('span.discount-value').length + ' deals found.')
          $('span.discount-value').each(function () {
            service = $(this)
            row = service.parents('.srow')
            link = $(row).children('.pdv').children('a')
            text = timestamp + ',' + service.text().replace(/[^0-9]/g, '') + ',' + link.attr('href') + '\n'
            fs.appendFile('data/' + da + '.csv', text, function (err) {
              if (err) throw err

              exec('git config --global user.name "' + user + '"',  function (error, stdout, stderr) {
                  console.log('stdout: ' + stdout)
                  console.log('stderr: ' + stderr)
                  if (error !== null) {





              index.addAll('.').then(function (result) {
                index.write()
                return index.writeTree()
              }).then(function (oidResult) {
                oid = oidResult
                return nodegit.Reference.nameToId(repo, 'HEAD')
              }).then(function (head) {
                return repo.getCommit(head)
              }).then(function (parent) {
                var author = nodegit.Signature.now('Pizzadealer', 'pizzadealer@pizza')
                var committer = nodegit.Signature.now('Pizzadealer', 'pizzadealer@pizza')
                return repo.createCommit('HEAD', author, committer, 'New Data', oid, [parent])
              }).then(function (commitId) {
                return console.log('New Commit: ', commitId)
              }).then(function () {
                return repo.getRemote('origin')
              }).then(function (remoteResult) {
                console.log('remote Loaded')
                remote = remoteResult
                remote.setCallbacks({
                  credentials: function (url, userName) {
                    return nodegit.Cred.userpassPlaintextNew(user, pass)
                  }
                })
                console.log('remote Configured')
                return remote.connect(nodegit.Enums.DIRECTION.PUSH)
              }).then(function () {
                console.log('remote Connected?', remote.connected())
                return remote.push(
                  ['refs/heads/master:refs/heads/master'],
                  null,
                  repo.defaultSignature(),
                  'Push to master').then(function (number) {
                  console.log(number)
                })
              }).then(function () {
                console.log('remote Pushed!')
              }).catch(function (reason) {
                console.log(reason)
              })

            }
        })

            })
          })
        })
      }
    }, null, true, 'Europe/Berlin')
    return job
  })
})()
