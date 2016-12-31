// REQUIREMENT:
// * 需要先使用登录脚本登录
//
// USAGE:
// yarn run casperjs -- --cookies-file=local/douban-cookies.txt douban-add_movie_tag.js

var tag = "待定" // 需要添加的标签
var collect = "看过" // 需要处理的列表: "再看", "想看", "看过"


var _ = require("lodash");
var casper = require('casper').create({
  verbose: true,
  logLevel: "debug",
  pageSettings: {
    loadImages: false
  }
});

// 从第一页开始处理
casper.start('https://movie.douban.com/mine', function() {
  var href = this.evaluate(function(name) {
    return $('#db-usr-profile .info li a').filter(':contains(' + name + ')').prop("href");
  }, collect);

  this.thenOpen(href, function() {
    this.emit('collect-page.ready');
  });
});

// 从指定页开始处理
// casper.start("https://movie.douban.com/people/001/collect?start=450&sort=time&rating=all&filter=all&mode=grid", function() {
//   this.emit('collect-page.ready');
// });

casper.on('collect-page.done', function() {
  var next = this.evaluate(function() {
    return $(".next a").prop("href")
  });

  if (next) {
    this.thenOpen(next, function() {
      this.emit('collect-page.ready');
    })
  } else {
    this.echo("ALL PAGE DONE")
  }
});

casper.on('collect-page.ready', function() {
  var movieInfos = this.evaluate(function() {
    return $(".grid-view .item").map(function() {
      var info = $(this);
      var tagList = info.find(".tags").text().replace(/^标签:/, "").trim();
      var tags = [];
      if (tagList != "") {
        tags = tagList.split(/\s+/);
      }

      var name = info.find(".title a em").text();
      var id = info.find(".a_collect_btn").attr("name");

      return {
        name: name,
        id: id,
        tags: tags
      }
    }).toArray();
  });

  var movieInfo = _.find(movieInfos, function(info) {
    return !_.includes(info.tags, tag)
  });

  if (movieInfo) {
    this.emit('collect.item', movieInfo);
  } else {
    this.wait(2000, function() {
      this.emit("collect-page.done");
    });
  }
});

casper.on('collect.item', function(movieInfo) {
  this.echo("START add [" + tag + "] to " + movieInfo.name + "");
  this.evaluate(function(id) {
    $("[name=" + id + "]").click();
  }, movieInfo.id);

  this.waitForSelector("form.movie-sns", function() {
    this.fill(".movie-sns", {
      "tags": movieInfo.tags.concat([ tag ]).join(" ")
    }, true);
    this.echo("submit")
  }, null, 30000);

  this.wait(1000, function() {
    this.waitForSelector("[name=" + movieInfo.id + "]", function() {
      this.wait(4000, function() {
        this.emit('collect-page.ready');
      })
    }, null, 20000);
  })
});

casper.run();
