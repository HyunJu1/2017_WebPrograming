const express = require('express');
const Event = require('../models/event');
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
  const events = await Event.paginate(query, {   //여기서 await.
    sort: {createdAt: -1},
    populate: 'author',
    page: page, limit: limit
  });
  res.render('events/index', {events: events, term: term});
  res.render('index', {events: events, term: term});
}));


router.get('/new', needAuth, (req, res, next) => {
  res.render('events/new', {event: {}});
});


router.get('/:id/favorite', needAuth, (req, res, next) => {
  const event = Event.findById(req.params.id, function(err, event) {
    const user = User.findById(req.user.id, function(err, user) {
      user.favorite.push(event._id);
      user.save(function(err) {
        req.flash('success', 'Successfully Add My Favorite');
        res.redirect('back');
      });
    });
  });
});

router.get('/:id/participate', needAuth, (req, res, next) => {
  const event = Event.findById(req.params.id, function(err, event) {
    if(!event.participantLimit){
      event.participantN++;
      event.participantL.push(req.user.id);
      event.save();
      if (event.participantN>3) {
        event.recommend.push(event._id);
        event.save();
        console.log('event.recommend',event.recommend);
      }
      req.flash('success', 'Successfully Registered');
      res.render('events/participant_survey', {event: event});
      }
    else {
      if(event.participantN < event.participantLimit){
        event.participantN++;
        event.participantL.push(req.user.id);
        event.save();
        if (event.participantN>3) {
          event.recommend.push(recommend._id);
          event.save();
          console.log(event.recommend);
        }
        req.flash('success', 'Successfully Registered');
        res.render('events/participant_survey', {event: event});
      }
      else {
        req.flash('danger', 'Sorry, The Event Participate is full');
        return res.redirect('back');
      }
    }
  });
});

router.get('/:id/participantL', (req, res, next) => {
  var events=Event.findById(req.params.id, function(err, events) {
    //console.log(event.title);
    var users = User.find({_id: events.participantL}, function(err, users) {
    //  console.log(event.participantL);
      res.render('events/participant_list', {users: users, events: events});
    })
  })
})

router.get('/:id/survey',  (req, res, next) => {
  const events = Event.findById(req.params.id, function(err, events) {
    const surveys = Survey.find({event: events.id}, function(err, surveys) {
      res.render('events/participant_survey_result', { events: events, surveys: surveys});
    });
  });
});
router.get('/:id/edit', catchErrors(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  res.render('events/edit', {event: event});
}));




router.get('/:id', catchErrors(async (req, res, next) => {  //글을 눌렀을때 글의 내용을 보여쥼
  const event = await Event.findById(req.params.id).populate('author');
  const answers = await Answer.find({event: event.id}).populate('author');
  event.numReads++;    // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록???
  await event.save();
  //console.log(event);             //옛날 방식으로 했다면 훨씬 코드가 길어진다. 콜백의 중복. 그래도 옛날 방식으로 해도됨,,
  res.render('events/show', {event: event, answers: answers});
  res.render('index', {event: event, answers: answers});

}));

router.post('/:id', catchErrors(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    req.flash('danger', 'Not exist event');
    return res.redirect('back');
  }
  event.title = req.body.title;
  event.content = req.body.content;
  //quetion.image = req.body.image;
  event.location=req.body.location;
  event.topic =req.body.topic;
  event.eventType =req.body.eventType;
  event.startTime=req.body.startTime;
  event.endTime=req.body.endTime;
  event.location_latLng=req.body.location_latLng;
  event.editor=req.body.editor;
  event.lat=req.body.lat;
  event.lng=req.body.lng;
  event.location_map=req.body.location_map;
  event.startTime=req.body.startTime;
  event.participantLimit=req.body.participantLimit;
  event.RegisOrgan=req.body.RegisOrgan;
  event.RegisOrganCon=req.body.RegisOrganCon;
  event.price=req.body.price;
  event.tags = req.body.tags.split(" ").map(e => e.trim());
  await event.save();
  req.flash('success', 'Successfully updated');
  res.redirect('/events');
}));

router.delete('/:id', catchErrors(async (req, res, next) => {
  await Event.findOneAndRemove({_id: req.params.id});
  req.flash('success', 'Successfully deleted');
  res.redirect('/events');
}));

router.post('/', needAuth, catchErrors(async (req, res, next) => {
  const user = req.user;
  //console.log(req.body);
  var event = new Event({
    title: req.body.title,
    author: user._id,
    content: req.body.content,
    image: req.body.image,
    editor: req.body.editor,
    location_map: req.body.location_map,
    location_latLng: req.body.location_latLng,
    lat: req.body.lat,
    lng: req.body.lng,
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
  await event.save();
  req.flash('success', 'Successfully posted');
  res.redirect('/events');
}));



router.post('/:id/answers', needAuth, catchErrors(async (req, res, next) => { //댓글 관련. 댓글 post
  const user = req.user;
  const event = await Event.findById(req.params.id);

  if (!event) {
    req.flash('danger', 'Not exist event');
    return res.redirect('back');
  }

  var answer = new Answer({
    author: user._id,
    event: event._id,
    content: req.body.content
  });
  await answer.save();
  event.numAnswers++;  //답변은 2개가 달렸으나 숫자는 1개가 나오는 상황이 나올 수 있음
  await event.save();   //실무에서는 항상 concurrent를 고려해야한다.

  req.flash('success', 'Successfully answered');
  res.redirect(`/events/${req.params.id}`);
}));

router.post('/:id/surveys', catchErrors(async (req, res, next) => {
  const user = req.user;
  const event = await Event.findById(req.params.id);
  var survey = new Survey({
    author: user._id,
    event: event._id,
    survey_sosok: req.body.survey_sosok,
    survey_reason: req.body.survey_reason
  });
  await survey.save();
  //console.log('author:', survey.author);
  //console.log('event:', survey.event);
  req.flash('success', 'Thank You For Survey! You Successfully Registered to Participate!');
  res.redirect('/');
}));



router.get('/:id/survey',  (req, res, next) => {
  const events = Event.findById(req.params.id, function(err, events) {
    const surveys = Survey.find({event: events.id}, function(err, surveys) {
      res.render('events/participant_survey_result', { events: events, surveys: surveys});
    });
  });
});

module.exports = router;
