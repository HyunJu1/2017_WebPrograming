// var express = require('express');
// var app = express();
// var client_id = 'hQ3CLNSEap1QI_xXXu4t';
// var client_secret = 'AMwhOkQXID';
// var state = "RANDOM_STATE";
// var redirectURI = encodeURI("http://localhost:3000/auth");
// var api_url = "";
// app.get('/auth/naverlogin', function (req, res) {
//   api_url = 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirectURI + '&state=' + state;
//    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
//    res.end("<a href='"+ api_url + "'><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>");
//  });
//  app.get('/callback', function (req, res) {
//     code = req.query.code;
//     state = req.query.state;
//     api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='
//      + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirectURI + '&code=' + code + '&state=' + state;
//     var request = require('request');
//     var options = {
//         url: api_url,
//         headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
//      };
//     request.get(options, function (error, response, body) {
//       if (!error && response.statusCode == 200) {
//         res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
//         res.end(body);
//       } else {
//         res.status(response.statusCode).end();
//         console.log('error = ' + response.statusCode);
//       }
//     });
//   });
//  // app.listen(3000, function () {
//  //   console.log('http://127.0.0.1:3000/naverlogin app listening on port 3000!');
//  // });




const User = require('../models/user');
module.exports = (app, passport) => {
  app.get('/signin', (req, res, next) => {
    res.render('signin');
  });

  app.post('/signin', passport.authenticate('local-signin', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/signin', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  // kakao 로그인
  app.get('/auth/kakao',
    passport.authenticate('kakao-login')
  );

  // kakao 로그인 연동 콜백
  app.get('/oauth',
    passport.authenticate('kakao-login', {
      failureRedirect : '/signin',
      failureFlash : true // allow flash messages
    }), function(accessToken, refreshToken, profile, done){
        console.log('suuccess!');
        console.log('kakao!',profile.id, profile.name);
        User.findOne({
            'kakao.id' : profile.id
        }, function(err, user){
            if(err){
                return done(err);
            }//d
            if(!user){
                user = new User({
                    name: profile.username,
                    id: profile.id,
                    // id: profile.id,
                    // roles : ['authenticated'],
                    // provider: 'kakao',
                    kakao: profile._json
                });

                user.save(function(err){
                    if(err){
                        console.log(err);
                    }
                    return done(err, user);
                });
            }else{
                return done(err, user);
            }
        });
    }
  );

  // app.get('/auth/kakao', passport.authenticate('kakao',{
  //     failureRedirect: 'back'
  // }), user.signin);
  //
  // app.get('/oauth', passport.authenticate('kakao', {
  //     failureRedirect: 'back'
  // }), user.authCallback);




    // }), (req, res, next) => {
    //   console.log('i actually came 1!');
    //   req.flash('success', 'Welcome!');
    //   res.redirect('/');

  app.get('/auth/facebook',
    passport.authenticate('facebook', { scope : 'email' })
  );

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect : '/signin',
      failureFlash : true // allow flash messages
    }), (req, res, next) => {
      req.flash('success', 'Welcome!');
      res.redirect('/questions');
    }
  );

  app.get('/signout', (req, res) => {
    req.logout();
    req.flash('success', 'Successfully signed out');
    res.redirect('/');
  });
};
