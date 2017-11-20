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
