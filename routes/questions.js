const express = require('express');
const Question = require('../models/question');
const Answer = require('../models/answer');
const User = require('../models/user');
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
  res.render('questions/index', {questions: questions, term: term});
  res.render('index', {questions: questions, term: term});
}));


router.get('/new', needAuth, (req, res, next) => {
  res.render('questions/new', {question: {}});
});


router.get('/:id/favorite', needAuth, (req, res, next) => {
  const question = Question.findById(req.params.id, function(err, question) {
    const user = User.findById(req.user.id, function(err, user) {
      user.favorite.push(question._id);
      user.save(function(err) {
        req.flash('success', 'Successfully Add My Favorite');
        //console.log(user.favorite);
        res.redirect('back');
      });
    });
  });
});


router.get('/:id/participate', needAuth, (req, res, next) => {
  const question = Question.findById(req.params.id, function(err, question) {
    if(!question.participantLimit){
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
    }
    else {
      if(question.participantN < question.participantLimit){
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
      }
      else {
        req.flash('danger', 'Sorry, The Event Participate is full');
        return res.redirect('back');
      }
    }
  });
});

router.get('/:id/participantL', (req, res, next) => {
  var questions=Question.findById(req.params.id, function(err, questions) {
    //console.log(question.title);
    var users = User.find({_id: questions.participantL}, function(err, users) {
    //  console.log(question.participantL);
      res.render('questions/participant_list', {users: users, questions: questions});
    })
  })
})

router.get('/:id/survey',  (req, res, next) => {
  const questions = Question.findById(req.params.id, function(err, questions) {
    const surveys = Survey.find({question: questions.id}, function(err, surveys) {
      res.render('questions/participant_survey_result', { questions: questions, surveys: surveys});
    });
  });
});
router.get('/:id/edit', catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id);
  res.render('questions/edit', {question: question});
}));




router.get('/:id', catchErrors(async (req, res, next) => {  //글을 눌렀을때 글의 내용을 보여쥼
  const question = await Question.findById(req.params.id).populate('author');
  const answers = await Answer.find({question: question.id}).populate('author');
  question.numReads++;    // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록???
  await question.save();
  //console.log(question);             //옛날 방식으로 했다면 훨씬 코드가 길어진다. 콜백의 중복. 그래도 옛날 방식으로 해도됨,,
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
  question.eventType =req.body.eventType;
  question.startTime=req.body.startTime;
  question.endTime=req.body.endTime;
  question.location_latLng=req.body.location_latLng;
  question.editor=req.body.editor;
  question.location_map=req.body.location_map;
  question.startTime=req.body.startTime;
  question.participantLimit=req.body.participantLimit;
  question.RegisOrgan=req.body.RegisOrgan;
  question.RegisOrganCon=req.body.RegisOrganCon;
  question.price=req.body.price;
  question.tags = req.body.tags.split(" ").map(e => e.trim());
  await question.save();
  req.flash('success', 'Successfully updated');
  res.redirect('/questions');
}));

router.delete('/:id', catchErrors(async (req, res, next) => {
  await Question.findOneAndRemove({_id: req.params.id});
  req.flash('success', 'Successfully deleted');
  res.redirect('/questions');
}));

router.post('/', needAuth, catchErrors(async (req, res, next) => {
  const user = req.user;
  //console.log(req.body);
  var question = new Question({
    title: req.body.title,
    author: user._id,
    content: req.body.content,
    image: req.body.image,
    editor: req.body.editor,
    location_map: req.body.location_map,
    location_latLng: req.body.location_latLng,
    participantLimit: req.body.participantLimit,
    location: req.body.location,
    topic: req.body.topic,
    eventType: req.body.eventType,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    RegisOrgan: req.body.RegisOrgan,
    RegisOrganCon: req.body.RegisOrganCon,
    price: req.body.price,
    tags: req.body.tags.split(" ").map(e => e.trim())
  });
  await question.save();
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

router.post('/:id/surveys', catchErrors(async (req, res, next) => {
  const user = req.user;
  const question = await Question.findById(req.params.id);
  var survey = new Survey({
    author: user._id,
    question: question._id,
    survey_sosok: req.body.survey_sosok,
    survey_reason: req.body.survey_reason
  });
  await survey.save();
  //console.log('author:', survey.author);
  //console.log('question:', survey.question);
  req.flash('success', 'Thank You For Survey! You Successfully Registered to Participate!');
  res.redirect('/');
}));



router.get('/:id/survey',  (req, res, next) => {
  const questions = Question.findById(req.params.id, function(err, questions) {
    const surveys = Survey.find({question: questions.id}, function(err, surveys) {
      res.render('questions/participant_survey_result', { questions: questions, surveys: surveys});
    });
  });
});

module.exports = router;
