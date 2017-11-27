var cool = require('cool-ascii-faces');
var express = require('express'),
  User = require('../models/user');
const Question = require('../models/question');
const Survey = require('../models/survey');
const catchErrors = require('../lib/async-error');
const router = express.Router();


function needAuth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash('danger', 'Please signin first.');
      res.redirect('/signin');
    }
}
router.get('/cool', function(request, response) {
  response.send(cool());
});
router.get('/', catchErrors(async (req, res, next) => {  //await를 사용하기 위해서 "async"
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  if (term) {
    query = {$or: [
      {title: {'$regex': term, '$options': 'i'}},
      {content: {'$regex': term, '$options': 'i'}},
      {location: {'$regex': term, '$options': 'i'}},
      {topic: {'$regex': term, '$options': 'i'}},
      {tags: {'$regex': term, '$options': 'i'}}
    ]};
  }
  const questions = await Question.paginate(query, {   //여기서 await.
    sort: {createdAt: -1},
    populate: 'author',
    page: page, limit: limit
  });
  //console.log(questions)
  res.render('index', {questions: questions, term: term});
}));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/signin', function(req, res, next) {
  res.render('signin');
});


router.get('/signout', function (req, res){

  req.session.destroy(function (err) {
    res.redirect('/');
  });
});

module.exports = router;
