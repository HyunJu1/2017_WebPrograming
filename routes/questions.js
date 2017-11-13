const express = require('express');
const Question = require('../models/question');
const Answer = require('../models/answer');
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
      {type: {'$regex': term, '$options': 'i'}},
      {tags: {'$regex': term, '$options': 'i'}}
    ]};
  }
  const questions = await Question.paginate(query, {   //여기서 await.
    sort: {createdAt: -1},
    populate: 'author',
    page: page, limit: limit
  });
  res.render('questions/index', {questions: questions, term: term});
  res.render('index', {questions: questions, term: term});
}));

router.get('/new', needAuth, (req, res, next) => {
  res.render('questions/new', {question: {}});
});

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id);
  res.render('questions/edit', {question: question});
}));

router.get('/:id', catchErrors(async (req, res, next) => {  //글을 눌렀을때 글의 내용을 보여쥼
  const question = await Question.findById(req.params.id).populate('author');
  const answers = await Answer.find({question: question.id}).populate('author');
  question.numReads++;    // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록???
  await question.save();               //옛날 방식으로 했다면 훨씬 코드가 길어진다. 콜백의 중복. 그래도 옛날 방식으로 해도됨,,
  res.render('questions/show', {question: question, answers: answers});
  res.render('index', {question: question, answers: answers});

}));

router.put('/:id', catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    req.flash('danger', 'Not exist question');
    return res.redirect('back');
  }
  question.title = req.body.title;
  question.content = req.body.content;
  quetion.image = req.body.image;
  question.location=req.body.location;
  question.type=req.body.type.value;
  question.startTime=req.body.startTime;
  question.endTime=req.body.endTime;
  question.RegisOrgan=req.body.RegisOrgan;
  question.RegisOrganCon=req.body.RegisOrganCon;
  question.tags = req.body.tags.split(" ").map(e => e.trim());

  await question.save();
  req.flash('success', 'Successfully updated');
  res.redirect('/questions');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  await Question.findOneAndRemove({_id: req.params.id});
  req.flash('success', 'Successfully deleted');
  res.redirect('/questions');
}));

router.post('/', needAuth, catchErrors(async (req, res, next) => {
  const user = req.user;
  var question = new Question({
    title: req.body.title,
    author: user._id,
    content: req.body.content,
    image: req.body.image,
    type : req.body.type,
    location: req.body.location,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    RegisOrgan: req.body.RegisOrgan,
    RegisOrganCon: req.body.RegisOrganCon,
    tags: req.body.tags.split(" ").map(e => e.trim()),
  });
  await question.save();
  req.flash('success', 'Successfully posted');
  res.redirect('/questions');
}));

router.post('/:id/answers', needAuth, catchErrors(async (req, res, next) => { //댓글 관련. 댓글 post
  const user = req.session.user;
  const question = await Question.findById(req.params.id);

  if (!question) {
    req.flash('danger', 'Not exist question');
    return res.redirect('back');
  }

  var answer = new Answer({
    author: user._id,
    question: question._id,
    content: req.body.content
  });
  await answer.save();
  question.numAnswers++;  //답변은 2개가 달렸으나 숫자는 1개가 나오는 상황이 나올 수 있음
  await question.save();   //실무에서는 항상 concurrent를 고려해야한다.

  req.flash('success', 'Successfully answered');
  res.redirect(`/questions/${req.params.id}`);
}));



module.exports = router;
