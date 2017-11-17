const express = require('express');
const Question = require('../models/question');
const Answer = require('../models/answer');
const User = require('../models/user');
const Survey = require('../models/survey');
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
// router.get('/new', needAuth, function(req, res, next) {
// 	User.find({}, function(err, users) {
// 		if (err) {
// 			return next(err);
// 		}
// 		res.render('questions/new')
// 	});
// });

router.get('/:id/participate', needAuth, (req, res, next) => {
  const question =Question.findById(req.params.id, function(err, question) {
    if (err) {
      return next(err);
    }
    question.participantN++;
    question.participantL.push(req.user.id);
    question.save(function(err) {
      if (err) {
        return next(err);
      } else {
        req.flash('success', 'Successfully Registered');
        res.render('questions/participant_survey', {question: question});
      }
    });
  });
});

router.get('/:id/participantL', needAuth, catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id);
  console.log(question.participantL);
  const user=  await User.find({_id: question.participantL});
  res.render('questions/participant_list', {user: user , question: question});

}));


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

router.post('/:id', catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    req.flash('danger', 'Not exist question');
    return res.redirect('back');
  }
  question.title = req.body.title;
  question.content = req.body.content;
  //quetion.image = req.body.image;
  question.location=req.body.location;
  question.topic =req.body.topic;
  question.startTime=req.body.startTime;
  question.endTime=req.body.endTime;
  question.editor1=req.body.editor1;
  question.RegisOrgan=req.body.RegisOrgan;
  question.RegisOrganCon=req.body.RegisOrganCon;
  question.price=req.body.price;
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
    editor1: req.body.editor1,
    location: req.body.location,
    topic: req.body.topic,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    RegisOrgan: req.body.RegisOrgan,
    RegisOrganCon: req.body.RegisOrganCon,
    price: req.body.price,
    tags: req.body.tags.split(" ").map(e => e.trim())
  });
  await question.save();
   //console.log('topic:',topic)
  req.flash('success', 'Successfully posted');
  res.redirect('/questions');
}));







router.post('/:id/answers', needAuth, catchErrors(async (req, res, next) => { //댓글 관련. 댓글 post
  const user = req.user;
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

router.post('/:id/surveys', needAuth, catchErrors(async (req, res, next) => {
  const user = req.user;
  const question = await Question.findById(req.params.id);
  var survey = new Survey({
    author: user._id,
    question: question._id,
    survey_sosok: req.body.survey_sosok,
    survey_reason: req.body.survey_reason
  });
  await survey.save();
  console.log('author:', survey.author);
  console.log('question:', survey.question);
  req.flash('success', 'Thank You For Survey!');
  res.redirect('/');
}));


router.get('/:id/survey', needAuth, catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id).populate('author');
  const survey = await Survey.find({question: question.id}).populate('author');
  console.log('author:', survey.author);
  console.log('question:', survey.question);
  res.render('questions/participant_survey_result', {survey: survey , question: question});
}));



module.exports = router;
