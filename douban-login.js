// USAGE:
// yarn run casperjs -- --cookies-file=local/douban-cookies.txt douban-login.js

var email = "account@douban.com" // 豆瓣帐号
var password = "PASSWORD" // 豆瓣密码


var casper = require('casper').create({
  verbose: true,
  logLevel: "debug",
  pageSettings: {
    loadImages: false
  }
});

casper.start('https://www.douban.com/', function() {
  if (this.exists("#lzform")) {
    this.fill('#lzform', {
      'form_email': email,
      'form_password': password,
      'remember': true
    }, true);
  }
});

casper.waitForSelector(".nav-user-account", function() {
  this.echo("login success");
})

casper.run();
