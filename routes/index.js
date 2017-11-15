var express = require('express'),
  User = require('../models/user');
//var router = express.Router();


const Question = require('../models/question');

const catchErrors = require('../lib/async-error');

const router = express.Router();

// 동일한 코드가 users.js에도 있습니다. 이것은 나중에 수정합시다.
function needAuth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash('danger', 'Please signin first.');
      res.redirect('/signin');
    }
}

/* GET questions listing. */
/* Users.js는 옛날방식이다. question.js는 최신구문을 이용하여 간단하게 구현. */
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

// // 09-1. Session 참고: 세션을 이용한 로그인
// router.post('/signin', function(req, res, next) {
//   User.findOne({email: req.body.email}, function(err, user) {
//     if (err) {
//       res.render('error', {message: "Error", error: err});
//     } else if (!user || user.password !== req.body.password) {
//       req.flash('danger', 'Invalid username or password.');
//       res.redirect('back');
//     } else {
//       req.session.user = user;
//       req.flash('success', 'Welcome!');
//       res.redirect('/');
//     }
//   });
// });

// router.get('/signout', function(req, res, next) {
//   delete req.session.user;
//   req.flash('success', 'Successfully signed out.');
//   res.redirect('/');
// });

router.get('/signout', function (req, res){

  req.session.destroy(function (err) {
    res.redirect('/'); //Inside a callback… bulletproof!
  });
});

module.exports = router;
